import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase";

const requestSchema = z.object({
  grantId: z.string().uuid(),
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

    const { data: grant, error: grantError } = await supabase
      .from("access_grants")
      .select("id, patient_id")
      .eq("id", payload.grantId)
      .single();

    if (grantError || !grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    if (grant.patient_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const revokedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("access_grants")
      .update({ status: "revoked", revoked_at: revokedAt })
      .eq("id", payload.grantId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      user_id: session.user.id,
      action: "revoke_access",
      target_id: payload.grantId,
      ip_address: request.headers.get("x-forwarded-for") ?? null,
    });

    return NextResponse.json({ success: true, revokedAt }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}