import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type CookieSetOptions = {
  path?: string;
  maxAge?: number;
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
};

function getSupabaseClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieSetOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieSetOptions) {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;
  const supabase = getSupabaseClient(request, response);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const role = session?.user.user_metadata?.role as
    | "patient"
    | "doctor"
    | "pharmacy"
    | undefined;

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");

  if (path === "/auth" && session && role) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/dashboard/${role}`;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (path.startsWith("/dashboard") && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (path === "/dashboard" && session && role) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/dashboard/${role}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (path.startsWith("/dashboard/patient") && role && role !== "patient") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/dashboard/${role}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (path.startsWith("/dashboard/doctor") && role && role !== "doctor") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/dashboard/${role}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (path.startsWith("/dashboard/pharmacy") && role && role !== "pharmacy") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/dashboard/${role}`;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth"],
};
