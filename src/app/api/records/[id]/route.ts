import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = paramsSchema.parse(await context.params);
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ error: "Session lookup failed" }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: record, error: recordError } = await supabase
      .from("health_records")
      .select("*")
      .eq("id", params.id)
      .neq("status", "archived")
      .single();

    if (recordError || !record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const isOwner = record.patient_id === session.user.id;

    let hasGrant = false;
    if (!isOwner) {
      const { data: grant } = await supabase
        .from("access_grants")
        .select("id")
        .eq("record_id", params.id)
        .eq("granted_to", session.user.id)
        .eq("status", "active")
        .maybeSingle();

      hasGrant = Boolean(grant);
    }

    if (!isOwner && !hasGrant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.user.user_metadata?.role === "doctor") {
      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "view_record",
        target_id: params.id,
        ip_address: request.headers.get("x-forwarded-for") ?? null,
      });
    }

    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = paramsSchema.parse(await context.params);
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ error: "Session lookup failed" }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: record, error: recordError } = await supabase
      .from("health_records")
      .select("id, patient_id")
      .eq("id", params.id)
      .single();

    if (recordError || !record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    if (record.patient_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: archiveError } = await supabase
      .from("health_records")
      .update({ status: "archived" })
      .eq("id", params.id);

    if (archiveError) {
      return NextResponse.json({ error: archiveError.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "create_record",
      target_id: params.id,
      ip_address: request.headers.get("x-forwarded-for") ?? null,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}