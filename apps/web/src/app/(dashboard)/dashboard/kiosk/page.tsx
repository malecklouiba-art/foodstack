'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  Monitor, Save, Play, ChevronRight, Check,
  ShoppingCart, ChevronLeft, Star, Zap, Moon, Leaf,
  ImagePlus, X,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GradientConfig {
  enabled: boolean;
  from: string;
  to: string;
  direction: string;
}

interface ShadowConfig {
  enabled: boolean;
  size: 'sm' | 'md' | 'lg' | 'xl';
}

interface BorderConfig {
  enabled: boolean;
  color: string;
  width: number;
}

export interface ElementTheme {
  bgColor: string;
  bgGradient: GradientConfig;
  bgImage?: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  borderRadius: number;
  shadow: ShadowConfig;
  border: BorderConfig;
}

export interface KioskTheme {
  background: ElementTheme;
  primaryButton: ElementTheme;
  secondaryButton: ElementTheme;
  heading: ElementTheme;
  subheading: ElementTheme;
  productCard: ElementTheme;
  navbar: ElementTheme;
  badge: ElementTheme;
}

type ElementKey = keyof KioskTheme;

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Playfair Display', 'Montserrat',
  'Poppins', 'Oswald', 'Raleway', 'Space Grotesk',
];

const GRADIENT_DIRECTIONS = [
  { value: 'to right',          label: '→ Droite' },
  { value: 'to bottom',         label: '↓ Bas' },
  { value: 'to bottom right',   label: '↘ Diagonal' },
  { value: 'radial',            label: '○ Radial' },
];

const SHADOW_SIZES = ['sm', 'md', 'lg', 'xl'] as const;

const SWATCH_PALETTE = [
  '#1EFF6A', '#09090b', '#ffffff', '#f4f4f5', '#3f3f46',
  '#71717a', '#e4e4e7', '#0f172a', '#3b82f6', '#f97316',
  '#ef4444', '#a855f7', '#ec4899', '#14b8a6', '#eab308',
];

const ELEMENT_LABELS: Record<ElementKey, string> = {
  background:      'Fond d\'écran',
  primaryButton:   'Bouton principal',
  secondaryButton: 'Bouton secondaire',
  heading:         'Titre principal',
  subheading:      'Sous-titre',
  productCard:     'Carte produit',
  navbar:          'Barre de navigation',
  badge:           'Badge promo',
};

const ELEMENT_KEYS: ElementKey[] = [
  'background', 'primaryButton', 'secondaryButton',
  'heading', 'subheading', 'productCard', 'navbar', 'badge',
];

// ── Default & Presets ─────────────────────────────────────────────────────────

function makeElement(overrides: Partial<ElementTheme> = {}): ElementTheme {
  return {
    bgColor: '#ffffff',
    bgGradient: { enabled: false, from: '#ffffff', to: '#f4f4f5', direction: 'to bottom' },
    textColor: '#09090b',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 400,
    borderRadius: 8,
    shadow: { enabled: false, size: 'md' },
    border: { enabled: false, color: '#e4e4e7', width: 1 },
    ...overrides,
  };
}

const MINIMAL_THEME: KioskTheme = {
  background:      makeElement({ bgColor: '#ffffff' }),
  primaryButton:   makeElement({ bgColor: '#1EFF6A', textColor: '#000000', borderRadius: 16, fontSize: 16, fontWeight: 700, shadow: { enabled: true, size: 'md' } }),
  secondaryButton: makeElement({ bgColor: '#f4f4f5', textColor: '#3f3f46', borderRadius: 12, fontSize: 14, fontWeight: 500 }),
  heading:         makeElement({ bgColor: 'transparent', textColor: '#09090b', fontSize: 36, fontWeight: 800 }),
  subheading:      makeElement({ bgColor: 'transparent', textColor: '#71717a', fontSize: 18, fontWeight: 400 }),
  productCard:     makeElement({ bgColor: '#ffffff', borderRadius: 20, shadow: { enabled: true, size: 'sm' }, border: { enabled: true, color: '#e4e4e7', width: 1 } }),
  navbar:          makeElement({ bgColor: '#09090b', textColor: '#ffffff', fontSize: 14, fontWeight: 600 }),
  badge:           makeElement({ bgColor: '#1EFF6A', textColor: '#09090b', borderRadius: 999, fontSize: 12, fontWeight: 700 }),
};

const VIBRANT_THEME: KioskTheme = {
  background:      makeElement({ bgColor: '#FFF7ED' }),
  primaryButton:   makeElement({ bgColor: '#f97316', textColor: '#ffffff', borderRadius: 20, fontSize: 16, fontWeight: 700, shadow: { enabled: true, size: 'lg' } }),
  secondaryButton: makeElement({ bgColor: '#fed7aa', textColor: '#7c2d12', borderRadius: 12, fontSize: 14, fontWeight: 500 }),
  heading:         makeElement({ bgColor: 'transparent', textColor: '#7c2d12', fontSize: 36, fontWeight: 800, fontFamily: 'Montserrat' }),
  subheading:      makeElement({ bgColor: 'transparent', textColor: '#c2410c', fontSize: 18, fontWeight: 400 }),
  productCard:     makeElement({ bgColor: '#ffffff', borderRadius: 24, shadow: { enabled: true, size: 'md' }, border: { enabled: true, color: '#fed7aa', width: 2 } }),
  navbar:          makeElement({ bgColor: '#7c2d12', textColor: '#fff7ed', fontSize: 14, fontWeight: 600 }),
  badge:           makeElement({ bgColor: '#f97316', textColor: '#ffffff', borderRadius: 999, fontSize: 12, fontWeight: 700 }),
};

const DARK_THEME: KioskTheme = {
  background:      makeElement({ bgColor: '#0f172a' }),
  primaryButton:   makeElement({ bgColor: '#1EFF6A', textColor: '#000000', borderRadius: 16, fontSize: 16, fontWeight: 700, shadow: { enabled: true, size: 'xl' } }),
  secondaryButton: makeElement({ bgColor: '#1e293b', textColor: '#94a3b8', borderRadius: 12, fontSize: 14, fontWeight: 500, border: { enabled: true, color: '#334155', width: 1 } }),
  heading:         makeElement({ bgColor: 'transparent', textColor: '#f8fafc', fontSize: 36, fontWeight: 800 }),
  subheading:      makeElement({ bgColor: 'transparent', textColor: '#64748b', fontSize: 18, fontWeight: 400 }),
  productCard:     makeElement({ bgColor: '#1e293b', borderRadius: 20, shadow: { enabled: true, size: 'md' }, border: { enabled: true, color: '#334155', width: 1 }, textColor: '#f8fafc' }),
  navbar:          makeElement({ bgColor: '#020617', textColor: '#1EFF6A', fontSize: 14, fontWeight: 600 }),
  badge:           makeElement({ bgColor: '#a855f7', textColor: '#ffffff', borderRadius: 999, fontSize: 12, fontWeight: 700 }),
};

const BRANDED_THEME: KioskTheme = {
  background:      makeElement({ bgColor: '#f0fdf4' }),
  primaryButton:   makeElement({ bgColor: '#1EFF6A', textColor: '#14532d', borderRadius: 16, fontSize: 16, fontWeight: 700, shadow: { enabled: true, size: 'md' } }),
  secondaryButton: makeElement({ bgColor: '#dcfce7', textColor: '#14532d', borderRadius: 12, fontSize: 14, fontWeight: 500 }),
  heading:         makeElement({ bgColor: 'transparent', textColor: '#14532d', fontSize: 36, fontWeight: 800, fontFamily: 'Poppins' }),
  subheading:      makeElement({ bgColor: 'transparent', textColor: '#16a34a', fontSize: 18, fontWeight: 400 }),
  productCard:     makeElement({ bgColor: '#ffffff', borderRadius: 20, shadow: { enabled: true, size: 'sm' }, border: { enabled: true, color: '#bbf7d0', width: 1 } }),
  navbar:          makeElement({ bgColor: '#14532d', textColor: '#1EFF6A', fontSize: 14, fontWeight: 600 }),
  badge:           makeElement({ bgColor: '#1EFF6A', textColor: '#14532d', borderRadius: 999, fontSize: 12, fontWeight: 700 }),
};

interface Preset {
  id: string;
  label: string;
  icon: typeof Star;
  theme: KioskTheme;
  description: string;
}

const PRESETS: Preset[] = [
  { id: 'minimal',  label: 'Minimal',  icon: Star,    theme: MINIMAL_THEME,  description: 'Épuré et sobre' },
  { id: 'vibrant',  label: 'Vibrant',  icon: Zap,     theme: VIBRANT_THEME,  description: 'Chaud et dynamique' },
  { id: 'dark',     label: 'Sombre',   icon: Moon,    theme: DARK_THEME,     description: 'Fond sombre néon' },
  { id: 'branded',  label: 'FoodStack', icon: Leaf,   theme: BRANDED_THEME,  description: 'Vert signature' },
];

type PreviewTab = 'accueil' | 'menu' | 'panier';

// ── Theme Helpers ─────────────────────────────────────────────────────────────

const SHADOW_VALUES: Record<ShadowConfig['size'], string> = {
  sm: '0 1px 3px rgba(0,0,0,.12)',
  md: '0 4px 12px rgba(0,0,0,.15)',
  lg: '0 8px 24px rgba(0,0,0,.2)',
  xl: '0 16px 40px rgba(0,0,0,.25)',
};

function buildGradient(g: GradientConfig): string {
  if (g.direction === 'radial') {
    return `radial-gradient(circle, ${g.from}, ${g.to})`;
  }
  return `linear-gradient(${g.direction}, ${g.from}, ${g.to})`;
}

function applyTheme(el: ElementTheme): React.CSSProperties {
  const colorBg = el.bgGradient.enabled ? buildGradient(el.bgGradient) : el.bgColor;
  const bgStyles: React.CSSProperties = el.bgImage
    ? {
        backgroundImage: `linear-gradient(${colorBg === 'transparent' ? 'rgba(255,255,255,0.15)' : colorBg + '33'}, ${colorBg === 'transparent' ? 'rgba(255,255,255,0.15)' : colorBg + '33'}), url(${el.bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: colorBg };
  return {
    ...bgStyles,
    color: el.textColor,
    fontFamily: `'${el.fontFamily}', sans-serif`,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    borderRadius: el.borderRadius,
    boxShadow: el.shadow.enabled ? SHADOW_VALUES[el.shadow.size] : undefined,
    border: el.border.enabled ? `${el.border.width}px solid ${el.border.color}` : undefined,
  };
}

// ── Sub-components: Properties Panel ─────────────────────────────────────────

function ColorSwatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      className="relative h-7 w-7 rounded-lg border-2 transition-transform hover:scale-110"
      style={{
        backgroundColor: color,
        borderColor: active ? '#1EFF6A' : 'transparent',
        outline: active ? '2px solid #1EFF6A' : undefined,
      }}
    />
  );
}

function SliderInput({
  label, value, min, max, unit = '', onChange,
}: {
  label: string; value: number; min: number; max: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-surface-500">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-14 rounded-lg border border-surface-200 bg-white px-1.5 py-1 text-center text-xs font-semibold text-surface-800 outline-none focus:border-brand-400"
          />
          {unit && <span className="text-xs text-surface-400">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#1EFF6A]"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-surface-600">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-[#1EFF6A]' : 'bg-surface-200'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : ''}`}
        />
      </button>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-surface-400">{children}</p>
  );
}

function ElementEditor({
  theme, elementKey, onChange,
}: {
  theme: KioskTheme;
  elementKey: ElementKey;
  onChange: (key: ElementKey, patch: Partial<ElementTheme>) => void;
}) {
  const el = theme[elementKey];
  const update = useCallback((patch: Partial<ElementTheme>) => onChange(elementKey, patch), [elementKey, onChange]);

  return (
    <div className="space-y-5">
      {/* Background image — only for background element */}
      {elementKey === 'background' && (
        <div>
          <SectionLabel>Image de fond</SectionLabel>
          {el.bgImage ? (
            <div className="relative overflow-hidden rounded-xl border border-surface-200" style={{ height: 80 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={el.bgImage} alt="fond" className="h-full w-full object-cover" />
              <button
                onClick={() => update({ bgImage: undefined })}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 py-3 text-sm font-medium text-surface-500 transition-colors hover:border-brand-400 hover:text-brand-600">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => update({ bgImage: ev.target?.result as string });
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
              <ImagePlus className="h-4 w-4" />
              Importer une image
            </label>
          )}
        </div>
      )}
      {/* Background color */}
      <div>
        <SectionLabel>Couleur d&apos;arrière-plan</SectionLabel>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={el.bgColor}
            onChange={(e) => update({ bgColor: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded-lg border border-surface-200"
          />
          <input
            type="text"
            value={el.bgColor}
            onChange={(e) => update({ bgColor: e.target.value })}
            className="flex-1 rounded-lg border border-surface-200 px-2 py-1.5 font-mono text-xs text-surface-800 outline-none focus:border-brand-400"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SWATCH_PALETTE.map((c) => (
            <ColorSwatch key={c} color={c} active={el.bgColor === c} onClick={() => update({ bgColor: c })} />
          ))}
        </div>
      </div>

      {/* Gradient */}
      <div className="rounded-xl border border-surface-100 bg-surface-50 p-3 space-y-3">
        <Toggle
          label="Dégradé"
          value={el.bgGradient.enabled}
          onChange={(v) => update({ bgGradient: { ...el.bgGradient, enabled: v } })}
        />
        {el.bgGradient.enabled && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-[10px] font-semibold text-surface-500">Début</p>
                <input
                  type="color"
                  value={el.bgGradient.from}
                  onChange={(e) => update({ bgGradient: { ...el.bgGradient, from: e.target.value } })}
                  className="h-8 w-full cursor-pointer rounded-lg border border-surface-200"
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold text-surface-500">Fin</p>
                <input
                  type="color"
                  value={el.bgGradient.to}
                  onChange={(e) => update({ bgGradient: { ...el.bgGradient, to: e.target.value } })}
                  className="h-8 w-full cursor-pointer rounded-lg border border-surface-200"
                />
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold text-surface-500">Direction</p>
              <div className="grid grid-cols-2 gap-1.5">
                {GRADIENT_DIRECTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => update({ bgGradient: { ...el.bgGradient, direction: d.value } })}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                      el.bgGradient.direction === d.value
                        ? 'border-[#1EFF6A] bg-[#1EFF6A]/10 text-surface-900'
                        : 'border-surface-200 text-surface-600 hover:bg-surface-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Text color */}
      <div>
        <SectionLabel>Couleur du texte</SectionLabel>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="color"
            value={el.textColor}
            onChange={(e) => update({ textColor: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded-lg border border-surface-200"
          />
          <input
            type="text"
            value={el.textColor}
            onChange={(e) => update({ textColor: e.target.value })}
            className="flex-1 rounded-lg border border-surface-200 px-2 py-1.5 font-mono text-xs text-surface-800 outline-none focus:border-brand-400"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SWATCH_PALETTE.map((c) => (
            <ColorSwatch key={c} color={c} active={el.textColor === c} onClick={() => update({ textColor: c })} />
          ))}
        </div>
      </div>

      {/* Typography */}
      <div>
        <SectionLabel>Typographie</SectionLabel>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-surface-500">Police</p>
            <select
              value={el.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-400"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </div>
          <SliderInput label="Taille" value={el.fontSize} min={10} max={72} unit="px" onChange={(v) => update({ fontSize: v })} />
          <div>
            <p className="mb-1.5 text-xs text-surface-500">Graisse</p>
            <div className="flex gap-1.5">
              {[400, 500, 600, 700, 800].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => update({ fontWeight: w })}
                  className={`flex-1 rounded-lg border py-1.5 text-xs transition-colors ${
                    el.fontWeight === w
                      ? 'border-[#1EFF6A] bg-[#1EFF6A]/10 font-bold text-surface-900'
                      : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                  }`}
                  style={{ fontWeight: w }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Border radius */}
      <SliderInput label="Rayon des coins" value={el.borderRadius} min={0} max={48} unit="px" onChange={(v) => update({ borderRadius: v })} />

      {/* Shadow */}
      <div className="rounded-xl border border-surface-100 bg-surface-50 p-3 space-y-2">
        <Toggle label="Ombre" value={el.shadow.enabled} onChange={(v) => update({ shadow: { ...el.shadow, enabled: v } })} />
        {el.shadow.enabled && (
          <div className="flex gap-1.5 pt-1">
            {SHADOW_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update({ shadow: { ...el.shadow, size: s } })}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold uppercase transition-colors ${
                  el.shadow.size === s
                    ? 'border-[#1EFF6A] bg-[#1EFF6A]/10 text-surface-900'
                    : 'border-surface-200 text-surface-600 hover:bg-surface-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Border */}
      <div className="rounded-xl border border-surface-100 bg-surface-50 p-3 space-y-3">
        <Toggle label="Bordure" value={el.border.enabled} onChange={(v) => update({ border: { ...el.border, enabled: v } })} />
        {el.border.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold text-surface-500">Couleur</p>
              <input
                type="color"
                value={el.border.color}
                onChange={(e) => update({ border: { ...el.border, color: e.target.value } })}
                className="h-8 w-full cursor-pointer rounded-lg border border-surface-200"
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold text-surface-500">Épaisseur</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => update({ border: { ...el.border, width: w } })}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition-colors ${
                      el.border.width === w
                        ? 'border-[#1EFF6A] bg-[#1EFF6A]/10 text-surface-900'
                        : 'border-surface-200 text-surface-600 hover:bg-surface-100'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Preview Screens ───────────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Burger Classic', price: 12.90, emoji: '🍔', badge: 'Best-seller' },
  { id: 'p2', name: 'Salade César',   price: 9.50,  emoji: '🥗', badge: null },
  { id: 'p3', name: 'Pâtes Carbonara', price: 11.50, emoji: '🍝', badge: null },
  { id: 'p4', name: 'Tiramisu',       price: 6.50,  emoji: '🍮', badge: 'Nouveau' },
  { id: 'p5', name: 'Coca-Cola',      price: 3.00,  emoji: '🥤', badge: null },
  { id: 'p6', name: 'Menu Burger',    price: 17.90, emoji: '🍱', badge: 'Éco' },
];

const MOCK_CATEGORIES = ['Menus', 'Entrées', 'Plats', 'Desserts', 'Boissons'];

function PreviewAccueil({ theme }: { theme: KioskTheme }) {
  const bgStyle = applyTheme(theme.background);
  const btnStyle = applyTheme(theme.primaryButton);
  const h1Style = applyTheme(theme.heading);
  const h2Style = applyTheme(theme.subheading);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-5 p-6"
      style={{ background: bgStyle.background }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: '#1EFF6A20' }}
      >
        <span className="text-3xl font-black" style={{ color: '#1EFF6A' }}>F</span>
      </div>
      <div className="text-center">
        <p style={{ ...h1Style, background: undefined, border: undefined, boxShadow: undefined, fontSize: Math.min(h1Style.fontSize as number, 28) }}>FoodStack</p>
        <p style={{ ...h2Style, background: undefined, border: undefined, boxShadow: undefined, fontSize: Math.min(h2Style.fontSize as number, 16) }} className="mt-1">Bienvenue !</p>
      </div>
      <div
        className="flex cursor-pointer items-center justify-center px-8 py-3 text-sm font-bold"
        style={btnStyle}
      >
        Toucher pour commander
      </div>
      <p style={{ color: theme.subheading.textColor, fontSize: 11 }} className="opacity-60">
        Commande rapide • Sans contact
      </p>
    </div>
  );
}

function PreviewMenu({ theme }: { theme: KioskTheme }) {
  const navStyle = applyTheme(theme.navbar);
  const cardStyle = applyTheme(theme.productCard);
  const badgeStyle = applyTheme(theme.badge);
  const bgStyle = applyTheme(theme.background);
  const primaryStyle = applyTheme(theme.primaryButton);

  return (
    <div className="flex h-full w-full flex-col" style={{ background: bgStyle.background }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-3 py-2 text-xs" style={{ ...navStyle, borderRadius: 0 }}>
        <span className="font-bold">FoodStack</span>
        <div
          className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold"
          style={primaryStyle}
        >
          <ShoppingCart size={10} />
          <span>2 — 22,40 €</span>
        </div>
      </div>

      {/* Categories row */}
      <div className="flex gap-1 overflow-x-auto px-2 py-1.5">
        {MOCK_CATEGORIES.slice(0, 4).map((cat, i) => (
          <div
            key={cat}
            className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold"
            style={i === 0
              ? { background: theme.primaryButton.bgColor, color: theme.primaryButton.textColor }
              : { background: theme.secondaryButton.bgColor, color: theme.secondaryButton.textColor }
            }
          >
            {cat}
          </div>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-hidden p-2">
        <div className="grid grid-cols-2 gap-2">
          {MOCK_PRODUCTS.slice(0, 4).map((p) => (
            <div key={p.id} className="flex flex-col items-center p-2" style={cardStyle}>
              {p.badge && (
                <div className="mb-1 self-start px-1.5 py-0.5 text-[9px] font-bold" style={badgeStyle}>
                  {p.badge}
                </div>
              )}
              <span className="text-2xl">{p.emoji}</span>
              <p className="mt-1 text-center text-[10px] font-bold" style={{ color: theme.productCard.textColor }}>
                {p.name}
              </p>
              <p className="mt-0.5 text-[11px] font-black" style={{ color: theme.primaryButton.bgColor }}>
                {p.price.toFixed(2)} €
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewPanier({ theme }: { theme: KioskTheme }) {
  const bgStyle = applyTheme(theme.background);
  const navStyle = applyTheme(theme.navbar);
  const cardStyle = applyTheme(theme.productCard);
  const primaryStyle = applyTheme(theme.primaryButton);
  const secondaryStyle = applyTheme(theme.secondaryButton);
  const headStyle = applyTheme(theme.heading);

  return (
    <div className="flex h-full w-full flex-col" style={{ background: bgStyle.background }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ ...navStyle, borderRadius: 0 }}>
        <span className="text-xs font-bold">Votre commande</span>
        <ShoppingCart size={14} />
      </div>

      <div className="flex-1 overflow-hidden p-3 space-y-2">
        {MOCK_PRODUCTS.slice(0, 2).map((p) => (
          <div key={p.id} className="flex items-center gap-2 px-2 py-2" style={cardStyle}>
            <span className="text-xl">{p.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[10px] font-bold" style={{ color: theme.productCard.textColor }}>{p.name}</p>
              <p className="text-[10px]" style={{ color: theme.subheading.textColor }}>× 1</p>
            </div>
            <p className="text-[11px] font-black" style={{ color: theme.primaryButton.bgColor }}>
              {p.price.toFixed(2)} €
            </p>
          </div>
        ))}

        <div className="rounded-xl p-3 space-y-1" style={cardStyle}>
          <div className="flex justify-between text-[10px]" style={{ color: theme.subheading.textColor }}>
            <span>Sous-total</span><span>22,40 €</span>
          </div>
          <div className="flex justify-between text-[10px]" style={{ color: theme.subheading.textColor }}>
            <span>TVA</span><span>2,24 €</span>
          </div>
          <div className="flex justify-between text-[11px] font-black border-t pt-1" style={{ borderColor: theme.productCard.border.color, color: theme.productCard.textColor }}>
            <span>Total</span><span>22,40 €</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-3">
        <div
          className="flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold"
          style={secondaryStyle}
        >
          <ChevronLeft size={10} />
          Retour
        </div>
        <div
          className="flex flex-1 items-center justify-center rounded-xl py-2 text-[10px] font-bold"
          style={primaryStyle}
        >
          Payer →
        </div>
      </div>

      <div className="sr-only">{headStyle.color}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function KioskDesignerPage() {
  const [theme, setTheme] = useState<KioskTheme>(MINIMAL_THEME);
  const [selectedElement, setSelectedElement] = useState<ElementKey>('background');
  const [previewTab, setPreviewTab] = useState<PreviewTab>('accueil');
  const [activePreset, setActivePreset] = useState<string>('minimal');

  const updateElement = useCallback((key: ElementKey, patch: Partial<ElementTheme>) => {
    setTheme((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
    setActivePreset('');
  }, []);

  const applyPreset = (preset: Preset) => {
    setTheme(preset.theme);
    setActivePreset(preset.id);
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kioskTheme', JSON.stringify(theme));
    }
    toast.success('Design sauvegardé !', {
      style: { fontWeight: 600 },
      iconTheme: { primary: '#1EFF6A', secondary: '#000' },
    });
  };

  const handleLaunch = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kioskTheme', JSON.stringify(theme));
      window.open('/kiosk/demo', '_blank', 'fullscreen=yes');
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex h-full min-h-screen bg-surface-50">

        {/* ── Left Panel: Properties ── */}
        <aside className="flex w-[40%] min-w-[340px] flex-col border-r border-surface-100 bg-white">

          {/* Header */}
          <div className="border-b border-surface-100 px-5 py-4">
            <h1 className="text-lg font-bold text-surface-900">Designer de borne</h1>
            <p className="mt-0.5 text-xs text-surface-500">Personnalisez chaque élément de l&apos;interface</p>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">

            {/* Presets */}
            <div className="border-b border-surface-100 px-5 py-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-surface-400">Thèmes rapides</p>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all ${
                        activePreset === preset.id
                          ? 'border-[#1EFF6A] bg-[#1EFF6A]/5'
                          : 'border-surface-100 hover:border-surface-200 hover:bg-surface-50'
                      }`}
                    >
                      <Icon
                        size={16}
                        style={{ color: activePreset === preset.id ? '#1EFF6A' : '#71717a' }}
                      />
                      <span className="text-[10px] font-semibold text-surface-700">{preset.label}</span>
                      {activePreset === preset.id && (
                        <Check size={10} style={{ color: '#1EFF6A' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Element selector */}
            <div className="border-b border-surface-100 px-5 py-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-surface-400">Élément à modifier</p>
              <div className="space-y-1">
                {ELEMENT_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedElement(key)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedElement === key
                        ? 'bg-[#1EFF6A]/10 font-semibold text-surface-900'
                        : 'font-medium text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    <span>{ELEMENT_LABELS[key]}</span>
                    {selectedElement === key
                      ? <div className="h-2 w-2 rounded-full bg-[#1EFF6A]" />
                      : <ChevronRight size={14} className="text-surface-300" />
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* Properties for selected element */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedElement}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="px-5 py-4"
              >
                <p className="mb-4 text-sm font-bold text-surface-800">
                  {ELEMENT_LABELS[selectedElement]}
                </p>
                <ElementEditor
                  theme={theme}
                  elementKey={selectedElement}
                  onChange={updateElement}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <div className="border-t border-surface-100 p-4 space-y-2">
            <button
              type="button"
              onClick={handleLaunch}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1EFF6A] px-4 py-3 text-sm font-bold text-black shadow-sm transition-all hover:bg-[#00e85c] active:scale-[.98]"
            >
              <Play size={15} />
              Lancer la borne
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-surface-700 transition-all hover:bg-surface-50"
            >
              <Save size={14} />
              Sauvegarder
            </button>
          </div>
        </aside>

        {/* ── Right Panel: Live Preview ── */}
        <div className="flex flex-1 flex-col">
          <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-surface-100 bg-surface-50 px-6 py-3">
            <Monitor size={15} className="text-surface-400 mr-1" />
            {(['accueil', 'menu', 'panier'] as PreviewTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreviewTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  previewTab === tab
                    ? 'bg-white text-surface-900 shadow-sm'
                    : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex flex-1 items-center justify-center p-10">
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative overflow-hidden rounded-[2.5rem] border-[10px] border-surface-900 bg-surface-900 shadow-2xl"
                style={{ width: 360, height: 640 }}
              >
                {/* Status bar mock */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-1.5"
                  style={{ background: theme.navbar.bgColor }}>
                  <span className="text-[9px] font-semibold" style={{ color: theme.navbar.textColor }}>9:41</span>
                  <div className="flex gap-1">
                    <div className="h-1.5 w-3 rounded-full" style={{ background: theme.navbar.textColor, opacity: 0.5 }} />
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: theme.navbar.textColor, opacity: 0.7 }} />
                    <div className="h-1.5 w-3 rounded-sm" style={{ background: theme.navbar.textColor, opacity: 0.9 }} />
                  </div>
                </div>

                {/* Screen content */}
                <div className="h-full w-full pt-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={previewTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="h-full w-full"
                    >
                      {previewTab === 'accueil' && <PreviewAccueil theme={theme} />}
                      {previewTab === 'menu'    && <PreviewMenu    theme={theme} />}
                      {previewTab === 'panier'  && <PreviewPanier  theme={theme} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <p className="text-xs text-surface-400">Aperçu en temps réel — {previewTab}</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
