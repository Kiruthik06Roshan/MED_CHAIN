import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const createAuditLogSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum([
    "view_record",
    "grant_access",
    "revoke_access",
    "create_prescription",
    "create_record",
  ]),
  targetId: z.string().uuid().optional(),
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
      .from("audit_logs")
      .select("*, user:users(id,email,full_name)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (role === "doctor") {
      query.eq("user_id", session.user.id);
    } else if (role === "patient") {
      query.or(`user_id.eq.${session.user.id},target_id.in.(select id from health_records where patient_id='${session.user.id}')`);
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

    const payload = createAuditLogSchema.parse(await request.json());

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        user_id: payload.userId,
        action: payload.action,
        target_id: payload.targetId ?? null,
        ip_address: request.headers.get("x-forwarded-for") ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}