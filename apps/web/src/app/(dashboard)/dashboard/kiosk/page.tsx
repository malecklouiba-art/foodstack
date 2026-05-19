'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  Monitor, Save, Play, ChevronRight, Check,
  ShoppingCart, ChevronLeft, Star, Zap, Moon, Leaf,
  ImagePlus, X, Utensils, Coffee, Layout,
  Globe, Upload, Smile,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useRestaurantId } from '@/contexts/restaurant-context';
import api from '@/lib/api';

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

// ── Language types ─────────────────────────────────────────────────────────────

type LangCode = 'fr' | 'en' | 'ar';

interface LangConfig {
  displayLang: LangCode;
  multiLang: boolean;
}

// ── Branding types ────────────────────────────────────────────────────────────

interface BrandingConfig {
  logoBase64: string | null;
  backgroundBase64: string | null;
  primaryColor: string;
  categoryIcons: Record<string, string>;
}

// ── Panel tabs ────────────────────────────────────────────────────────────────

type PanelTab = 'templates' | 'branding' | 'language' | 'elements';

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

const PRESET_CATEGORY_ICONS: Record<string, string[]> = {
  menus:    ['🍱', '🥡', '🍽️', '📦'],
  entrees:  ['🥗', '🥙', '🫕', '🥘'],
  plats:    ['🍽️', '🍳', '🥩', '🫔'],
  desserts: ['🍮', '🍰', '🧁', '🍩'],
  boissons: ['🥤', '☕', '🧃', '🍵'],
};

const LANG_OPTIONS: { code: LangCode; label: string; nativeLabel: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'fr', label: 'Français',   nativeLabel: 'FR', dir: 'ltr' },
  { code: 'en', label: 'English',    nativeLabel: 'EN', dir: 'ltr' },
  { code: 'ar', label: 'العربية',    nativeLabel: 'AR', dir: 'rtl' },
];

const ELEMENT_LABELS_I18N: Record<LangCode, Record<string, string>> = {
  fr: {
    welcome: 'Bienvenue !',
    tapToOrder: 'Toucher pour commander',
    dineIn: 'Sur place',
    takeout: 'À emporter',
    cart: 'Panier',
    pay: 'Payer',
  },
  en: {
    welcome: 'Welcome!',
    tapToOrder: 'Tap to order',
    dineIn: 'Dine in',
    takeout: 'Take away',
    cart: 'Cart',
    pay: 'Pay',
  },
  ar: {
    welcome: 'أهلاً بك!',
    tapToOrder: 'اضغط للطلب',
    dineIn: 'داخل المطعم',
    takeout: 'طلب خارجي',
    cart: 'السلة',
    pay: 'الدفع',
  },
};

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

// ── Kiosk Templates (distinct from the visual presets above) ──────────────────

interface KioskTemplate {
  id: string;
  label: string;
  description: string;
  icon: typeof Utensils;
  accentColor: string;
  bgSwatch: string;
  theme: KioskTheme;
}

const FAST_FOOD_THEME: KioskTheme = {
  background:      makeElement({ bgColor: '#1a1a1a' }),
  primaryButton:   makeElement({ bgColor: '#ff6b00', textColor: '#ffffff', borderRadius: 6, fontSize: 18, fontWeight: 900, shadow: { enabled: true, size: 'xl' } }),
  secondaryButton: makeElement({ bgColor: '#2a2a2a', textColor: '#aaaaaa', borderRadius: 6, fontSize: 14, fontWeight: 600 }),
  heading:         makeElement({ bgColor: 'transparent', textColor: '#ffffff', fontSize: 40, fontWeight: 900, fontFamily: 'Oswald' }),
  subheading:      makeElement({ bgColor: 'transparent', textColor: '#ff6b00', fontSize: 18, fontWeight: 600 }),
  productCard:     makeElement({ bgColor: '#2a2a2a', borderRadius: 8, shadow: { enabled: true, size: 'lg' }, border: { enabled: false, color: '#3a3a3a', width: 1 }, textColor: '#ffffff' }),
  navbar:          makeElement({ bgColor: '#111111', textColor: '#ffffff', fontSize: 14, fontWeight: 700 }),
  badge:           makeElement({ bgColor: '#ff6b00', textColor: '#ffffff', borderRadius: 4, fontSize: 11, fontWeight: 800 }),
};

const RESTAURANT_THEME: KioskTheme = {
  background:      makeElement({ bgColor: '#fdf8f3' }),
  primaryButton:   makeElement({ bgColor: '#8b5e3c', textColor: '#fdf8f3', borderRadius: 2, fontSize: 15, fontWeight: 600, fontFamily: 'Playfair Display' }),
  secondaryButton: makeElement({ bgColor: 'transparent', textColor: '#8b5e3c', borderRadius: 2, fontSize: 14, fontWeight: 400, border: { enabled: true, color: '#c4a882', width: 1 } }),
  heading:         makeElement({ bgColor: 'transparent', textColor: '#3d2b1f', fontSize: 36, fontWeight: 700, fontFamily: 'Playfair Display' }),
  subheading:      makeElement({ bgColor: 'transparent', textColor: '#8b7355', fontSize: 16, fontWeight: 400, fontFamily: 'Playfair Display' }),
  productCard:     makeElement({ bgColor: '#ffffff', borderRadius: 4, shadow: { enabled: true, size: 'sm' }, border: { enabled: true, color: '#e8ddd0', width: 1 }, textColor: '#3d2b1f' }),
  navbar:          makeElement({ bgColor: '#3d2b1f', textColor: '#fdf8f3', fontSize: 13, fontWeight: 500 }),
  badge:           makeElement({ bgColor: '#c4a882', textColor: '#3d2b1f', borderRadius: 2, fontSize: 11, fontWeight: 600 }),
};

const BLANC_THEME: KioskTheme = {
  background:      makeElement({ bgColor: '#ffffff' }),
  primaryButton:   makeElement({ bgColor: '#000000', textColor: '#ffffff', borderRadius: 8, fontSize: 16, fontWeight: 600 }),
  secondaryButton: makeElement({ bgColor: '#f5f5f5', textColor: '#333333', borderRadius: 8, fontSize: 14, fontWeight: 400 }),
  heading:         makeElement({ bgColor: 'transparent', textColor: '#000000', fontSize: 36, fontWeight: 700 }),
  subheading:      makeElement({ bgColor: 'transparent', textColor: '#666666', fontSize: 16, fontWeight: 400 }),
  productCard:     makeElement({ bgColor: '#ffffff', borderRadius: 12, shadow: { enabled: false, size: 'sm' }, border: { enabled: true, color: '#eeeeee', width: 1 }, textColor: '#000000' }),
  navbar:          makeElement({ bgColor: '#ffffff', textColor: '#000000', fontSize: 14, fontWeight: 500 }),
  badge:           makeElement({ bgColor: '#f5f5f5', textColor: '#333333', borderRadius: 4, fontSize: 11, fontWeight: 600 }),
};

const KIOSK_TEMPLATES: KioskTemplate[] = [
  {
    id: 'fast-food',
    label: 'Fast Food',
    description: 'Fond sombre, CTAs orange vif, images larges, flow simplifié',
    icon: Zap,
    accentColor: '#ff6b00',
    bgSwatch: '#1a1a1a',
    theme: FAST_FOOD_THEME,
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    description: 'Élégant et minimaliste, couleurs chaudes, descriptions détaillées',
    icon: Utensils,
    accentColor: '#8b5e3c',
    bgSwatch: '#fdf8f3',
    theme: RESTAURANT_THEME,
  },
  {
    id: 'blanc',
    label: 'Blanc',
    description: 'Fond blanc épuré, entièrement personnalisable',
    icon: Layout,
    accentColor: '#000000',
    bgSwatch: '#ffffff',
    theme: BLANC_THEME,
  },
];

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

// ── API types ─────────────────────────────────────────────────────────────────

interface MenuCategory {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId?: string;
  badge?: string | null;
  emoji?: string;
  imageUrl?: string | null;
}

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

// ── Panel: Templates ──────────────────────────────────────────────────────────

function TemplatesPanel({
  activeTemplate,
  onApply,
}: {
  activeTemplate: string;
  onApply: (t: KioskTemplate) => void;
}) {
  return (
    <div className="space-y-3 px-5 py-4">
      <p className="text-xs text-surface-500 leading-relaxed">
        Choisissez un point de départ pour votre borne. Vous pourrez tout personnaliser ensuite.
      </p>

      {KIOSK_TEMPLATES.map((tpl) => {
        const Icon = tpl.icon;
        const isActive = activeTemplate === tpl.id;
        return (
          <motion.button
            key={tpl.id}
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onApply(tpl)}
            className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
              isActive
                ? 'border-[#1EFF6A] bg-[#1EFF6A]/5'
                : 'border-surface-100 hover:border-surface-200 hover:bg-surface-50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {/* Color preview */}
              <div className="flex h-10 w-16 overflow-hidden rounded-lg shadow-sm flex-shrink-0">
                <div className="h-full w-1/2" style={{ background: tpl.bgSwatch, border: '1px solid #e4e4e7' }} />
                <div className="h-full w-1/2" style={{ background: tpl.accentColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon size={14} style={{ color: isActive ? '#1EFF6A' : tpl.accentColor }} />
                  <span className="font-bold text-sm text-surface-900">{tpl.label}</span>
                  {isActive && <Check size={12} style={{ color: '#1EFF6A' }} />}
                </div>
                <p className="text-[11px] text-surface-500 mt-0.5 leading-tight">{tpl.description}</p>
              </div>
            </div>
            {/* Mini layout preview */}
            <div
              className="flex h-14 w-full rounded-lg overflow-hidden"
              style={{ background: tpl.bgSwatch, border: '1px solid #e4e4e7' }}
            >
              {/* Sidebar */}
              <div className="w-8 h-full flex flex-col items-center py-1.5 gap-1" style={{ background: tpl.theme.navbar.bgColor }}>
                <div className="w-4 h-1.5 rounded-full" style={{ background: tpl.theme.navbar.textColor, opacity: 0.7 }} />
                <div className="w-3 h-1 rounded-full" style={{ background: tpl.theme.navbar.textColor, opacity: 0.4 }} />
                <div className="w-3 h-1 rounded-full" style={{ background: tpl.theme.navbar.textColor, opacity: 0.4 }} />
              </div>
              {/* Content */}
              <div className="flex-1 p-1.5 grid grid-cols-3 gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded"
                    style={{
                      background: tpl.theme.productCard.bgColor,
                      border: tpl.theme.productCard.border.enabled
                        ? `1px solid ${tpl.theme.productCard.border.color}`
                        : undefined,
                    }}
                  />
                ))}
              </div>
              {/* CTA strip */}
              <div className="w-12 h-full flex items-end justify-center pb-2">
                <div
                  className="w-8 h-3 rounded"
                  style={{ background: tpl.accentColor }}
                />
              </div>
            </div>
          </motion.button>
        );
      })}

      {/* Thèmes rapides sous-section */}
      <div className="border-t border-surface-100 pt-3 mt-2">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-surface-400">Thèmes rapides</p>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApply({ id: preset.id, label: preset.label, description: preset.description, icon: Icon, accentColor: preset.theme.primaryButton.bgColor, bgSwatch: preset.theme.background.bgColor, theme: preset.theme })}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 transition-all ${
                  activeTemplate === preset.id
                    ? 'border-[#1EFF6A] bg-[#1EFF6A]/5'
                    : 'border-surface-100 hover:border-surface-200 hover:bg-surface-50'
                }`}
              >
                <Icon
                  size={16}
                  style={{ color: activeTemplate === preset.id ? '#1EFF6A' : '#71717a' }}
                />
                <span className="text-[10px] font-semibold text-surface-700">{preset.label}</span>
                {activeTemplate === preset.id && (
                  <Check size={10} style={{ color: '#1EFF6A' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Panel: Branding ───────────────────────────────────────────────────────────

function BrandingPanel({
  branding,
  onChange,
}: {
  branding: BrandingConfig;
  onChange: (patch: Partial<BrandingConfig>) => void;
}) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoBase64' | 'backgroundBase64',
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ [field]: ev.target?.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-5 px-5 py-4">
      {/* Logo */}
      <div>
        <SectionLabel>Logo de la borne</SectionLabel>
        <p className="mb-2 text-[11px] text-surface-400">Affiché dans l&apos;en-tête de la borne</p>
        {branding.logoBase64 ? (
          <div className="relative flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={branding.logoBase64} alt="logo" className="h-12 w-12 rounded-lg object-contain bg-white border border-surface-100" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-surface-700">Logo importé</p>
              <button
                type="button"
                onClick={() => onChange({ logoBase64: null })}
                className="mt-0.5 text-[11px] text-red-500 hover:text-red-700"
              >
                Supprimer
              </button>
            </div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="text-xs text-surface-500 hover:text-surface-700 flex items-center gap-1"
            >
              <Upload size={12} /> Changer
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 py-5 transition-colors hover:border-[#1EFF6A]/60 hover:bg-[#1EFF6A]/5">
            <Upload className="h-5 w-5 text-surface-400" />
            <span className="text-xs font-medium text-surface-500">Cliquer pour importer</span>
            <span className="text-[10px] text-surface-400">PNG, JPG, SVG — max 2 Mo</span>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFileUpload(e, 'logoBase64')}
            />
          </label>
        )}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFileUpload(e, 'logoBase64')}
          tabIndex={-1}
        />
      </div>

      {/* Background image */}
      <div>
        <SectionLabel>Image de fond globale</SectionLabel>
        <p className="mb-2 text-[11px] text-surface-400">Appliquée sur l&apos;écran d&apos;accueil</p>
        {branding.backgroundBase64 ? (
          <div className="relative overflow-hidden rounded-xl border border-surface-200" style={{ height: 80 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={branding.backgroundBase64} alt="fond" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-between px-3 bg-black/30">
              <button
                type="button"
                onClick={() => bgInputRef.current?.click()}
                className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm hover:bg-white/30"
              >
                Changer
              </button>
              <button
                type="button"
                onClick={() => onChange({ backgroundBase64: null })}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 py-4 text-sm font-medium text-surface-500 transition-colors hover:border-[#1EFF6A]/60 hover:bg-[#1EFF6A]/5">
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFileUpload(e, 'backgroundBase64')}
            />
            <ImagePlus className="h-4 w-4" />
            Importer une image de fond
          </label>
        )}
        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFileUpload(e, 'backgroundBase64')}
          tabIndex={-1}
        />
      </div>

      {/* Primary color */}
      <div>
        <SectionLabel>Couleur principale</SectionLabel>
        <p className="mb-2 text-[11px] text-surface-400">Appliquée aux boutons et accents de la borne</p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={branding.primaryColor}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            className="h-10 w-14 cursor-pointer rounded-xl border border-surface-200 p-0.5"
          />
          <input
            type="text"
            value={branding.primaryColor}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            className="flex-1 rounded-xl border border-surface-200 px-3 py-2 font-mono text-sm text-surface-800 outline-none focus:border-[#1EFF6A]"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['#1EFF6A', '#f97316', '#3b82f6', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#ec4899'].map((c) => (
            <ColorSwatch key={c} color={c} active={branding.primaryColor === c} onClick={() => onChange({ primaryColor: c })} />
          ))}
        </div>
      </div>

      {/* Category icons */}
      <div>
        <SectionLabel>Icônes des catégories</SectionLabel>
        <p className="mb-2 text-[11px] text-surface-400">Choisissez une icône emoji par catégorie</p>
        <div className="space-y-2">
          {Object.entries(PRESET_CATEGORY_ICONS).map(([cat, icons]) => (
            <div key={cat} className="flex items-center gap-2">
              <span className="w-16 text-[11px] font-semibold text-surface-600 capitalize">{cat}</span>
              <div className="flex gap-1.5">
                {icons.map((ico) => (
                  <button
                    key={ico}
                    type="button"
                    onClick={() => onChange({ categoryIcons: { ...branding.categoryIcons, [cat]: ico } })}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border text-lg transition-all ${
                      branding.categoryIcons[cat] === ico
                        ? 'border-[#1EFF6A] bg-[#1EFF6A]/10 scale-110'
                        : 'border-surface-200 hover:bg-surface-50'
                    }`}
                  >
                    {ico}
                  </button>
                ))}
              </div>
              <Smile size={14} className="text-surface-300 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Panel: Language ───────────────────────────────────────────────────────────

function LanguagePanel({
  langConfig,
  onChange,
}: {
  langConfig: LangConfig;
  onChange: (patch: Partial<LangConfig>) => void;
}) {
  const currentLang = LANG_OPTIONS.find((l) => l.code === langConfig.displayLang) ?? LANG_OPTIONS[0];
  const i18n = ELEMENT_LABELS_I18N[langConfig.displayLang];

  return (
    <div className="space-y-5 px-5 py-4">
      {/* Display language */}
      <div>
        <SectionLabel>Langue d&apos;affichage</SectionLabel>
        <p className="mb-3 text-[11px] text-surface-400">
          Langue principale de la borne (interface, boutons, messages)
        </p>
        <div className="flex gap-2">
          {LANG_OPTIONS.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => onChange({ displayLang: lang.code })}
              className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 transition-all ${
                langConfig.displayLang === lang.code
                  ? 'border-[#1EFF6A] bg-[#1EFF6A]/5'
                  : 'border-surface-100 hover:border-surface-200 hover:bg-surface-50'
              }`}
            >
              <span
                className={`text-lg font-black ${lang.dir === 'rtl' ? 'font-arabic' : ''}`}
                dir={lang.dir}
              >
                {lang.nativeLabel}
              </span>
              <span className="text-[10px] text-surface-500">{lang.label}</span>
              {langConfig.displayLang === lang.code && (
                <Check size={10} style={{ color: '#1EFF6A' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-language toggle */}
      <div className="rounded-xl border border-surface-100 bg-surface-50 p-4 space-y-3">
        <Toggle
          label="Multi-langue (choix au démarrage)"
          value={langConfig.multiLang}
          onChange={(v) => onChange({ multiLang: v })}
        />
        {langConfig.multiLang && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[11px] text-surface-500 leading-relaxed">
              Le client pourra choisir la langue au lancement de la borne. Toutes les langues activées seront disponibles : {LANG_OPTIONS.map((l) => l.label).join(', ')}.
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#1EFF6A]/10 border border-[#1EFF6A]/30 px-3 py-2">
              <Globe size={13} style={{ color: '#1EFF6A' }} />
              <span className="text-[11px] font-semibold text-surface-700">
                Écran de sélection de langue activé
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Preview of translated strings */}
      <div>
        <SectionLabel>Aperçu traduction — {currentLang.label}</SectionLabel>
        <div
          className="rounded-xl border border-surface-100 overflow-hidden"
          dir={currentLang.dir}
        >
          {Object.entries(i18n).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between px-3 py-2 even:bg-surface-50 border-b border-surface-100 last:border-0">
              <span className="text-[10px] font-mono text-surface-400">{key}</span>
              <span className="text-xs font-semibold text-surface-800">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Fallback preview data (used while loading or if API unavailable) ──────────

const FALLBACK_PRODUCTS: MenuItem[] = [
  { id: 'p1', name: 'Burger Classic',  price: 12.90, emoji: '🍔', badge: 'Best-seller' },
  { id: 'p2', name: 'Salade César',    price: 9.50,  emoji: '🥗', badge: null },
  { id: 'p3', name: 'Pâtes Carbonara', price: 11.50, emoji: '🍝', badge: null },
  { id: 'p4', name: 'Tiramisu',        price: 6.50,  emoji: '🍮', badge: 'Nouveau' },
];

const FALLBACK_CATEGORIES: MenuCategory[] = [
  { id: 'c1', name: 'Menus' },
  { id: 'c2', name: 'Entrées' },
  { id: 'c3', name: 'Plats' },
  { id: 'c4', name: 'Desserts' },
];

// ── Preview Screens ───────────────────────────────────────────────────────────

function PreviewAccueil({
  theme,
  branding,
  langConfig,
}: {
  theme: KioskTheme;
  branding: BrandingConfig;
  langConfig: LangConfig;
}) {
  const bgStyle = applyTheme(theme.background);
  const btnStyle = applyTheme(theme.primaryButton);
  const h1Style = applyTheme(theme.heading);
  const h2Style = applyTheme(theme.subheading);
  const i18n = ELEMENT_LABELS_I18N[langConfig.displayLang];

  // If background image override from branding
  const containerStyle: React.CSSProperties = branding.backgroundBase64
    ? {
        ...bgStyle,
        backgroundImage: `url(${branding.backgroundBase64})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : bgStyle;

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-5 p-6"
      style={containerStyle}
    >
      {/* Logo or default F icon */}
      {branding.logoBase64 ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={branding.logoBase64}
          alt="logo"
          className="h-14 w-14 rounded-2xl object-contain"
          style={{ background: 'white', padding: 4 }}
        />
      ) : (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: branding.primaryColor + '20' }}
        >
          <span className="text-3xl font-black" style={{ color: branding.primaryColor }}>F</span>
        </div>
      )}

      <div className="text-center">
        <p style={{ ...h1Style, background: undefined, border: undefined, boxShadow: undefined, fontSize: Math.min(h1Style.fontSize as number, 28) }}>FoodStack</p>
        <p style={{ ...h2Style, background: undefined, border: undefined, boxShadow: undefined, fontSize: Math.min(h2Style.fontSize as number, 16) }} className="mt-1">
          {i18n.welcome}
        </p>
      </div>

      <div
        className="flex cursor-pointer items-center justify-center px-8 py-3 text-sm font-bold"
        style={{ ...btnStyle, background: branding.primaryColor, color: theme.primaryButton.textColor }}
      >
        {i18n.tapToOrder}
      </div>

      {/* Multi-lang indicator */}
      {langConfig.multiLang && (
        <div className="flex gap-1.5 mt-1">
          {LANG_OPTIONS.map((l) => (
            <span
              key={l.code}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                background: langConfig.displayLang === l.code ? branding.primaryColor : 'rgba(0,0,0,0.1)',
                color: langConfig.displayLang === l.code ? theme.primaryButton.textColor : theme.subheading.textColor,
              }}
            >
              {l.nativeLabel}
            </span>
          ))}
        </div>
      )}

      <p style={{ color: theme.subheading.textColor, fontSize: 11 }} className="opacity-60">
        Commande rapide • Sans contact
      </p>
    </div>
  );
}

function PreviewMenu({
  theme,
  products,
  categories,
  branding,
  langConfig,
}: {
  theme: KioskTheme;
  products: MenuItem[];
  categories: MenuCategory[];
  branding: BrandingConfig;
  langConfig: LangConfig;
}) {
  const navStyle = applyTheme(theme.navbar);
  const cardStyle = applyTheme(theme.productCard);
  const badgeStyle = applyTheme(theme.badge);
  const bgStyle = applyTheme(theme.background);
  const primaryStyle = applyTheme(theme.primaryButton);
  const i18n = ELEMENT_LABELS_I18N[langConfig.displayLang];

  return (
    <div className="flex h-full w-full flex-col" style={bgStyle}>
      {/* Nav */}
      <div className="flex items-center justify-between px-3 py-2 text-xs" style={{ ...navStyle, borderRadius: 0 }}>
        {branding.logoBase64 ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={branding.logoBase64} alt="logo" className="h-5 w-5 rounded object-contain" style={{ background: 'white' }} />
        ) : (
          <span className="font-bold">FoodStack</span>
        )}
        <div
          className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold"
          style={{ ...primaryStyle, background: branding.primaryColor }}
        >
          <ShoppingCart size={10} />
          <span>2 — 22,40 €</span>
        </div>
      </div>

      {/* Categories row */}
      <div className="flex gap-1 overflow-x-auto px-2 py-1.5">
        {categories.slice(0, 4).map((cat, i) => (
          <div
            key={cat.id}
            className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold"
            style={i === 0
              ? { background: branding.primaryColor, color: theme.primaryButton.textColor }
              : { background: theme.secondaryButton.bgColor, color: theme.secondaryButton.textColor }
            }
          >
            {cat.name}
          </div>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-hidden p-2">
        <div className="grid grid-cols-2 gap-2">
          {products.slice(0, 4).map((p) => (
            <div key={p.id} className="flex flex-col items-center p-2" style={cardStyle}>
              {p.badge && (
                <div className="mb-1 self-start px-1.5 py-0.5 text-[9px] font-bold" style={badgeStyle}>
                  {p.badge}
                </div>
              )}
              <span className="text-2xl">{p.emoji ?? '🍽️'}</span>
              <p className="mt-1 text-center text-[10px] font-bold" style={{ color: theme.productCard.textColor }}>
                {p.name}
              </p>
              <p className="mt-0.5 text-[11px] font-black" style={{ color: branding.primaryColor }}>
                {p.price.toFixed(2)} €
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="sr-only">{i18n.cart}</div>
    </div>
  );
}

function PreviewPanier({
  theme,
  products,
  branding,
  langConfig,
}: {
  theme: KioskTheme;
  products: MenuItem[];
  branding: BrandingConfig;
  langConfig: LangConfig;
}) {
  const bgStyle = applyTheme(theme.background);
  const navStyle = applyTheme(theme.navbar);
  const cardStyle = applyTheme(theme.productCard);
  const primaryStyle = applyTheme(theme.primaryButton);
  const secondaryStyle = applyTheme(theme.secondaryButton);
  const headStyle = applyTheme(theme.heading);
  const i18n = ELEMENT_LABELS_I18N[langConfig.displayLang];

  const previewItems = products.slice(0, 2);
  const subtotal = previewItems.reduce((sum, p) => sum + p.price, 0);
  const tva = subtotal * 0.1;

  return (
    <div className="flex h-full w-full flex-col" style={bgStyle}>
      <div className="flex items-center justify-between px-3 py-2" style={{ ...navStyle, borderRadius: 0 }}>
        <span className="text-xs font-bold">{i18n.cart}</span>
        <ShoppingCart size={14} />
      </div>

      <div className="flex-1 overflow-hidden p-3 space-y-2">
        {previewItems.map((p) => (
          <div key={p.id} className="flex items-center gap-2 px-2 py-2" style={cardStyle}>
            <span className="text-xl">{p.emoji ?? '🍽️'}</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[10px] font-bold" style={{ color: theme.productCard.textColor }}>{p.name}</p>
              <p className="text-[10px]" style={{ color: theme.subheading.textColor }}>× 1</p>
            </div>
            <p className="text-[11px] font-black" style={{ color: branding.primaryColor }}>
              {p.price.toFixed(2)} €
            </p>
          </div>
        ))}

        <div className="rounded-xl p-3 space-y-1" style={cardStyle}>
          <div className="flex justify-between text-[10px]" style={{ color: theme.subheading.textColor }}>
            <span>Sous-total</span><span>{subtotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-[10px]" style={{ color: theme.subheading.textColor }}>
            <span>TVA</span><span>{tva.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-[11px] font-black border-t pt-1" style={{ borderColor: theme.productCard.border.color, color: theme.productCard.textColor }}>
            <span>Total</span><span>{(subtotal + tva).toFixed(2)} €</span>
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
          style={{ ...primaryStyle, background: branding.primaryColor }}
        >
          {i18n.pay} →
        </div>
      </div>

      <div className="sr-only">{headStyle.color}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kioskDesignerState';

interface PersistedState {
  theme: KioskTheme;
  branding: BrandingConfig;
  langConfig: LangConfig;
  activeTemplate: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  logoBase64: null,
  backgroundBase64: null,
  primaryColor: '#1EFF6A',
  categoryIcons: {
    menus:    '🍱',
    entrees:  '🥗',
    plats:    '🍽️',
    desserts: '🍮',
    boissons: '🥤',
  },
};

const DEFAULT_LANG: LangConfig = {
  displayLang: 'fr',
  multiLang: false,
};

export default function KioskDesignerPage() {
  const ctxId = useRestaurantId();
  const { user } = useAuthStore();
  const restaurantId = ctxId || (user?.restaurantIds?.[0] ?? '');

  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;

    async function fetchMenuData() {
      setDataLoading(true);
      try {
        const data = await (api.get(`/menu?restaurantId=${restaurantId}`) as Promise<{ categories?: MenuCategory[]; items?: MenuItem[] }>);
        if (Array.isArray(data.categories) && data.categories.length > 0) setCategories(data.categories);
        if (Array.isArray(data.items) && data.items.length > 0) setProducts(data.items);
      } catch {
        setProducts([]);
        setCategories([]);
      } finally {
        setDataLoading(false);
      }
    }

    void fetchMenuData();
  }, [restaurantId]);

  const [theme, setTheme] = useState<KioskTheme>(MINIMAL_THEME);
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [langConfig, setLangConfig] = useState<LangConfig>(DEFAULT_LANG);
  const [selectedElement, setSelectedElement] = useState<ElementKey>('background');
  const [previewTab, setPreviewTab] = useState<PreviewTab>('accueil');
  const [activeTemplate, setActiveTemplate] = useState<string>('minimal');
  const [panelTab, setPanelTab] = useState<PanelTab>('templates');

  // Load persisted state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.branding) setBranding(parsed.branding);
        if (parsed.langConfig) setLangConfig(parsed.langConfig);
        if (parsed.activeTemplate) setActiveTemplate(parsed.activeTemplate);
      }
    } catch {
      // Malformed — keep defaults
    }
  }, []);

  const updateElement = useCallback((key: ElementKey, patch: Partial<ElementTheme>) => {
    setTheme((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...patch },
    }));
    setActiveTemplate('');
  }, []);

  const applyTemplate = useCallback((tpl: KioskTemplate) => {
    setTheme(tpl.theme);
    setBranding((prev) => ({ ...prev, primaryColor: tpl.accentColor }));
    setActiveTemplate(tpl.id);
  }, []);

  const updateBranding = useCallback((patch: Partial<BrandingConfig>) => {
    setBranding((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateLang = useCallback((patch: Partial<LangConfig>) => {
    setLangConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      const state: PersistedState = { theme, branding, langConfig, activeTemplate };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      // Also keep legacy kioskTheme key for the kiosk display page
      localStorage.setItem('kioskTheme', JSON.stringify(theme));
    }
    toast.success('Design sauvegardé !', {
      style: { fontWeight: 600 },
      iconTheme: { primary: '#1EFF6A', secondary: '#000' },
    });
  };

  const handleLaunch = () => {
    if (typeof window !== 'undefined') {
      const state: PersistedState = { theme, branding, langConfig, activeTemplate };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem('kioskTheme', JSON.stringify(theme));
      window.open('/kiosk/demo', '_blank', 'fullscreen=yes');
    }
  };

  const PANEL_TABS: { id: PanelTab; label: string; icon: typeof Globe }[] = [
    { id: 'templates', label: 'Templates',  icon: Layout },
    { id: 'branding',  label: 'Icônes',     icon: ImagePlus },
    { id: 'language',  label: 'Langue',     icon: Globe },
    { id: 'elements',  label: 'Éléments',   icon: Coffee },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex h-full min-h-screen bg-surface-50">

        {/* ── Left Panel: Properties ── */}
        <aside className="flex w-[42%] min-w-[360px] flex-col border-r border-surface-100 bg-white">

          {/* Header */}
          <div className="border-b border-surface-100 px-5 py-4">
            <h1 className="text-lg font-bold text-surface-900">Designer de borne</h1>
            <p className="mt-0.5 text-xs text-surface-500">Personnalisez chaque élément de l&apos;interface</p>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-surface-100">
            {PANEL_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPanelTab(tab.id)}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors ${
                    panelTab === tab.id
                      ? 'border-b-2 border-[#1EFF6A] text-surface-900'
                      : 'text-surface-400 hover:text-surface-600'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {panelTab === 'templates' && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  <TemplatesPanel activeTemplate={activeTemplate} onApply={applyTemplate} />
                </motion.div>
              )}

              {panelTab === 'branding' && (
                <motion.div
                  key="branding"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  <BrandingPanel branding={branding} onChange={updateBranding} />
                </motion.div>
              )}

              {panelTab === 'language' && (
                <motion.div
                  key="language"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                >
                  <LanguagePanel langConfig={langConfig} onChange={updateLang} />
                </motion.div>
              )}

              {panelTab === 'elements' && (
                <motion.div
                  key="elements"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                >
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
                </motion.div>
              )}
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
            {dataLoading && (
              <span className="ml-2 text-xs text-surface-400 animate-pulse">Chargement du menu…</span>
            )}
            {/* Language badge */}
            <div className="ml-auto flex items-center gap-1.5 rounded-lg bg-surface-100 px-2.5 py-1">
              <Globe size={11} className="text-surface-400" />
              <span className="text-[11px] font-bold text-surface-600 uppercase">{langConfig.displayLang}</span>
              {langConfig.multiLang && <span className="text-[9px] text-[#1EFF6A] font-bold">MULTI</span>}
            </div>
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
                      {previewTab === 'accueil' && (
                        <PreviewAccueil theme={theme} branding={branding} langConfig={langConfig} />
                      )}
                      {previewTab === 'menu' && (
                        <PreviewMenu theme={theme} products={products} categories={categories} branding={branding} langConfig={langConfig} />
                      )}
                      {previewTab === 'panier' && (
                        <PreviewPanier theme={theme} products={products} branding={branding} langConfig={langConfig} />
                      )}
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
