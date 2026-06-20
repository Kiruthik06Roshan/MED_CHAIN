import { cookies } from "next/headers";
import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const requestSchema = z.object({
  recordId: z.string().uuid(),
  doctorId: z.string().uuid(),
  patientAddress: z.string(),
  signature: z.string(),
  message: z.string(),
});

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

    const payload = requestSchema.parse(await request.json());
    const recovered = ethers.verifyMessage(payload.message, payload.signature);

    if (recovered.toLowerCase() !== payload.patientAddress.toLowerCase()) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { data: record, error: recordError } = await supabase
      .from("health_records")
      .select("id, patient_id")
      .eq("id", payload.recordId)
      .single();

    if (recordError || !record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    if (record.patient_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: existingGrant } = await supabase
      .from("access_grants")
      .select("id")
      .eq("record_id", payload.recordId)
      .eq("granted_to", payload.doctorId)
      .eq("status", "active")
      .maybeSingle();

    if (existingGrant) {
      return NextResponse.json({ error: "Active grant already exists" }, { status: 409 });
    }

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    const { error: grantError } = await supabase.from("access_grants").insert({
      patient_id: session.user.id,
      granted_to: payload.doctorId,
      record_id: payload.recordId,
      signature: payload.signature,
      status: "active",
      expires_at: expiresAt,
    });

    if (grantError) {
      return NextResponse.json({ error: grantError.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "grant_access",
      target_id: payload.recordId,
      ip_address: request.headers.get("x-forwarded-for") ?? null,
    });

    return NextResponse.json(
      {
        success: true,
        signature: payload.signature,
        expiresAt,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}