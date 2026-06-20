import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  medications: z.array(
    z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
    }),
  ),
  patientAllergies: z.array(z.string()).optional(),
});

const responseSchema = z.object({
  status: z.enum(["safe", "warning", "danger"]),
  message: z.string(),
  interactions: z.array(
    z.object({
      drug1: z.string(),
      drug2: z.string(),
      severity: z.enum(["safe", "warning", "danger"]),
      description: z.string(),
    }),
  ),
});

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const current = rateLimitStore.get(ip);

  if (!current || now > current.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT) {
    return false;
  }

  current.count += 1;
  rateLimitStore.set(ip, current);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const payload = requestSchema.parse(await request.json());

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a clinical safety assistant. Analyze medications for interactions, allergies, duplicates. Return JSON only: {status: 'safe'|'warning'|'danger', message: string, interactions: [{drug1: string, drug2: string, severity: 'safe'|'warning'|'danger', description: string}]}",
          },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      const parsed = responseSchema.parse(content ? JSON.parse(content) : null);
      return NextResponse.json(parsed, { status: 200 });
    } catch {
      return NextResponse.json(
        {
          status: "safe",
          message: "AI check unavailable - manual review required",
          interactions: [],
        },
        { status: 200 },
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}