import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch patient's medications
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('medication, dosage, status')
      .eq('patient_id', user.id)
      .eq('status', 'active');

    // Check cached insights first
    const { data: cached } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('patient_id', user.id)
      .eq('dismissed_at', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (cached && cached.length > 0) {
      return NextResponse.json(cached.map(formatInsight));
    }

    // Generate fresh insights
    if (!process.env.GROQ_API_KEY || !prescriptions?.length) {
      return NextResponse.json([]);
    }

    const medList = prescriptions.map(p => `${p.medication} (${p.dosage})`).join(', ');
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a clinical pharmacist. Analyze these medications for drug interactions, contraindications, and safety concerns. Medications: ${medList}.
        Return a JSON array of up to 3 insights, each with fields: type ('safety'|'warning'|'info'), severity ('low'|'medium'|'high'), message (one sentence), recommendation (one sentence). Return only valid JSON array.`,
      }],
      max_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content ?? '[]';
    let parsed: Array<{ type: string; severity: string; message: string; recommendation: string }> = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      parsed = match ? JSON.parse(match[0]) : [];
    } catch { parsed = []; }

    const now = new Date().toISOString();
    const insights = parsed.map(p => ({
      id: crypto.randomUUID(),
      type: p.type ?? 'info',
      severity: p.severity ?? 'low',
      message: p.message,
      recommendation: p.recommendation,
      sourceModel: 'llama-3.3-70b-versatile',
      timestamp: now,
      isDismissed: false,
    }));

    // Cache in DB
    if (insights.length > 0) {
      await supabase.from('ai_insights').insert(insights.map(i => ({
        id: i.id,
        patient_id: user.id,
        type: i.type,
        severity: i.severity,
        message: i.message,
        recommendation: i.recommendation,
        source_model: i.sourceModel,
        created_at: i.timestamp,
      })));
    }

    return NextResponse.json(insights);
  } catch (err) {
    console.error('[ai/insights] error:', err);
    return NextResponse.json([]);
  }
}

function formatInsight(r: Record<string, unknown>) {
  return {
    id: r.id,
    type: r.type,
    severity: r.severity,
    message: r.message,
    recommendation: r.recommendation,
    sourceModel: r.source_model,
    timestamp: r.created_at,
    isDismissed: !!r.dismissed_at,
  };
}
