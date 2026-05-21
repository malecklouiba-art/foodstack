'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, ChevronLeft, Check, Clock, CreditCard, Banknote, Smartphone, LayoutGrid } from 'lucide-react';

// ── Theme Types (mirrors designer) ────────────────────────────────────────────

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

interface ElementTheme {
  bgColor: string;
  bgGradient: GradientConfig;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  borderRadius: number;
  shadow: ShadowConfig;
  border: BorderConfig;
}

interface KioskTheme {
  background: ElementTheme;
  primaryButton: ElementTheme;
  secondaryButton: ElementTheme;
  heading: ElementTheme;
  subheading: ElementTheme;
  productCard: ElementTheme;
  navbar: ElementTheme;
  badge: ElementTheme;
}

// ── Domain Types ──────────────────────────────────────────────────────────────

type Screen = 'welcome' | 'mode' | 'menu' | 'product' | 'cart' | 'payment' | 'confirm';
type OrderMode = 'sur_place' | 'emporter';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  allergens: string[];
  options: Option[];
  badge?: string;
}

interface Option {
  id: string;
  label: string;
  choices: { id: string; label: string; extra: number }[];
}

interface CartItem {
  product: Product;
  qty: number;
  selectedOptions: Record<string, string>;
  subtotal: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'Burger Classic', category: 'plats',
    description: 'Steak haché 180g, cheddar affiné, salade, tomate, cornichons, sauce maison.',
    price: 12.9, image: '🍔', allergens: ['gluten', 'lait', 'sésame'],
    options: [
      { id: 'cuisson', label: 'Cuisson', choices: [{ id: 'saignant', label: 'Saignant', extra: 0 }, { id: 'a_point', label: 'À point', extra: 0 }, { id: 'bien_cuit', label: 'Bien cuit', extra: 0 }] },
      { id: 'supplement', label: 'Supplément', choices: [{ id: 'none', label: 'Aucun', extra: 0 }, { id: 'bacon', label: '+ Bacon', extra: 1.5 }, { id: 'oeuf', label: '+ Œuf', extra: 1 }] },
    ],
    badge: 'Best-seller',
  },
  {
    id: 'p2', name: 'Salade César', category: 'entrees',
    description: 'Laitue romaine, croûtons, parmesan, sauce César.',
    price: 9.5, image: '🥗', allergens: ['gluten', 'lait', 'poisson', 'œuf'],
    options: [
      { id: 'proteines', label: 'Protéines', choices: [{ id: 'none', label: 'Sans', extra: 0 }, { id: 'poulet', label: 'Poulet grillé', extra: 2 }, { id: 'crevettes', label: 'Crevettes', extra: 3 }] },
    ],
  },
  {
    id: 'p3', name: 'Pâtes Carbonara', category: 'plats',
    description: 'Spaghetti, lardons fumés, crème, parmesan, œuf.',
    price: 11.5, image: '🍝', allergens: ['gluten', 'lait', 'œuf'],
    options: [],
  },
  {
    id: 'p4', name: 'Tiramisu Maison', category: 'desserts',
    description: 'Biscuit cuillère, mascarpone, café, cacao.',
    price: 6.5, image: '🍮', allergens: ['gluten', 'lait', 'œuf'],
    options: [],
  },
  {
    id: 'p5', name: 'Coca-Cola', category: 'boissons',
    description: 'Boisson gazeuse 33cl.',
    price: 3.0, image: '🥤', allergens: [],
    options: [
      { id: 'taille', label: 'Taille', choices: [{ id: 'small', label: '25cl', extra: 0 }, { id: 'medium', label: '33cl', extra: 0.5 }, { id: 'large', label: '50cl', extra: 1 }] },
    ],
  },
  {
    id: 'p6', name: 'Menu Burger', category: 'menus',
    description: 'Burger Classic + Frites + Boisson au choix.',
    price: 17.9, image: '🍱', allergens: ['gluten', 'lait', 'sésame'],
    options: [
      { id: 'boisson', label: 'Boisson', choices: [{ id: 'coca', label: 'Coca-Cola', extra: 0 }, { id: 'eau', label: 'Eau', extra: 0 }, { id: 'jus', label: "Jus d'orange", extra: 0 }] },
    ],
    badge: 'Économique',
  },
  {
    id: 'p7', name: 'Soupe du Jour', category: 'entrees',
    description: 'Soupe maison, recette du chef selon les arrivages.',
    price: 7.0, image: '🍲', allergens: [],
    options: [],
  },
  {
    id: 'p8', name: 'Fondant Chocolat', category: 'desserts',
    description: 'Cœur coulant chocolat noir, boule de glace vanille.',
    price: 7.5, image: '🍫', allergens: ['gluten', 'lait', 'œuf'],
    options: [],
    badge: 'Nouveau',
  },
];

const CATEGORIES = [
  { id: 'menus',    label: 'Menus',    icon: '🍱' },
  { id: 'entrees',  label: 'Entrées',  icon: '🥗' },
  { id: 'plats',    label: 'Plats',    icon: '🍽️' },
  { id: 'desserts', label: 'Desserts', icon: '🍮' },
  { id: 'boissons', label: 'Boissons', icon: '🥤' },
];

const PAYMENT_METHODS = [
  { id: 'card',  label: 'Carte bancaire',    sublabel: 'Sans contact', icon: CreditCard },
  { id: 'cash',  label: 'Espèces',           sublabel: 'À la caisse',  icon: Banknote },
  { id: 'nfc',   label: 'Ticket restaurant', sublabel: 'NFC',          icon: Smartphone },
];

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten', lait: 'Lait', œuf: 'Œuf', poisson: 'Poisson',
  sésame: 'Sésame', soja: 'Soja', arachides: 'Arachides', fruits_coque: 'Fruits à coque',
};

// ── Animation variants ────────────────────────────────────────────────────────

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const slideUp = { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -40 } };

// ── Theme helpers ─────────────────────────────────────────────────────────────

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
  const bg = el.bgGradient.enabled ? buildGradient(el.bgGradient) : el.bgColor;
  return {
    background: bg,
    color: el.textColor,
    fontFamily: `'${el.fontFamily}', system-ui, sans-serif`,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    borderRadius: el.borderRadius,
    boxShadow: el.shadow.enabled ? SHADOW_VALUES[el.shadow.size] : undefined,
    border: el.border.enabled ? `${el.border.width}px solid ${el.border.color}` : undefined,
  };
}

// Default fallback theme (matches designer's MINIMAL_THEME)
function makeDefaultElement(overrides: Partial<ElementTheme> = {}): ElementTheme {
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

const DEFAULT_THEME: KioskTheme = {
  background:      makeDefaultElement({ bgColor: '#0f0f0f', bgGradient: { enabled: true, from: '#0f0f0f', to: '#1a1a1a', direction: 'to bottom right' }, textColor: '#ffffff' }),
  primaryButton:   makeDefaultElement({ bgColor: '#1EFF6A', textColor: '#000000', borderRadius: 16, fontSize: 20, fontWeight: 700, shadow: { enabled: true, size: 'lg' } }),
  secondaryButton: makeDefaultElement({ bgColor: 'transparent', textColor: '#6b7280', borderRadius: 12, fontSize: 16, fontWeight: 500, border: { enabled: true, color: '#374151', width: 1 } }),
  heading:         makeDefaultElement({ bgColor: 'transparent', textColor: '#ffffff', fontSize: 48, fontWeight: 900 }),
  subheading:      makeDefaultElement({ bgColor: 'transparent', textColor: '#6b7280', fontSize: 20, fontWeight: 400 }),
  productCard:     makeDefaultElement({ bgColor: '#111827', borderRadius: 20, shadow: { enabled: true, size: 'sm' }, border: { enabled: true, color: '#1f2937', width: 1 }, textColor: '#ffffff' }),
  navbar:          makeDefaultElement({ bgColor: '#030712', textColor: '#ffffff', fontSize: 16, fontWeight: 600 }),
  badge:           makeDefaultElement({ bgColor: '#1EFF6A', textColor: '#000000', borderRadius: 999, fontSize: 12, fontWeight: 700 }),
};

// ── Page ──────────────────────────────────────────────────────────────────────

// ── Category icon mapping ─────────────────────────────────────────────────────

function categoryIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('menu') || n.includes('formule')) return '🍱';
  if (n.includes('entree') || n.includes('entrée') || n.includes('starter')) return '🥗';
  if (n.includes('plat') || n.includes('main') || n.includes('burger')) return '🍽️';
  if (n.includes('dessert') || n.includes('sweet')) return '🍮';
  if (n.includes('boisson') || n.includes('drink') || n.includes('beverage')) return '🥤';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('sushi') || n.includes('asie') || n.includes('japonais')) return '🍱';
  if (n.includes('sandwich') || n.includes('wrap')) return '🥙';
  if (n.includes('salade') || n.includes('vegeta')) return '🥗';
  if (n.includes('viande') || n.includes('grill')) return '🥩';
  if (n.includes('poisson') || n.includes('fruit de mer')) return '🐟';
  if (n.includes('petit-déj') || n.includes('brunch')) return '☕';
  return '🍴';
}

// ── API types ─────────────────────────────────────────────────────────────────

interface ApiMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string | null;
  allergens?: string[];
  isFeatured?: boolean;
  isActive?: boolean;
}

interface ApiCategory {
  id: string;
  name: string;
  items?: ApiMenuItem[];
}

export default function KioskPage() {
  const params = useParams<{ id: string }>();
  const restaurantId = params?.id;

  const [theme, setTheme] = useState<KioskTheme>(DEFAULT_THEME);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Live product/category data (fall back to seed if API unavailable)
  const [products, setProducts]     = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState(CATEGORIES);

  const [screen, setScreen] = useState<Screen>('welcome');
  const [orderMode, setOrderMode] = useState<OrderMode | null>(null);
  const [activeCategory, setActiveCategory] = useState('menus');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  // Load theme from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('kioskTheme');
      if (stored) {
        const parsed = JSON.parse(stored) as KioskTheme;
        setTheme(parsed);
      }
    } catch {
      // Malformed JSON — keep default
    }

    // Detect preview mode from URL search params
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === 'true') {
      setIsPreviewMode(true);
    }

    // Also treat /kiosk/demo as preview mode
    if (window.location.pathname === '/kiosk/demo') {
      setIsPreviewMode(true);
    }
  }, []);

  // Load real menu from API
  useEffect(() => {
    if (!restaurantId || restaurantId === 'demo') return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
    fetch(`${API_URL}/api/v1/menu?restaurantId=${restaurantId}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data: { categories?: ApiCategory[]; items?: ApiMenuItem[] } | ApiCategory[]) => {
        const rawCats: ApiCategory[] = Array.isArray(data)
          ? data
          : (data as { categories?: ApiCategory[] }).categories ?? [];

        if (rawCats.length === 0) return;

        const newCats = rawCats
          .filter((c) => c.items && c.items.length > 0)
          .map((c) => ({ id: c.id, label: c.name, icon: categoryIcon(c.name) }));

        const newProducts: Product[] = rawCats.flatMap((cat) =>
          (cat.items ?? [])
            .filter((it) => it.isActive !== false)
            .map((it) => ({
              id: it.id,
              name: it.name,
              description: it.description ?? '',
              price: it.price,
              category: cat.id,
              image: it.image ?? categoryIcon(cat.name),
              allergens: it.allergens ?? [],
              options: [],
              badge: it.isFeatured ? 'Best-seller' : undefined,
            }))
        );

        if (newCats.length > 0 && newProducts.length > 0) {
          setCategories(newCats);
          setProducts(newProducts);
          setActiveCategory(newCats[0].id);
        }
      })
      .catch(() => { /* keep seed fallback */ });
  }, [restaurantId]);

  const resetKiosk = useCallback(() => {
    setScreen('welcome');
    setOrderMode(null);
    setActiveCategory('menus');
    setSelectedProduct(null);
    setSelectedOptions({});
    setQty(1);
    setCart([]);
    setOrderNumber('');
    setPaymentMethod(null);
    setCountdown(30);
  }, []);

  // Auto-reset countdown on confirm screen
  useEffect(() => {
    if (screen !== 'confirm') return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => {
    if (countdown <= 0) resetKiosk();
  }, [countdown, resetKiosk]);

  const cartTotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  function addToCart() {
    if (!selectedProduct) return;
    const extraPrice = selectedProduct.options.reduce((s, opt) => {
      const choice = opt.choices.find((c) => c.id === selectedOptions[opt.id]);
      return s + (choice?.extra ?? 0);
    }, 0);
    const subtotal = (selectedProduct.price + extraPrice) * qty;
    setCart((prev) => [...prev, { product: selectedProduct, qty, selectedOptions: { ...selectedOptions }, subtotal }]);
    setScreen('menu');
    setSelectedProduct(null);
    setSelectedOptions({});
    setQty(1);
  }

  function removeFromCart(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  function placeOrder() {
    const num = Math.floor(1000 + Math.random() * 9000).toString();
    setOrderNumber(num);
    setScreen('confirm');
    setCountdown(30);
  }

  const filteredProducts = products.filter((p) => p.category === activeCategory);

  // Derived theme styles
  const bgStyle        = applyTheme(theme.background);
  const primaryStyle   = applyTheme(theme.primaryButton);
  const secondaryStyle = applyTheme(theme.secondaryButton);
  const headingStyle   = applyTheme(theme.heading);
  const subStyle       = applyTheme(theme.subheading);
  const cardStyle      = applyTheme(theme.productCard);
  const navStyle       = applyTheme(theme.navbar);
  const badgeStyle     = applyTheme(theme.badge);

  // Convenience: background-only (no text/border on wrapper divs)
  const bgBackground = bgStyle.background;
  const bgColor      = theme.background.textColor;

  return (
    <div
      className="relative flex h-screen w-screen flex-col overflow-hidden select-none"
      style={{ background: bgBackground, fontFamily: `'${theme.background.fontFamily}', system-ui, sans-serif` }}
    >
      {/* Preview mode: "back to config" button */}
      {isPreviewMode && (
        <a
          href="/dashboard/kiosk"
          className="absolute left-4 top-4 z-50 flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-opacity hover:bg-black/60"
        >
          <LayoutGrid size={13} />
          Retour config
        </a>
      )}

      <AnimatePresence mode="wait">

        {/* ── Welcome ─────────────────────────────────────────────────────── */}
        {screen === 'welcome' && (
          <motion.div
            key="welcome"
            {...fade}
            className="flex h-full flex-col items-center justify-center gap-10 p-12"
            style={{ background: bgBackground }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="text-center"
            >
              <div
                className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-3xl shadow-2xl"
                style={{ background: theme.primaryButton.bgColor }}
              >
                <span className="text-6xl font-black" style={{ color: theme.primaryButton.textColor }}>F</span>
              </div>
              <h1
                className="tracking-tight"
                style={{ ...headingStyle, background: undefined, border: undefined, boxShadow: undefined }}
              >
                FoodStack
              </h1>
              <p
                className="mt-3"
                style={{ ...subStyle, background: undefined, border: undefined, boxShadow: undefined, color: theme.primaryButton.bgColor }}
              >
                Bienvenue !
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setScreen('mode')}
              whileTap={{ scale: 0.96 }}
              style={primaryStyle}
              className="px-16 py-6 transition-all"
            >
              Toucher pour commander
            </motion.button>

            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ color: bgColor, opacity: 0.5, fontSize: 18 }}
            >
              Commande rapide • Paiement sans contact
            </motion.p>
          </motion.div>
        )}

        {/* ── Mode Selection ──────────────────────────────────────────────── */}
        {screen === 'mode' && (
          <motion.div
            key="mode"
            {...slideUp}
            className="flex h-full flex-col items-center justify-center gap-12 p-12"
            style={{ background: bgBackground }}
          >
            <div className="text-center">
              <h2
                style={{ ...headingStyle, background: undefined, border: undefined, boxShadow: undefined }}
              >
                Comment souhaitez-vous commander ?
              </h2>
              <p
                className="mt-3"
                style={{ ...subStyle, background: undefined, border: undefined, boxShadow: undefined }}
              >
                Choisissez votre mode de commande
              </p>
            </div>

            <div className="flex gap-8">
              {[
                { id: 'sur_place' as const, label: 'Sur place',  sublabel: 'Je mange ici',               icon: '🪑' },
                { id: 'emporter' as const,  label: 'À emporter', sublabel: 'Je repars avec ma commande',  icon: '🛍️' },
              ].map((opt) => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setOrderMode(opt.id); setScreen('menu'); }}
                  className="flex flex-col items-center justify-center gap-6 p-12 w-64 transition-all"
                  style={{
                    ...cardStyle,
                    border: `2px solid ${theme.primaryButton.bgColor}`,
                    background: `${theme.primaryButton.bgColor}18`,
                  }}
                >
                  <span className="text-7xl">{opt.icon}</span>
                  <div className="text-center">
                    <p
                      style={{ ...headingStyle, background: undefined, border: undefined, boxShadow: undefined, fontSize: 28 }}
                    >
                      {opt.label}
                    </p>
                    <p
                      className="mt-1"
                      style={{ ...subStyle, background: undefined, border: undefined, boxShadow: undefined, fontSize: 16 }}
                    >
                      {opt.sublabel}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>

            <button
              onClick={() => setScreen('welcome')}
              className="flex items-center gap-2 transition-opacity hover:opacity-70"
              style={secondaryStyle}
            >
              <ChevronLeft size={20} /> Retour
            </button>
          </motion.div>
        )}

        {/* ── Menu ────────────────────────────────────────────────────────── */}
        {screen === 'menu' && (
          <motion.div key="menu" {...fade} className="flex h-full">
            {/* Left: categories */}
            <div
              className="flex w-28 flex-col gap-2 p-3"
              style={{ background: theme.navbar.bgColor, borderRight: `1px solid ${theme.productCard.border.color}` }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl mx-auto"
                style={{ background: theme.primaryButton.bgColor }}
              >
                <span className="text-xl font-black" style={{ color: theme.primaryButton.textColor }}>F</span>
              </div>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex flex-col items-center gap-1 rounded-xl p-3 transition-all"
                  style={activeCategory === cat.id
                    ? { background: `${theme.primaryButton.bgColor}22`, border: `1px solid ${theme.primaryButton.bgColor}` }
                    : { border: '1px solid transparent' }
                  }
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs" style={{ color: theme.navbar.textColor, opacity: 0.7 }}>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Center: products */}
            <div className="flex flex-1 flex-col overflow-hidden" style={{ background: bgBackground }}>
              {/* Header / nav bar */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ ...navStyle, borderRadius: 0, borderBottom: `1px solid ${theme.productCard.border.color}` }}
              >
                <div>
                  <h2
                    className="font-bold"
                    style={{ color: theme.navbar.textColor, fontSize: 22, fontWeight: 700 }}
                  >
                    {categories.find((c) => c.id === activeCategory)?.label}
                  </h2>
                  <p style={{ color: theme.navbar.textColor, opacity: 0.6, fontSize: 13 }}>
                    {orderMode === 'sur_place' ? '🪑 Sur place' : '🛍️ À emporter'}
                  </p>
                </div>
                <button
                  onClick={() => setScreen('cart')}
                  className="relative flex items-center gap-3 px-6 py-3 font-bold shadow-lg transition-all active:scale-95"
                  style={primaryStyle}
                >
                  <ShoppingCart size={22} />
                  <span>{cartTotal.toFixed(2)} €</span>
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Product grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-4">
                  {filteredProducts.map((product, i) => (
                    <motion.button
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setSelectedProduct(product);
                        const defaults: Record<string, string> = {};
                        product.options.forEach((o) => { defaults[o.id] = o.choices[0]?.id ?? ''; });
                        setSelectedOptions(defaults);
                        setQty(1);
                        setScreen('product');
                      }}
                      className="flex flex-col items-center p-5 text-left transition-all"
                      style={cardStyle}
                    >
                      {product.badge && (
                        <span
                          className="mb-2 self-start px-2 py-0.5 text-xs font-bold"
                          style={badgeStyle}
                        >
                          {product.badge}
                        </span>
                      )}
                      <span className="text-5xl">{product.image}</span>
                      <p
                        className="mt-3 text-center text-base font-bold"
                        style={{ color: theme.productCard.textColor }}
                      >
                        {product.name}
                      </p>
                      <p
                        className="mt-1 line-clamp-2 text-center text-xs"
                        style={{ color: theme.productCard.textColor, opacity: 0.6 }}
                      >
                        {product.description}
                      </p>
                      <p
                        className="mt-3 text-xl font-black"
                        style={{ color: theme.primaryButton.bgColor }}
                      >
                        {product.price.toFixed(2)} €
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Product Detail ──────────────────────────────────────────────── */}
        {screen === 'product' && selectedProduct && (
          <motion.div
            key="product"
            {...slideUp}
            className="flex h-full"
            style={{ background: bgBackground }}
          >
            <div className="flex flex-1 flex-col overflow-y-auto p-10">
              <button
                onClick={() => setScreen('menu')}
                className="mb-6 flex items-center gap-2 transition-opacity hover:opacity-70"
                style={secondaryStyle}
              >
                <ChevronLeft size={20} /> Retour au menu
              </button>

              <div className="flex gap-10">
                {/* Left: product info */}
                <div className="flex-1">
                  <div
                    className="mb-6 flex h-48 items-center justify-center rounded-3xl text-9xl"
                    style={{ background: `${theme.productCard.bgColor}`, border: theme.productCard.border.enabled ? `${theme.productCard.border.width}px solid ${theme.productCard.border.color}` : undefined }}
                  >
                    {selectedProduct.image}
                  </div>

                  {selectedProduct.badge && (
                    <span className="px-3 py-1 text-sm font-bold" style={badgeStyle}>
                      {selectedProduct.badge}
                    </span>
                  )}

                  <h2
                    className="mt-4"
                    style={{ ...headingStyle, background: undefined, border: undefined, boxShadow: undefined, fontSize: 36 }}
                  >
                    {selectedProduct.name}
                  </h2>
                  <p
                    className="mt-3 leading-relaxed"
                    style={{ ...subStyle, background: undefined, border: undefined, boxShadow: undefined }}
                  >
                    {selectedProduct.description}
                  </p>

                  {selectedProduct.allergens.length > 0 && (
                    <div className="mt-6">
                      <p
                        className="mb-2 text-sm font-semibold uppercase tracking-wide"
                        style={{ color: theme.subheading.textColor, opacity: 0.6 }}
                      >
                        Allergènes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.allergens.map((a) => (
                          <span
                            key={a}
                            className="rounded-full border border-yellow-600 px-3 py-1 text-sm text-yellow-500"
                          >
                            ⚠ {ALLERGEN_LABELS[a] ?? a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: options + quantity + add */}
                <div className="w-80 flex flex-col gap-6">
                  {selectedProduct.options.map((opt) => (
                    <div key={opt.id}>
                      <p
                        className="mb-3 font-bold"
                        style={{ color: theme.heading.textColor }}
                      >
                        {opt.label}
                      </p>
                      <div className="flex flex-col gap-2">
                        {opt.choices.map((choice) => (
                          <button
                            key={choice.id}
                            onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.id]: choice.id }))}
                            className="flex items-center justify-between rounded-xl border px-4 py-3 transition-all"
                            style={selectedOptions[opt.id] === choice.id
                              ? { borderColor: theme.primaryButton.bgColor, background: `${theme.primaryButton.bgColor}18`, color: theme.heading.textColor }
                              : { borderColor: theme.productCard.border.color, color: theme.heading.textColor }
                            }
                          >
                            <span>{choice.label}</span>
                            {choice.extra > 0 && (
                              <span className="text-sm font-semibold" style={{ color: theme.primaryButton.bgColor }}>
                                +{choice.extra.toFixed(2)} €
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Qty + price */}
                  <div className="mt-auto">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          className="flex h-12 w-12 items-center justify-center rounded-full"
                          style={secondaryStyle}
                        >
                          <Minus size={18} />
                        </button>
                        <span
                          className="text-3xl font-black"
                          style={{ color: theme.heading.textColor }}
                        >
                          {qty}
                        </span>
                        <button
                          onClick={() => setQty((q) => q + 1)}
                          className="flex h-12 w-12 items-center justify-center rounded-full"
                          style={{ background: theme.primaryButton.bgColor, color: theme.primaryButton.textColor, borderRadius: '50%' }}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <span className="text-3xl font-black" style={{ color: theme.heading.textColor }}>
                        {(() => {
                          const extra = selectedProduct.options.reduce((s, opt) => {
                            const choice = opt.choices.find((c) => c.id === selectedOptions[opt.id]);
                            return s + (choice?.extra ?? 0);
                          }, 0);
                          return ((selectedProduct.price + extra) * qty).toFixed(2);
                        })()} €
                      </span>
                    </div>
                    <button
                      onClick={addToCart}
                      className="w-full py-5 text-xl font-black shadow-lg transition-all active:scale-95"
                      style={primaryStyle}
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Cart ────────────────────────────────────────────────────────── */}
        {screen === 'cart' && (
          <motion.div
            key="cart"
            {...slideUp}
            className="flex h-full flex-col p-10"
            style={{ background: bgBackground }}
          >
            <div className="mb-8 flex items-center justify-between">
              <button
                onClick={() => setScreen('menu')}
                className="flex items-center gap-2 transition-opacity hover:opacity-70"
                style={secondaryStyle}
              >
                <ChevronLeft size={20} /> Continuer à commander
              </button>
              <h2
                className="text-3xl font-black"
                style={{ ...headingStyle, background: undefined, border: undefined, boxShadow: undefined, fontSize: 30 }}
              >
                Votre commande
              </h2>
              <div className="w-48" />
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6">
                <span className="text-8xl">🛒</span>
                <p
                  className="text-2xl"
                  style={{ ...subStyle, background: undefined, border: undefined, boxShadow: undefined }}
                >
                  Votre panier est vide
                </p>
                <button
                  onClick={() => setScreen('menu')}
                  className="px-8 py-4 text-lg font-bold transition-all active:scale-95"
                  style={primaryStyle}
                >
                  Parcourir le menu
                </button>
              </div>
            ) : (
              <div className="flex flex-1 gap-10 overflow-hidden">
                {/* Items list */}
                <div className="flex-1 overflow-y-auto">
                  <div className="flex flex-col gap-4">
                    {cart.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-5 p-5"
                        style={cardStyle}
                      >
                        <span className="text-4xl">{item.product.image}</span>
                        <div className="flex-1">
                          <p className="font-bold" style={{ color: theme.productCard.textColor }}>
                            {item.product.name}
                          </p>
                          {Object.entries(item.selectedOptions).map(([optId, choiceId]) => {
                            const opt = item.product.options.find((o) => o.id === optId);
                            const choice = opt?.choices.find((c) => c.id === choiceId);
                            return choice && (
                              <p key={optId} style={{ color: theme.productCard.textColor, opacity: 0.5, fontSize: 13 }}>
                                {opt?.label}: {choice.label}
                              </p>
                            );
                          })}
                          <p style={{ color: theme.productCard.textColor, opacity: 0.4, fontSize: 13 }}>× {item.qty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black" style={{ color: theme.primaryButton.bgColor }}>
                            {item.subtotal.toFixed(2)} €
                          </p>
                          <button
                            onClick={() => removeFromCart(i)}
                            style={{ color: theme.subheading.textColor, opacity: 0.5 }}
                            className="mt-1 transition-opacity hover:opacity-100"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Order summary */}
                <div className="w-80 flex flex-col gap-6">
                  <div className="p-6" style={cardStyle}>
                    <p
                      className="text-lg font-bold mb-4"
                      style={{ color: theme.productCard.textColor, opacity: 0.6 }}
                    >
                      Récapitulatif
                    </p>
                    <div className="flex justify-between" style={{ color: theme.productCard.textColor, opacity: 0.6 }}>
                      <span>Sous-total</span>
                      <span>{cartTotal.toFixed(2)} €</span>
                    </div>
                    <div className="mt-2 flex justify-between" style={{ color: theme.productCard.textColor, opacity: 0.6 }}>
                      <span>TVA (10%)</span>
                      <span>{(cartTotal * 0.1).toFixed(2)} €</span>
                    </div>
                    <div
                      className="mt-4 border-t pt-4 flex justify-between text-xl font-black"
                      style={{ borderColor: theme.productCard.border.color, color: theme.productCard.textColor }}
                    >
                      <span>Total</span>
                      <span>{cartTotal.toFixed(2)} €</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setScreen('payment')}
                    className="w-full py-5 text-xl font-black shadow-lg transition-all active:scale-95"
                    style={primaryStyle}
                  >
                    Passer au paiement →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Payment ─────────────────────────────────────────────────────── */}
        {screen === 'payment' && (
          <motion.div
            key="payment"
            {...slideUp}
            className="flex h-full flex-col items-center justify-center gap-10 p-12"
            style={{ background: bgBackground }}
          >
            <div className="text-center">
              <h2
                style={{ ...headingStyle, background: undefined, border: undefined, boxShadow: undefined, fontSize: 48 }}
              >
                Mode de paiement
              </h2>
              <p className="mt-3 text-xl" style={{ ...subStyle, background: undefined, border: undefined, boxShadow: undefined }}>
                Total :{' '}
                <span className="font-black" style={{ color: theme.heading.textColor }}>
                  {cartTotal.toFixed(2)} €
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-lg">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const selected = paymentMethod === method.id;
                return (
                  <motion.button
                    key={method.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaymentMethod(method.id)}
                    className="flex items-center gap-5 p-6 transition-all"
                    style={selected
                      ? { ...cardStyle, border: `2px solid ${theme.primaryButton.bgColor}`, background: `${theme.primaryButton.bgColor}18` }
                      : cardStyle
                    }
                  >
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl"
                      style={{ background: theme.secondaryButton.bgColor }}
                    >
                      <Icon
                        size={28}
                        style={{ color: selected ? theme.primaryButton.bgColor : theme.subheading.textColor }}
                      />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-xl font-bold" style={{ color: theme.productCard.textColor }}>{method.label}</p>
                      <p className="text-sm" style={{ color: theme.subheading.textColor }}>{method.sublabel}</p>
                    </div>
                    {selected && (
                      <Check size={24} style={{ color: theme.primaryButton.bgColor }} />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setScreen('cart')}
                className="flex items-center gap-2 px-8 py-4 transition-all"
                style={secondaryStyle}
              >
                <ChevronLeft size={20} /> Retour
              </button>
              <button
                onClick={placeOrder}
                disabled={!paymentMethod}
                className="px-12 py-4 text-xl font-black shadow-lg transition-all disabled:opacity-40 active:scale-95"
                style={paymentMethod ? primaryStyle : { ...primaryStyle, background: '#4b5563' }}
              >
                Confirmer la commande →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Confirmation ─────────────────────────────────────────────────── */}
        {screen === 'confirm' && (
          <motion.div
            key="confirm"
            {...fade}
            className="flex h-full flex-col items-center justify-center gap-10 p-12"
            style={{ background: bgBackground }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex h-32 w-32 items-center justify-center rounded-full"
              style={{ background: theme.primaryButton.bgColor }}
            >
              <Check size={60} style={{ color: theme.primaryButton.textColor }} strokeWidth={3} />
            </motion.div>

            <div className="text-center">
              <h2
                style={{ ...headingStyle, background: undefined, border: undefined, boxShadow: undefined, fontSize: 48 }}
              >
                Commande confirmée !
              </h2>
              <p
                className="mt-3 text-2xl"
                style={{ ...subStyle, background: undefined, border: undefined, boxShadow: undefined }}
              >
                {orderMode === 'sur_place'
                  ? 'Votre commande arrive bientôt'
                  : 'Récupérez votre commande au comptoir'}
              </p>
            </div>

            <div className="p-10 text-center" style={cardStyle}>
              <p
                className="text-lg uppercase tracking-widest mb-3"
                style={{ color: theme.productCard.textColor, opacity: 0.5 }}
              >
                Numéro de commande
              </p>
              <p className="text-8xl font-black" style={{ color: theme.primaryButton.bgColor }}>
                #{orderNumber}
              </p>
            </div>

            <div className="flex items-center gap-3" style={{ color: theme.subheading.textColor }}>
              <Clock size={20} />
              <p className="text-xl">
                Temps d&apos;attente estimé :{' '}
                <span className="font-bold" style={{ color: theme.heading.textColor }}>15–20 min</span>
              </p>
            </div>

            <div className="text-center">
              <p className="mb-4" style={{ color: theme.subheading.textColor }}>
                Nouvelle commande dans {countdown}s
              </p>
              <button
                onClick={resetKiosk}
                className="px-10 py-4 text-lg font-bold transition-all active:scale-95"
                style={primaryStyle}
              >
                Nouvelle commande
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
