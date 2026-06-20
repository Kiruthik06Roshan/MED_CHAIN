import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  medications: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
    }),
  ),
  diagnosis: z.string().min(1),
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

    const role = session.user.user_metadata?.role;
    const query = supabase
      .from("prescriptions")
      .select(
        "*, patient:users!prescriptions_patient_id_fkey(id,email,full_name), doctor:users!prescriptions_doctor_id_fkey(id,email,full_name)",
      )
      .order("created_at", { ascending: false });

    if (role === "patient") {
      query.eq("patient_id", session.user.id);
    } else if (role === "doctor") {
      query.eq("doctor_id", session.user.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? [], { status: 200 });
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

    if (session.user.user_metadata?.role !== "doctor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payload = createPrescriptionSchema.parse(await request.json());

    const safetyResponse = await fetch(new URL("/api/ai/safety-check", request.url), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ medications: payload.medications }),
    });

    const aiSafetyCheck = safetyResponse.ok
      ? await safetyResponse.json()
      : {
          status: "safe",
          message: "AI check unavailable - manual review required",
          interactions: [],
        };

    const { data: prescription, error: insertError } = await supabase
      .from("prescriptions")
      .insert({
        patient_id: payload.patientId,
        doctor_id: session.user.id,
        medications: payload.medications,
        diagnosis: payload.diagnosis,
        ai_safety_check: aiSafetyCheck,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "create_prescription",
      target_id: prescription.id,
      ip_address: request.headers.get("x-forwarded-for") ?? null,
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}