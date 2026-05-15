'use client';

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, LayoutGrid, Settings2, Image as ImageIcon, Video, Upload,
  Save, Palette, Clock, Utensils, Check, ShoppingBag, Store,
  Monitor, Trash2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type StepId = 'home' | 'mode' | 'settings';
type OrderMode = 'both' | 'sur_place' | 'emporter';
type PresetId = 'minimal' | 'vibrant' | 'dark' | 'branded';

interface PresetDesign {
  id: PresetId;
  label: string;
  description: string;
  bg: string;
  fg: string;
  accent: string;
}

interface KioskConfig {
  homeDesign: PresetId;
  modeBgDesign: PresetId;
  modeBgMedia: { kind: 'image' | 'video'; dataUrl: string; name: string } | null;
  waitTime: number;
  orderMode: OrderMode;
  categories: Record<string, boolean>;
  navColor: string;
  menuColor: string;
  menuBg: { dataUrl: string; name: string } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESETS: PresetDesign[] = [
  { id: 'minimal',  label: 'Minimal',  description: 'Épuré, fond blanc, typographie sobre', bg: '#FFFFFF', fg: '#0F172A', accent: '#1EFF6A' },
  { id: 'vibrant',  label: 'Vibrant',  description: 'Couleurs chaudes, dynamique',          bg: '#FFF7ED', fg: '#7C2D12', accent: '#F97316' },
  { id: 'dark',     label: 'Sombre',   description: 'Fond sombre, accent néon',             bg: '#0F172A', fg: '#F8FAFC', accent: '#1EFF6A' },
  { id: 'branded',  label: 'Marqué',   description: 'Accent FoodStack vert, fond clair',    bg: '#F0FDF4', fg: '#14532D', accent: '#1EFF6A' },
];

const MODE_LABELS: Record<OrderMode, string> = {
  both: 'Sur place & À emporter',
  sur_place: 'Sur place uniquement',
  emporter: 'À emporter uniquement',
};

const CATEGORIES = [
  { id: 'entrees',  label: 'Entrées',  count: 8 },
  { id: 'plats',    label: 'Plats',    count: 14 },
  { id: 'desserts', label: 'Desserts', count: 6 },
  { id: 'boissons', label: 'Boissons', count: 10 },
  { id: 'menus',    label: 'Menus',    count: 4 },
];

const STEPS: { id: StepId; label: string; icon: typeof Home }[] = [
  { id: 'home',     label: "Page d'accueil",       icon: Home },
  { id: 'mode',     label: 'Page de choix mode',   icon: LayoutGrid },
  { id: 'settings', label: 'Paramètres de base',   icon: Settings2 },
];

const DEFAULT_CONFIG: KioskConfig = {
  homeDesign: 'minimal',
  modeBgDesign: 'minimal',
  modeBgMedia: null,
  waitTime: 12,
  orderMode: 'both',
  categories: { entrees: true, plats: true, desserts: true, boissons: true, menus: false },
  navColor: '#1EFF6A',
  menuColor: '#0F172A',
  menuBg: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ── Preset Card ───────────────────────────────────────────────────────────────

function PresetCard({ preset, selected, onSelect }: {
  preset: PresetDesign;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl border-2 text-left transition-all ${
        selected ? 'border-brand-500 shadow-md' : 'border-surface-200 hover:border-surface-300'
      }`}
    >
      <div
        className="flex h-28 items-center justify-center"
        style={{ backgroundColor: preset.bg, color: preset.fg }}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">Bienvenue</div>
          <div
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{ backgroundColor: preset.accent, color: preset.bg }}
          >
            Commander
          </div>
        </div>
      </div>
      <div className="border-t border-surface-100 bg-white p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-surface-900">{preset.label}</p>
          {selected && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
        </div>
        <p className="mt-0.5 text-xs text-surface-500">{preset.description}</p>
      </div>
    </button>
  );
}

// ── Step: Home ────────────────────────────────────────────────────────────────

function StepHome({ config, setConfig }: {
  config: KioskConfig;
  setConfig: (patch: Partial<KioskConfig>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-surface-900">Page d&apos;accueil</h2>
        <p className="mt-1 text-sm text-surface-500">
          Choisissez un design pour la page d&apos;accueil de la borne.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PRESETS.map((p) => (
          <PresetCard
            key={p.id}
            preset={p}
            selected={config.homeDesign === p.id}
            onSelect={() => setConfig({ homeDesign: p.id })}
          />
        ))}
      </div>
    </div>
  );
}

// ── Step: Mode ────────────────────────────────────────────────────────────────

function StepMode({ config, setConfig }: {
  config: KioskConfig;
  setConfig: (patch: Partial<KioskConfig>) => void;
}) {
  const fileImageRef = useRef<HTMLInputElement>(null);
  const fileVideoRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined, kind: 'image' | 'video') => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setConfig({ modeBgMedia: { kind, dataUrl, name: file.name } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-surface-900">Page de choix du mode</h2>
        <p className="mt-1 text-sm text-surface-500">
          Sur place ou à emporter — design et arrière-plan personnalisable.
        </p>
      </div>

      {/* Background design picker */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-surface-600">
          Design d&apos;arrière-plan
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRESETS.map((p) => (
            <PresetCard
              key={p.id}
              preset={p}
              selected={config.modeBgDesign === p.id}
              onSelect={() => setConfig({ modeBgDesign: p.id })}
            />
          ))}
        </div>
      </div>

      {/* Media upload */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-surface-600">
          Média d&apos;arrière-plan (local)
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fileImageRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 px-4 py-4 text-sm font-semibold text-surface-700 hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
          >
            <ImageIcon className="h-4 w-4" />
            Importer une photo
          </button>
          <button
            type="button"
            onClick={() => fileVideoRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 px-4 py-4 text-sm font-semibold text-surface-700 hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
          >
            <Video className="h-4 w-4" />
            Importer une vidéo
          </button>
          <input
            ref={fileImageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0], 'image')}
          />
          <input
            ref={fileVideoRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0], 'video')}
          />
        </div>

        {config.modeBgMedia && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              {config.modeBgMedia.kind === 'image'
                ? <ImageIcon className="h-4 w-4 text-surface-600" />
                : <Video className="h-4 w-4 text-surface-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-surface-900">{config.modeBgMedia.name}</p>
              <p className="text-xs text-surface-500">
                {config.modeBgMedia.kind === 'image' ? 'Image locale' : 'Vidéo locale'} importée
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ modeBgMedia: null })}
              className="rounded-lg p-1.5 text-surface-400 hover:bg-white hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step: Settings ────────────────────────────────────────────────────────────

function StepSettings({ config, setConfig }: {
  config: KioskConfig;
  setConfig: (patch: Partial<KioskConfig>) => void;
}) {
  const fileMenuBgRef = useRef<HTMLInputElement>(null);

  const handleMenuBg = async (file: File | undefined) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setConfig({ menuBg: { dataUrl, name: file.name } });
  };

  const toggleCategory = (id: string) =>
    setConfig({ categories: { ...config.categories, [id]: !config.categories[id] } });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-surface-900">Paramètres de base</h2>
        <p className="mt-1 text-sm text-surface-500">
          Temps d&apos;attente, mode de commande, catégories et couleurs.
        </p>
      </div>

      {/* Wait time */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-surface-600">
          Temps d&apos;attente moyen (minutes)
        </label>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
            <Clock className="h-4 w-4 text-brand-700" />
          </div>
          <input
            type="number"
            min={1}
            max={120}
            value={config.waitTime}
            onChange={(e) => setConfig({ waitTime: Number(e.target.value) || 0 })}
            className="w-32 rounded-xl border border-surface-200 px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <span className="text-sm text-surface-500">min</span>
        </div>
      </div>

      {/* Order mode */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-surface-600">
          Mode de commande
        </label>
        <select
          value={config.orderMode}
          onChange={(e) => setConfig({ orderMode: e.target.value as OrderMode })}
          className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          {(Object.entries(MODE_LABELS) as [OrderMode, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-surface-600">
          Catégories affichées
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CATEGORIES.map((cat) => {
            const enabled = !!config.categories[cat.id];
            return (
              <label
                key={cat.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                  enabled ? 'border-brand-400 bg-brand-50/60' : 'border-surface-200 hover:bg-surface-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleCategory(cat.id)}
                  className="h-4 w-4 cursor-pointer rounded border-surface-300 text-brand-500 focus:ring-brand-400"
                />
                <Utensils className="h-3.5 w-3.5 text-surface-400" />
                <span className="flex-1 text-sm font-semibold text-surface-800">{cat.label}</span>
                <span className="text-xs text-surface-400">{cat.count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Color: nav */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-surface-600">
          Couleur navigation
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.navColor}
            onChange={(e) => setConfig({ navColor: e.target.value })}
            className="h-11 w-16 cursor-pointer rounded-lg border border-surface-200"
          />
          <div className="flex-1 rounded-xl border border-surface-200 px-3 py-2.5 font-mono text-sm text-surface-700">
            {config.navColor.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Color: menu */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-surface-600">
          Couleur menu
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.menuColor}
            onChange={(e) => setConfig({ menuColor: e.target.value })}
            className="h-11 w-16 cursor-pointer rounded-lg border border-surface-200"
          />
          <div className="flex-1 rounded-xl border border-surface-200 px-3 py-2.5 font-mono text-sm text-surface-700">
            {config.menuColor.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Menu background */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-surface-600">
          Fond menu (image)
        </label>
        <button
          type="button"
          onClick={() => fileMenuBgRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 px-4 py-4 text-sm font-semibold text-surface-700 hover:border-brand-400 hover:bg-brand-50/50 transition-colors"
        >
          <Upload className="h-4 w-4" />
          Importer une image
        </button>
        <input
          ref={fileMenuBgRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleMenuBg(e.target.files?.[0])}
        />
        {config.menuBg && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3">
            <div
              className="h-12 w-12 shrink-0 rounded-lg bg-cover bg-center"
              style={{ backgroundImage: `url(${config.menuBg.dataUrl})` }}
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-surface-900">{config.menuBg.name}</p>
              <p className="text-xs text-surface-500">Image locale importée</p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ menuBg: null })}
              className="rounded-lg p-1.5 text-surface-400 hover:bg-white hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Live Preview ──────────────────────────────────────────────────────────────

function PreviewFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center gap-2">
        <Monitor className="h-3.5 w-3.5 text-surface-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-surface-500">{label}</span>
      </div>
      <div className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-3xl border-8 border-surface-900 bg-surface-900 shadow-xl">
        <div className="absolute inset-0">{children}</div>
      </div>
    </div>
  );
}

function PreviewHome({ config }: { config: KioskConfig }) {
  const preset = PRESETS.find((p) => p.id === config.homeDesign) ?? PRESETS[0];
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-6 p-6"
      style={{ backgroundColor: preset.bg, color: preset.fg }}
    >
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-widest opacity-60">Bienvenue chez</div>
        <div className="mt-1 text-2xl font-bold">FoodStack</div>
      </div>
      <div
        className="flex h-20 w-20 items-center justify-center rounded-3xl"
        style={{ backgroundColor: preset.accent + '20' }}
      >
        <Utensils className="h-10 w-10" style={{ color: preset.accent }} />
      </div>
      <button
        className="rounded-full px-8 py-3 text-sm font-bold shadow-lg"
        style={{ backgroundColor: preset.accent, color: preset.bg }}
      >
        Toucher pour commander
      </button>
      <p className="text-center text-xs opacity-50">Temps d&apos;attente moyen : {config.waitTime} min</p>
    </div>
  );
}

function PreviewMode({ config }: { config: KioskConfig }) {
  const preset = PRESETS.find((p) => p.id === config.modeBgDesign) ?? PRESETS[0];
  const showBoth = config.orderMode === 'both';
  const showSurPlace = config.orderMode === 'sur_place' || showBoth;
  const showEmporter = config.orderMode === 'emporter' || showBoth;

  return (
    <div className="relative h-full w-full">
      {/* Media bg */}
      {config.modeBgMedia ? (
        config.modeBgMedia.kind === 'image' ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${config.modeBgMedia.dataUrl})` }}
          />
        ) : (
          <video
            key={config.modeBgMedia.dataUrl}
            src={config.modeBgMedia.dataUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        )
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: preset.bg }} />
      )}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-white">
        <h3 className="text-center text-xl font-bold drop-shadow-md">Comment souhaitez-vous commander&nbsp;?</h3>
        <div className="mt-4 flex w-full flex-col gap-3">
          {showSurPlace && (
            <button
              className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 text-left text-surface-900 shadow-lg"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: preset.accent + '20' }}
              >
                <Store className="h-5 w-5" style={{ color: preset.accent }} />
              </div>
              <div>
                <div className="text-sm font-bold">Sur place</div>
                <div className="text-xs text-surface-500">Manger au restaurant</div>
              </div>
            </button>
          )}
          {showEmporter && (
            <button
              className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 text-left text-surface-900 shadow-lg"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: preset.accent + '20' }}
              >
                <ShoppingBag className="h-5 w-5" style={{ color: preset.accent }} />
              </div>
              <div>
                <div className="text-sm font-bold">À emporter</div>
                <div className="text-xs text-surface-500">Prendre ma commande</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewSettings({ config }: { config: KioskConfig }) {
  const activeCats = CATEGORIES.filter((c) => config.categories[c.id]);
  const bgStyle = config.menuBg
    ? { backgroundImage: `url(${config.menuBg.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: '#FFFFFF' };

  return (
    <div className="flex h-full w-full flex-col" style={bgStyle}>
      {/* Nav */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white shadow-sm"
        style={{ backgroundColor: config.navColor }}
      >
        <span className="text-xs font-bold uppercase tracking-wide drop-shadow">Menu</span>
        <span className="rounded-full bg-white/30 px-2 py-0.5 text-[10px] font-bold">
          {config.waitTime} min
        </span>
      </div>

      {/* Menu list */}
      <div className="relative flex-1 overflow-hidden p-3">
        <div className={config.menuBg ? 'absolute inset-0 bg-white/70' : ''} />
        <div className="relative space-y-2">
          {activeCats.length === 0 && (
            <p className="rounded-xl bg-white/80 p-3 text-center text-xs text-surface-500">
              Aucune catégorie activée
            </p>
          )}
          {activeCats.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl bg-white/95 px-3 py-2.5 shadow-sm"
            >
              <span
                className="text-sm font-bold"
                style={{ color: config.menuColor }}
              >
                {cat.label}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: config.navColor }}
              >
                {cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function KioskCustomizationPage() {
  const [config, setConfigState] = useState<KioskConfig>(DEFAULT_CONFIG);
  const [savedConfig, setSavedConfig] = useState<KioskConfig>(DEFAULT_CONFIG);
  const [step, setStep] = useState<StepId>('home');
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const setConfig = (patch: Partial<KioskConfig>) =>
    setConfigState((c) => ({ ...c, ...patch }));

  const isDirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedConfig),
    [config, savedConfig],
  );

  const handleSave = () => {
    setSavedConfig(config);
    setSavedAt(new Date());
  };

  const preview = (() => {
    switch (step) {
      case 'home':     return <PreviewHome config={config} />;
      case 'mode':     return <PreviewMode config={config} />;
      case 'settings': return <PreviewSettings config={config} />;
    }
  })();

  const previewLabel = STEPS.find((s) => s.id === step)?.label ?? '';

  return (
    <div className="flex h-full min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="border-b border-surface-100 bg-white px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50">
              <Palette className="h-5 w-5 text-brand-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900">Personnalisation borne</h1>
              <p className="mt-0.5 text-sm text-surface-500">
                Configurez l&apos;apparence et le comportement de votre borne de commande.
              </p>
            </div>
          </div>
          {savedAt && !isDirty && (
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              <Check className="h-3.5 w-3.5" />
              Enregistré à {savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left: tabs */}
        <aside className="w-full shrink-0 border-b border-surface-100 bg-white p-4 lg:w-64 lg:border-b-0 lg:border-r">
          <nav className="flex flex-row gap-2 lg:flex-col">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors lg:flex-none ${
                    active
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-surface-700 hover:bg-surface-50'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-500'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <Icon className="hidden h-4 w-4 lg:block" />
                  <span className="hidden truncate lg:inline">{s.label}</span>
                  <span className="truncate lg:hidden">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Center: editor */}
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {step === 'home'     && <StepHome     config={config} setConfig={setConfig} />}
              {step === 'mode'     && <StepMode     config={config} setConfig={setConfig} />}
              {step === 'settings' && <StepSettings config={config} setConfig={setConfig} />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right: live preview */}
        <aside className="w-full shrink-0 border-t border-surface-100 bg-surface-50 p-6 lg:w-[28rem] lg:border-t-0 lg:border-l">
          <div className="flex justify-center lg:sticky lg:top-6">
            <PreviewFrame label={`Aperçu — ${previewLabel}`}>{preview}</PreviewFrame>
          </div>
        </aside>
      </div>

      {/* Footer save bar */}
      <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t border-surface-100 bg-white px-6 py-4 shadow-[0_-4px_12px_-8px_rgba(0,0,0,0.1)]">
        <p className="text-xs text-surface-500">
          {isDirty
            ? 'Modifications non enregistrées'
            : 'Toutes les modifications sont enregistrées'}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConfigState(savedConfig)}
            disabled={!isDirty}
            className="rounded-xl border border-surface-200 px-4 py-2.5 text-sm font-semibold text-surface-600 hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
