'use client';

import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface KPI { title: string; value: string; change: string; }
interface TopItem { name: string; sold: number; revenue: number; change: number; }
interface RevenuePoint { day: string; revenue: number; objectif: number; }
interface CategoryPoint { name: string; value: number; }

interface Suggestion {
  title: string;
  category: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
}

interface AIInsightsProps {
  scope: 'owner' | 'admin';
  period: string;
  kpis: KPI[];
  topItems?: TopItem[];
  revenue?: RevenuePoint[];
  categories?: CategoryPoint[];
}

const IMPACT_BADGE: Record<Suggestion['impact'], { label: string; cls: string }> = {
  high:   { label: 'Impact fort',   cls: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Impact moyen',  cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  low:    { label: 'Impact faible', cls: 'bg-surface-100 text-surface-600 border-surface-200' },
};

const CATEGORY_ICON: Record<string, React.ElementType> = {
  Revenu: TrendingUp,
  Opérations: Zap,
  Marketing: Sparkles,
  Produit: Zap,
  Fidélisation: Sparkles,
};

export function AIInsights(props: AIInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(props),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setSummary(data.summary ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-surface-200 bg-gradient-to-br from-brand-50/40 via-white to-purple-50/40 p-6 shadow-sm dark:border-surface-700 dark:from-brand-500/5 dark:via-surface-800 dark:to-purple-500/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">
              Suggestions IA
            </h3>
            <p className="text-xs text-surface-500">
              Analyse de tes KPIs par Gemini et propositions d&apos;améliorations actionnables
            </p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-surface-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-surface-800 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : suggestions.length ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? 'Analyse…' : suggestions.length ? 'Régénérer' : 'Générer'}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Impossible de générer les suggestions</p>
            <p className="text-xs">{error}</p>
            {error.includes('GEMINI_API_KEY') && (
              <p className="mt-1 text-xs">
                Ajoute <code className="rounded bg-red-100 px-1">GEMINI_API_KEY</code> dans <code className="rounded bg-red-100 px-1">apps/web/.env.local</code>.
              </p>
            )}
          </div>
        </div>
      )}

      {summary && (
        <div className="mt-4 rounded-xl bg-white/70 p-4 backdrop-blur-sm dark:bg-surface-800/50">
          <p className="text-sm italic text-surface-700 dark:text-surface-200">{summary}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {suggestions.map((s, i) => {
            const Icon = CATEGORY_ICON[s.category] ?? Sparkles;
            const badge = IMPACT_BADGE[s.impact];
            return (
              <div
                key={i}
                className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-brand-500" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">{s.category}</span>
                  </div>
                  <span className={clsx('rounded-full border px-2 py-0.5 text-[10px] font-semibold', badge.cls)}>
                    {badge.label}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-surface-900 dark:text-surface-100">{s.title}</h4>
                <p className="mt-1 text-xs text-surface-600 dark:text-surface-300">{s.action}</p>
                <p className="mt-2 text-[11px] italic text-surface-400 border-t border-surface-100 pt-2 dark:border-surface-700">
                  {s.rationale}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && !summary && (
        <div className="mt-4 rounded-xl border border-dashed border-surface-300 p-6 text-center dark:border-surface-600">
          <Sparkles className="mx-auto h-6 w-6 text-surface-300" />
          <p className="mt-2 text-sm text-surface-500">
            Clique sur <span className="font-semibold">Générer</span> pour obtenir des recommandations basées sur tes données.
          </p>
        </div>
      )}
    </div>
  );
}
