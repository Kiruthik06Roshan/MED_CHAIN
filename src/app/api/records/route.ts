import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const createRecordSchema = z.object({
  patientId: z.string().uuid(),
  recordType: z.enum(["prescription", "lab_report", "allergy", "note"]),
  title: z.string().min(1),
  content: z.string(),
  metadata: z.object({}).passthrough().optional(),
});

export async function GET() {
  try {
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

    const userId = session.user.id;

    const { data: ownedRecords, error: ownedError } = await supabase
      .from("health_records")
      .select("*")
      .eq("patient_id", userId)
      .neq("status", "archived")
      .order("created_at", { ascending: false });

    if (ownedError) {
      return NextResponse.json({ error: ownedError.message }, { status: 500 });
    }

    const { data: grants, error: grantsError } = await supabase
      .from("access_grants")
      .select("record_id")
      .eq("granted_to", userId)
      .eq("status", "active");

    if (grantsError) {
      return NextResponse.json({ error: grantsError.message }, { status: 500 });
    }

    const grantedRecordIds = [...new Set((grants ?? []).map((grant) => grant.record_id).filter(Boolean))];

    let grantedRecords: Array<Record<string, unknown>> = [];
    if (grantedRecordIds.length) {
      const { data, error } = await supabase
        .from("health_records")
        .select("*")
        .in("id", grantedRecordIds)
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      grantedRecords = data ?? [];
    }

    const deduped = new Map<string, Record<string, unknown>>();
    [...(ownedRecords ?? []), ...grantedRecords].forEach((record) => {
      if (typeof record.id === "string") {
        deduped.set(record.id, record);
      }
    });

    const records = [...deduped.values()].sort((a, b) => {
      const aDate = new Date(String(a.created_at ?? 0)).getTime();
      const bDate = new Date(String(b.created_at ?? 0)).getTime();
      return bDate - aDate;
    });

    return NextResponse.json(records, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const role = session.user.user_metadata?.role;
    if (role !== "doctor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = createRecordSchema.parse(await request.json());

    const { data: record, error: insertError } = await supabase
      .from("health_records")
      .insert({
        patient_id: payload.patientId,
        record_type: payload.recordType,
        title: payload.title,
        content: payload.content,
        metadata: payload.metadata ?? {},
        status: "active",
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const ipAddress = request.headers.get("x-forwarded-for") ?? null;

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "create_record",
      target_id: record.id,
      ip_address: ipAddress,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}