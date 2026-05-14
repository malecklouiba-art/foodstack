'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, ChevronLeft, Check, Clock, CreditCard, Banknote, Smartphone } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

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
      { id: 'boisson', label: 'Boisson', choices: [{ id: 'coca', label: 'Coca-Cola', extra: 0 }, { id: 'eau', label: 'Eau', extra: 0 }, { id: 'jus', label: 'Jus d\'orange', extra: 0 }] },
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
  { id: 'card',   label: 'Carte bancaire', sublabel: 'Sans contact', icon: CreditCard },
  { id: 'cash',   label: 'Espèces',        sublabel: 'À la caisse',  icon: Banknote },
  { id: 'nfc',    label: 'Ticket restaurant', sublabel: 'NFC',       icon: Smartphone },
];

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten', lait: 'Lait', œuf: 'Œuf', poisson: 'Poisson',
  sésame: 'Sésame', soja: 'Soja', arachides: 'Arachides', fruits_coque: 'Fruits à coque',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const slideUp = { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -40 } };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KioskPage() {
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

  // Auto-reset on welcome screen idle
  useEffect(() => {
    if (screen !== 'confirm') return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [screen]);

  useEffect(() => {
    if (countdown <= 0) resetKiosk();
  }, [countdown]);

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

  const filteredProducts = PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <div
      className="relative flex h-screen w-screen flex-col overflow-hidden select-none"
      style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)', fontFamily: 'system-ui, sans-serif' }}
    >
      <AnimatePresence mode="wait">

        {/* ── Welcome ─────────────────────────────────────────────────────── */}
        {screen === 'welcome' && (
          <motion.div key="welcome" {...fade} className="flex h-full flex-col items-center justify-center gap-10 p-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="text-center"
            >
              <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-3xl shadow-2xl"
                style={{ background: 'linear-gradient(135deg, #1EFF6A, #00cc52)' }}>
                <span className="text-6xl font-black text-black">F</span>
              </div>
              <h1 className="text-6xl font-black text-white tracking-tight">FoodStack</h1>
              <p className="mt-3 text-2xl" style={{ color: '#1EFF6A' }}>Bienvenue !</p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setScreen('mode')}
              whileTap={{ scale: 0.96 }}
              className="rounded-2xl px-16 py-6 text-2xl font-bold text-black shadow-2xl transition-all"
              style={{ background: 'linear-gradient(135deg, #1EFF6A, #00cc52)' }}
            >
              Toucher pour commander
            </motion.button>

            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg text-gray-500"
            >
              Commande rapide • Paiement sans contact
            </motion.p>
          </motion.div>
        )}

        {/* ── Mode Selection ──────────────────────────────────────────────── */}
        {screen === 'mode' && (
          <motion.div key="mode" {...slideUp} className="flex h-full flex-col items-center justify-center gap-12 p-12">
            <div className="text-center">
              <h2 className="text-5xl font-black text-white">Comment souhaitez-vous commander ?</h2>
              <p className="mt-3 text-xl text-gray-400">Choisissez votre mode de commande</p>
            </div>

            <div className="flex gap-8">
              {[
                { id: 'sur_place' as const, label: 'Sur place', sublabel: 'Je mange ici', icon: '🪑', color: '#1EFF6A' },
                { id: 'emporter' as const, label: 'À emporter', sublabel: 'Je repars avec ma commande', icon: '🛍️', color: '#3b82f6' },
              ].map((opt) => (
                <motion.button
                  key={opt.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => { setOrderMode(opt.id); setScreen('menu'); }}
                  className="flex flex-col items-center justify-center gap-6 rounded-3xl border-2 p-12 transition-all w-64"
                  style={{ borderColor: opt.color, background: `${opt.color}18` }}
                >
                  <span className="text-7xl">{opt.icon}</span>
                  <div className="text-center">
                    <p className="text-3xl font-black text-white">{opt.label}</p>
                    <p className="mt-1 text-base text-gray-400">{opt.sublabel}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            <button onClick={() => setScreen('welcome')} className="flex items-center gap-2 text-gray-500 hover:text-gray-300">
              <ChevronLeft size={20} /> Retour
            </button>
          </motion.div>
        )}

        {/* ── Menu ────────────────────────────────────────────────────────── */}
        {screen === 'menu' && (
          <motion.div key="menu" {...fade} className="flex h-full">
            {/* Left: categories */}
            <div className="flex w-28 flex-col gap-2 border-r border-gray-800 bg-gray-950 p-3">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl mx-auto"
                style={{ background: '#1EFF6A' }}>
                <span className="text-xl font-black text-black">F</span>
              </div>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex flex-col items-center gap-1 rounded-xl p-3 transition-all"
                  style={activeCategory === cat.id ? { background: '#1EFF6A22', border: '1px solid #1EFF6A' } : { border: '1px solid transparent' }}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs text-gray-400">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Center: products */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-6 py-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {orderMode === 'sur_place' ? '🪑 Sur place' : '🛍️ À emporter'}
                  </p>
                </div>
                <button
                  onClick={() => setScreen('cart')}
                  className="relative flex items-center gap-3 rounded-2xl px-6 py-3 text-black font-bold shadow-lg"
                  style={{ background: '#1EFF6A' }}
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

              {/* Grid */}
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
                      className="flex flex-col items-center rounded-2xl border border-gray-800 bg-gray-900 p-5 text-left transition-all hover:border-gray-600"
                    >
                      {product.badge && (
                        <span className="mb-2 self-start rounded-full px-2 py-0.5 text-xs font-bold text-black"
                          style={{ background: '#1EFF6A' }}>
                          {product.badge}
                        </span>
                      )}
                      <span className="text-5xl">{product.image}</span>
                      <p className="mt-3 text-center text-base font-bold text-white">{product.name}</p>
                      <p className="mt-1 line-clamp-2 text-center text-xs text-gray-500">{product.description}</p>
                      <p className="mt-3 text-xl font-black" style={{ color: '#1EFF6A' }}>{product.price.toFixed(2)} €</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Product Detail ──────────────────────────────────────────────── */}
        {screen === 'product' && selectedProduct && (
          <motion.div key="product" {...slideUp} className="flex h-full">
            <div className="flex flex-1 flex-col overflow-y-auto p-10">
              <button onClick={() => setScreen('menu')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white">
                <ChevronLeft size={20} /> Retour au menu
              </button>

              <div className="flex gap-10">
                {/* Left: product info */}
                <div className="flex-1">
                  <div className="mb-6 flex h-48 items-center justify-center rounded-3xl bg-gray-900 text-9xl">
                    {selectedProduct.image}
                  </div>
                  {selectedProduct.badge && (
                    <span className="rounded-full px-3 py-1 text-sm font-bold text-black" style={{ background: '#1EFF6A' }}>
                      {selectedProduct.badge}
                    </span>
                  )}
                  <h2 className="mt-4 text-4xl font-black text-white">{selectedProduct.name}</h2>
                  <p className="mt-3 text-lg text-gray-400 leading-relaxed">{selectedProduct.description}</p>

                  {selectedProduct.allergens.length > 0 && (
                    <div className="mt-6">
                      <p className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">Allergènes</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.allergens.map((a) => (
                          <span key={a} className="rounded-full border border-yellow-600 px-3 py-1 text-sm text-yellow-500">
                            ⚠ {ALLERGEN_LABELS[a] ?? a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: options + add */}
                <div className="w-80 flex flex-col gap-6">
                  {selectedProduct.options.map((opt) => (
                    <div key={opt.id}>
                      <p className="mb-3 font-bold text-white">{opt.label}</p>
                      <div className="flex flex-col gap-2">
                        {opt.choices.map((choice) => (
                          <button
                            key={choice.id}
                            onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.id]: choice.id }))}
                            className="flex items-center justify-between rounded-xl border px-4 py-3 transition-all"
                            style={selectedOptions[opt.id] === choice.id
                              ? { borderColor: '#1EFF6A', background: '#1EFF6A18' }
                              : { borderColor: '#374151' }}
                          >
                            <span className="text-white">{choice.label}</span>
                            {choice.extra > 0 && (
                              <span className="text-sm font-semibold" style={{ color: '#1EFF6A' }}>+{choice.extra.toFixed(2)} €</span>
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
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white text-xl"
                        >
                          <Minus size={18} />
                        </button>
                        <span className="text-3xl font-black text-white">{qty}</span>
                        <button
                          onClick={() => setQty((q) => q + 1)}
                          className="flex h-12 w-12 items-center justify-center rounded-full text-black text-xl"
                          style={{ background: '#1EFF6A' }}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <span className="text-3xl font-black text-white">
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
                      className="w-full rounded-2xl py-5 text-xl font-black text-black shadow-lg transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #1EFF6A, #00cc52)' }}
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
          <motion.div key="cart" {...slideUp} className="flex h-full flex-col p-10">
            <div className="mb-8 flex items-center justify-between">
              <button onClick={() => setScreen('menu')} className="flex items-center gap-2 text-gray-400 hover:text-white">
                <ChevronLeft size={20} /> Continuer à commander
              </button>
              <h2 className="text-3xl font-black text-white">Votre commande</h2>
              <div className="w-40" />
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6">
                <span className="text-8xl">🛒</span>
                <p className="text-2xl text-gray-500">Votre panier est vide</p>
                <button
                  onClick={() => setScreen('menu')}
                  className="rounded-2xl px-8 py-4 text-lg font-bold text-black"
                  style={{ background: '#1EFF6A' }}
                >
                  Parcourir le menu
                </button>
              </div>
            ) : (
              <div className="flex flex-1 gap-10 overflow-hidden">
                {/* Items */}
                <div className="flex-1 overflow-y-auto">
                  <div className="flex flex-col gap-4">
                    {cart.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-5"
                      >
                        <span className="text-4xl">{item.product.image}</span>
                        <div className="flex-1">
                          <p className="font-bold text-white">{item.product.name}</p>
                          {Object.entries(item.selectedOptions).map(([optId, choiceId]) => {
                            const opt = item.product.options.find((o) => o.id === optId);
                            const choice = opt?.choices.find((c) => c.id === choiceId);
                            return choice && <p key={optId} className="text-sm text-gray-500">{opt?.label}: {choice.label}</p>;
                          })}
                          <p className="mt-1 text-sm text-gray-500">× {item.qty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black" style={{ color: '#1EFF6A' }}>{item.subtotal.toFixed(2)} €</p>
                          <button onClick={() => removeFromCart(i)} className="mt-1 text-gray-600 hover:text-red-400">
                            <X size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="w-80 flex flex-col gap-6">
                  <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
                    <p className="text-lg font-bold text-gray-400 mb-4">Récapitulatif</p>
                    <div className="flex justify-between text-gray-400">
                      <span>Sous-total</span>
                      <span>{cartTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-gray-400 mt-2">
                      <span>TVA (10%)</span>
                      <span>{(cartTotal * 0.1).toFixed(2)} €</span>
                    </div>
                    <div className="mt-4 border-t border-gray-700 pt-4 flex justify-between text-xl font-black text-white">
                      <span>Total</span>
                      <span>{cartTotal.toFixed(2)} €</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setScreen('payment')}
                    className="w-full rounded-2xl py-5 text-xl font-black text-black shadow-lg active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #1EFF6A, #00cc52)' }}
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
          <motion.div key="payment" {...slideUp} className="flex h-full flex-col items-center justify-center gap-10 p-12">
            <div className="text-center">
              <h2 className="text-5xl font-black text-white">Mode de paiement</h2>
              <p className="mt-3 text-xl text-gray-400">Total : <span className="font-black text-white">{cartTotal.toFixed(2)} €</span></p>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-lg">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <motion.button
                    key={method.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPaymentMethod(method.id)}
                    className="flex items-center gap-5 rounded-2xl border-2 p-6 transition-all"
                    style={paymentMethod === method.id
                      ? { borderColor: '#1EFF6A', background: '#1EFF6A18' }
                      : { borderColor: '#374151', background: '#111827' }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-800">
                      <Icon size={28} className={paymentMethod === method.id ? 'text-green-400' : 'text-gray-400'} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-xl font-bold text-white">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.sublabel}</p>
                    </div>
                    {paymentMethod === method.id && (
                      <Check size={24} style={{ color: '#1EFF6A' }} />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setScreen('cart')} className="flex items-center gap-2 rounded-2xl border border-gray-700 px-8 py-4 text-gray-400 hover:text-white">
                <ChevronLeft size={20} /> Retour
              </button>
              <button
                onClick={placeOrder}
                disabled={!paymentMethod}
                className="rounded-2xl px-12 py-4 text-xl font-black text-black shadow-lg transition-all disabled:opacity-40"
                style={{ background: paymentMethod ? 'linear-gradient(135deg, #1EFF6A, #00cc52)' : '#4b5563' }}
              >
                Confirmer la commande →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Confirmation ─────────────────────────────────────────────────── */}
        {screen === 'confirm' && (
          <motion.div key="confirm" {...fade} className="flex h-full flex-col items-center justify-center gap-10 p-12">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex h-32 w-32 items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg, #1EFF6A, #00cc52)' }}
            >
              <Check size={60} className="text-black" strokeWidth={3} />
            </motion.div>

            <div className="text-center">
              <h2 className="text-5xl font-black text-white">Commande confirmée !</h2>
              <p className="mt-3 text-2xl text-gray-400">
                {orderMode === 'sur_place' ? 'Votre commande arrive bientôt' : 'Récupérez votre commande au comptoir'}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-700 bg-gray-900 p-10 text-center">
              <p className="text-lg text-gray-500 uppercase tracking-widest mb-3">Numéro de commande</p>
              <p className="text-8xl font-black" style={{ color: '#1EFF6A' }}>#{orderNumber}</p>
            </div>

            <div className="flex items-center gap-3 text-gray-500">
              <Clock size={20} />
              <p className="text-xl">Temps d'attente estimé : <span className="font-bold text-white">15–20 min</span></p>
            </div>

            <div className="text-center">
              <p className="text-gray-500 mb-4">Nouvelle commande dans {countdown}s</p>
              <button
                onClick={resetKiosk}
                className="rounded-2xl px-10 py-4 text-lg font-bold text-black"
                style={{ background: '#1EFF6A' }}
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
