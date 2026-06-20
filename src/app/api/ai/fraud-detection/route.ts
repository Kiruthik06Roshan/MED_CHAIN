import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('actor_id, actor_role, action, scope, result, timestamp')
      .eq('target_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(50);

    const { data: existingAlerts } = await supabase
      .from('fraud_alerts')
      .select('*')
      .eq('patient_id', user.id)
      .eq('triaged_at', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (existingAlerts && existingAlerts.length > 0) {
      return NextResponse.json(existingAlerts.map(formatAlert));
    }

    if (!process.env.GROQ_API_KEY || !auditLogs?.length) {
      return NextResponse.json([]);
    }

    const logSummary = auditLogs.slice(0, 10).map(l =>
      `${l.timestamp}: ${l.actor_role} (${l.actor_id?.slice(0, 8)}) ${l.action} [${l.scope?.join(',')}] -> ${l.result}`
    ).join('\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a healthcare fraud analyst. Analyze these access logs for anomalies. Logs:\n${logSummary}\n
        Return a JSON array of alerts (max 2), each with: score (0-100 integer), indicator (short title), explanation (one sentence), affectedData (array of strings). Return only valid JSON array.`,
      }],
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content ?? '[]';
    let parsed: Array<{ score: number; indicator: string; explanation: string; affectedData: string[] }> = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      parsed = match ? JSON.parse(match[0]) : [];
    } catch { parsed = []; }

    const now = new Date().toISOString();
    const alerts = parsed
      .filter(a => a.score >= 30)
      .map(a => ({
        id: crypto.randomUUID(),
        score: Math.min(100, Math.max(0, a.score)),
        indicator: a.indicator,
        explanation: a.explanation,
        affectedData: a.affectedData ?? [],
        timestamp: now,
        isTriaged: false,
      }));

    if (alerts.length > 0) {
      await supabase.from('fraud_alerts').insert(alerts.map(a => ({
        id: a.id,
        patient_id: user.id,
        fraud_score: a.score,
        indicator: a.indicator,
        explanation: a.explanation,
        affected_data: a.affectedData,
        created_at: a.timestamp,
      })));
    }

    return NextResponse.json(alerts);
  } catch (err) {
    console.error('[ai/fraud-detection] error:', err);
    return NextResponse.json([]);
  }
}

function formatAlert(r: Record<string, unknown>) {
  return {
    id: r.id,
    score: r.fraud_score,
    indicator: r.indicator,
    explanation: r.explanation,
    affectedData: r.affected_data ?? [],
    timestamp: r.created_at,
    isTriaged: !!r.triaged_at,
  };
}
