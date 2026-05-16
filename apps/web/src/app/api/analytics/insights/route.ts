import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface InsightRequest {
  scope: 'owner' | 'admin';
  period: string;
  kpis: { title: string; value: string; change: string }[];
  topItems?: { name: string; sold: number; revenue: number; change: number }[];
  revenue?: { day: string; revenue: number; objectif: number }[];
  categories?: { name: string; value: number }[];
}

interface Suggestion {
  title: string;
  category: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY missing on server' },
      { status: 503 },
    );
  }

  let body: InsightRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const prompt = buildPrompt(body);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              suggestions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    category: { type: 'string' },
                    impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                    action: { type: 'string' },
                    rationale: { type: 'string' },
                  },
                  required: ['title', 'category', 'impact', 'action', 'rationale'],
                },
              },
              summary: { type: 'string' },
            },
            required: ['suggestions', 'summary'],
          },
        },
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: 'Gemini error', detail: text.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let parsed: { suggestions: Suggestion[]; summary: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'Invalid model output', raw: text.slice(0, 500) },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json(
      { error: 'Network error', detail: String(err) },
      { status: 502 },
    );
  }
}

function buildPrompt(b: InsightRequest): string {
  const lines: string[] = [];
  lines.push(`Tu es un expert en analyse de performance pour des restaurants. Analyse les données et propose des actions concrètes pour améliorer le business.`);
  lines.push(`Scope: ${b.scope === 'admin' ? 'plateforme SaaS multi-restaurants' : 'restaurant individuel'}.`);
  lines.push(`Période analysée: ${b.period}.`);
  lines.push(``);
  lines.push(`KPIs:`);
  b.kpis.forEach((k) => lines.push(`- ${k.title}: ${k.value} (évolution ${k.change})`));

  if (b.topItems?.length) {
    lines.push(``);
    lines.push(`Top articles:`);
    b.topItems.forEach((it) =>
      lines.push(`- ${it.name}: ${it.sold} unités, ${it.revenue}€, évolution ${it.change}%`),
    );
  }

  if (b.revenue?.length) {
    lines.push(``);
    lines.push(`Revenu par jour (jour: réalisé / objectif):`);
    b.revenue.forEach((d) => lines.push(`- ${d.day}: ${d.revenue}€ / ${d.objectif}€`));
  }

  if (b.categories?.length) {
    lines.push(``);
    lines.push(`Répartition par catégorie:`);
    b.categories.forEach((c) => lines.push(`- ${c.name}: ${c.value}%`));
  }

  lines.push(``);
  lines.push(`Renvoie 4 à 6 suggestions actionables en français. Chaque suggestion: title (court), category (Revenu / Opérations / Marketing / Produit / Fidélisation), impact (high/medium/low), action (étape concrète), rationale (justification basée sur les données ci-dessus).`);
  lines.push(`Inclus aussi un "summary" (2 phrases max) résumant la tendance générale.`);

  return lines.join('\n');
}
