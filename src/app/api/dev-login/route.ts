/**
 * DEV-ONLY: /api/dev-login
 *
 * Uses the Supabase service role to:
 *  1. Confirm the user's email (bypasses OTP rate limit)
 *  2. Create a real session via signInWithPassword (after forcing a known temp password)
 *  OR return a magic link that auto-signs in without email
 *
 * DELETE THIS FILE before deploying to production.
 * Automatically blocks in NODE_ENV=production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, '');
  return NextResponse.json({ rawUrl, url });
}

export async function POST(req: NextRequest) {
  // Hard block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const body = await req.json() as { email?: string, role?: string };
  const email = body.email?.trim();
  const role = body.role?.trim() || 'PATIENT';

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  // 1. Look up user by email directly using fetch
  const listRes = await fetch(`${url}/auth/v1/admin/users`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: 'no-store'
  });

  if (!listRes.ok) {
    const errText = await listRes.text();
    console.error('List Users Error:', errText);
    return NextResponse.json({ error: errText }, { status: 500 });
  }

  const listData = await listRes.json();
  let user = listData.users.find((u: any) => u.email === email);

  // 2. If user doesn't exist, create one
  if (!user) {
    const tempPassword = 'DevLogin#123!';
    const createRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { 
          role: role.toLowerCase(), 
          full_name: 'Dev User'
        }
      }),
      cache: 'no-store'
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('Create User Error:', errText);
      return NextResponse.json({ error: errText }, { status: 500 });
    }
    user = await createRes.json();
  } else {
    // 3. Force-confirm email and reset password
    const updateRes = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_confirm: true,
        password: 'DevLogin#123!'
      }),
      cache: 'no-store'
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error('Update User Error:', errText);
      return NextResponse.json({ error: errText }, { status: 500 });
    }
  }

  // 4. Return the temp credentials for manual use
  return NextResponse.json({
    ok: true,
    method: 'password',
    email,
    password: 'DevLogin#123!',
    message: 'Email confirmed. Use these credentials on the login page.',
  });
}
