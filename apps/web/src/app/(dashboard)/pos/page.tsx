'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone,
  Users, RotateCcw, Percent, Receipt, ChevronLeft, Check,
  Shield, FileText, BookOpen, X, Download, Lock, Hash,
  AlertTriangle, Clock, Pencil, Loader2, User, UserPlus, Star, History, Camera,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useRestaurantId } from '@/contexts/restaurant-context';

// ── Types ──────────────────────────────────────────────────────────────────────

interface POSItem {
  id: string;
  name: string;
  category: string;
  price: number;
  tvaRate: number;
  emoji: string;
}

interface CartLine {
  item: POSItem;
  quantity: number;
  discount: number;
  discountReason: string;
  notes: string;
  offert: boolean;
}

interface JournalEvent {
  id: string;
  timestamp: string;
  type: 'open' | 'sale' | 'cancel' | 'discount' | 'offert' | 'close' | 'z_report';
  description: string;
  amount?: number;
  ticketNo?: string;
  operator: string;
  hash: string;
}

interface TicketData {
  no: string;
  date: string;
  time: string;
  lines: CartLine[];
  subtotalHT: number;
  tva: number;
  total: number;
  payMethod: string;
  tableNumber: number | null;
  operator: string;
  hash: string;
  split?: number;
  customer?: string | null;
}

interface Customer {
  id: string;
  name: string;
  loyaltyPoints: number;
  favorites: string[]; // item ids
}

interface HistoryTicket {
  no: string;
  time: string; // ISO
  amount: number;
  method: string;
  operator: string;
  bucket: 'today' | 'week' | 'month';
}

type PayStep = 'cart' | 'payment' | 'success';
type ComplianceTab = 'journal' | 'z_report' | 'attestation' | 'history';

// ── Constants ─────────────────────────────────────────────────────────────────

const SIRET = '123 456 789 00012';
const TVA_NO = 'FR 12 123456789';
const RESTAURANT = 'Le Comptoir Moderne';
const ADDRESS = '42 rue de la Paix, 75001 Paris';

const STAFF_PRESETS = [
  { name: 'Alice', pin: '1234' },
  { name: 'Bob', pin: '5678' },
  { name: 'Claire', pin: '9012' },
];

const CATEGORIES = ['Tout', 'Burgers', 'Pizzas', 'Salades', 'Boissons', 'Desserts'];

const MENU_ITEMS: POSItem[] = [
  { id: '1', name: 'Classic Smash Burger', category: 'Burgers', price: 14.90, tvaRate: 10, emoji: '🍔' },
  { id: '2', name: 'Truffle Burger',        category: 'Burgers', price: 22.50, tvaRate: 10, emoji: '🍔' },
  { id: '3', name: 'Chicken Burger',        category: 'Burgers', price: 12.90, tvaRate: 10, emoji: '🍔' },
  { id: '4', name: 'Margherita',            category: 'Pizzas',  price: 13.90, tvaRate: 10, emoji: '🍕' },
  { id: '5', name: 'Diavola',               category: 'Pizzas',  price: 16.50, tvaRate: 10, emoji: '🍕' },
  { id: '6', name: 'Quattro Formaggi',      category: 'Pizzas',  price: 18.00, tvaRate: 10, emoji: '🍕' },
  { id: '7', name: 'Salade César',          category: 'Salades', price: 12.50, tvaRate: 10, emoji: '🥗' },
  { id: '8', name: 'Salade Niçoise',        category: 'Salades', price: 13.90, tvaRate: 10, emoji: '🥗' },
  { id: '9', name: 'Eau Minérale',          category: 'Boissons',price: 2.50,  tvaRate: 5.5,emoji: '💧' },
  { id: '10',name: 'Limonade',              category: 'Boissons',price: 4.90,  tvaRate: 10, emoji: '🍋' },
  { id: '11',name: 'Café Espresso',         category: 'Boissons',price: 2.20,  tvaRate: 10, emoji: '☕' },
  { id: '12',name: 'Tiramisu',              category: 'Desserts', price: 7.50, tvaRate: 10, emoji: '🍮' },
  { id: '13',name: 'Fondant Chocolat',      category: 'Desserts', price: 8.00, tvaRate: 10, emoji: '🍫' },
  { id: '14',name: 'Frites Maison',         category: 'Tout',     price: 4.50, tvaRate: 10, emoji: '🍟' },
];

const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Marie D.',  loyaltyPoints: 1240, favorites: ['1', '11'] },
  { id: 'c2', name: 'Jean M.',   loyaltyPoints: 820,  favorites: ['4', '9', '12'] },
  { id: 'c3', name: 'Sophie L.', loyaltyPoints: 540,  favorites: ['7', '10'] },
  { id: 'c4', name: 'Paul B.',   loyaltyPoints: 2310, favorites: ['2', '13', '5'] },
];

const HISTORY: HistoryTicket[] = [
  { no: 'T-2026-008820', time: new Date(Date.now() - 1000 * 60 * 25).toISOString(),       amount: 42.30, method: 'Carte bancaire', operator: 'Alice',  bucket: 'today' },
  { no: 'T-2026-008819', time: new Date(Date.now() - 1000 * 60 * 95).toISOString(),       amount: 18.50, method: 'Espèces',         operator: 'Alice',  bucket: 'today' },
  { no: 'T-2026-008818', time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),    amount: 67.80, method: 'Carte bancaire', operator: 'Bob',    bucket: 'today' },
  { no: 'T-2026-008815', time: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),   amount: 23.40, method: 'Paiement mobile',operator: 'Bob',    bucket: 'week' },
  { no: 'T-2026-008812', time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),   amount: 91.20, method: 'Carte bancaire', operator: 'Claire', bucket: 'week' },
  { no: 'T-2026-008805', time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),amount: 34.10, method: 'Ticket restaurant', operator: 'Alice', bucket: 'week' },
  { no: 'T-2026-008780', time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),amount: 58.00, method: 'Espèces',       operator: 'Bob',    bucket: 'month' },
  { no: 'T-2026-008760', time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),amount: 102.50,method: 'Carte bancaire',operator: 'Claire', bucket: 'month' },
];

const DISCOUNT_REASONS = [
  'Geste commercial', 'Erreur de commande', 'Offert par le gérant',
  'Fidélité client', 'Article défectueux', 'Promotion du jour',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function now() {
  const d = new Date();
  return {
    date: d.toLocaleDateString('fr-FR'),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    iso: d.toISOString(),
  };
}

function fakeHash(data: string): string {
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = ((h << 5) - h) + data.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0').toUpperCase() + 'A3F7B2';
}

function formatTicketNo(n: number): string {
  return `T-${new Date().getFullYear()}-${String(n).padStart(6, '0')}`;
}

// ── Main Component ────────────────────────────────────────────────────────────

const TR_ISSUERS = ['Edenred', 'Swile', 'Sodexo', 'Up (Chèque Déjeuner)', 'Bimpli', 'Natixis Intertitres'];

function TRPaymentPanel() {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [issuer, setIssuer] = useState('Edenred');
  const [ticketNo, setTicketNo] = useState('');
  const [amount, setAmount] = useState('');
  const [expiry, setExpiry] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('scan')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'scan' ? 'bg-brand-500 text-black' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          🔍 Scanner
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-brand-500 text-black' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          ✏️ Saisie manuelle
        </button>
      </div>

      {mode === 'scan' ? (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">🎫</div>
          <p className="text-sm text-gray-600">Scannez le QR code ou code-barres du ticket restaurant</p>
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="mt-3 flex items-center justify-center gap-2 text-gray-400">
            <span className="h-2 w-2 rounded-full bg-gray-400 inline-block" />
            <span className="text-xs">En attente du scanner...</span>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Émetteur</label>
            <select
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none"
            >
              {TR_ISSUERS.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">N° du ticket</label>
            <input
              value={ticketNo}
              onChange={(e) => setTicketNo(e.target.value)}
              placeholder="Ex. 1234567890"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Montant (€)</label>
              <input
                type="number" min="0" step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date de validité</label>
              <input
                type="month"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          {ticketNo && amount && expiry && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
              <span className="text-green-600 text-lg">✓</span>
              <div className="text-sm">
                <p className="font-medium text-green-800">{issuer} — {parseFloat(amount || '0').toFixed(2)}€</p>
                <p className="text-green-600 text-xs">N° {ticketNo} · Valide {expiry}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TR_SCAN_ISSUERS = [
  'Ticket Restaurant Sodexo',
  'Swile',
  'Edenred',
];

function randomTRAmount() {
  // random between 8.00 and 11.50 in 0.50 steps
  const steps = [8.00, 8.50, 9.00, 9.50, 10.00, 10.50, 11.00, 11.50];
  return steps[Math.floor(Math.random() * steps.length)];
}

interface TicketScanModalProps {
  onClose: () => void;
  onValidate: (amount: number, issuer: string) => void;
}

function TicketScanModal({ onClose, onValidate }: TicketScanModalProps) {
  const [scanState, setScanState] = useState<'scanning' | 'success' | 'manual'>('scanning');
  const [detectedIssuer, setDetectedIssuer] = useState('');
  const [detectedAmount, setDetectedAmount] = useState(0);
  const [manualAmount, setManualAmount] = useState('');

  useEffect(() => {
    if (scanState !== 'scanning') return;
    const timer = setTimeout(() => {
      const issuer = TR_SCAN_ISSUERS[Math.floor(Math.random() * TR_SCAN_ISSUERS.length)];
      const amount = randomTRAmount();
      setDetectedIssuer(issuer);
      setDetectedAmount(amount);
      setScanState('success');
    }, 2500);
    return () => clearTimeout(timer);
  }, [scanState]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Camera className="h-4 w-4 text-brand-600" />
            Scanner le ticket restaurant
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {scanState === 'scanning' && (
            <>
              {/* Camera viewfinder */}
              <div className="relative h-44 w-full rounded-xl bg-gray-900 overflow-hidden flex items-center justify-center">
                {/* corner brackets */}
                <div className="absolute top-3 left-3 h-6 w-6 border-t-2 border-l-2 border-brand-400 rounded-tl" />
                <div className="absolute top-3 right-3 h-6 w-6 border-t-2 border-r-2 border-brand-400 rounded-tr" />
                <div className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-brand-400 rounded-bl" />
                <div className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-brand-400 rounded-br" />
                {/* animated scan line */}
                <motion.div
                  className="absolute left-4 right-4 h-0.5 bg-brand-400 shadow-[0_0_8px_2px_rgba(var(--color-brand-400),0.6)]"
                  animate={{ top: ['20%', '80%', '20%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <Camera className="h-10 w-10 text-gray-600" />
              </div>
              <p className="text-center text-sm text-gray-500">Autorisez l&apos;accès à la caméra</p>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 inline-block" />
                Détection en cours...
              </motion.div>
            </>
          )}

          {scanState === 'success' && (
            <div className="space-y-3">
              <div className="flex flex-col items-center py-3 gap-1">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-2">
                  <Check className="h-6 w-6 text-green-600" strokeWidth={3} />
                </motion.div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Ticket détecté</p>
              </div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Émetteur</span>
                  <span className="font-semibold text-gray-900">{detectedIssuer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant détecté</span>
                  <span className="font-black text-green-700 text-lg">{detectedAmount.toFixed(2)}€</span>
                </div>
              </div>
              <button
                onClick={() => onValidate(detectedAmount, detectedIssuer)}
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-black hover:bg-brand-400 transition-colors"
              >
                Valider — {detectedAmount.toFixed(2)}€
              </button>
            </div>
          )}

          {scanState === 'manual' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Saisissez le montant du ticket restaurant :</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none"
                  autoFocus
                />
                <span className="text-gray-500 font-medium">€</span>
              </div>
              <button
                onClick={() => {
                  const amt = parseFloat(manualAmount);
                  if (amt > 0) onValidate(amt, 'Ticket Restaurant (manuel)');
                }}
                disabled={!manualAmount || parseFloat(manualAmount) <= 0}
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-black hover:bg-brand-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Valider
              </button>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex gap-2 pt-1">
            {scanState !== 'manual' && (
              <button
                onClick={() => setScanState('manual')}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Saisie manuelle
              </button>
            )}
            {scanState === 'manual' && (
              <button
                onClick={() => setScanState('scanning')}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Scanner
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function POSPage() {
  // Auth
  const [authenticated, setAuthenticated] = useState(false);
  const [operator, setOperator] = useState<string>('');
  const authUser = useAuthStore((s) => s.user);
  const ctxRestaurantId = useRestaurantId();
  const [menuItems, setMenuItems] = useState<POSItem[]>(MENU_ITEMS);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);

  useEffect(() => {
    const restaurantId = ctxRestaurantId || authUser?.restaurantIds?.[0];
    if (!restaurantId) return;
    type RawCat = { id: string; name: string; items: { id: string; name: string; price: number }[] };
    (api.get(`/menu?restaurantId=${restaurantId}`) as Promise<{ categories: RawCat[] } | RawCat[]>)
      .then((resp) => {
        const cats: RawCat[] = Array.isArray(resp) ? resp : (resp as { categories: RawCat[] }).categories ?? [];
        const items: POSItem[] = cats.flatMap((cat) =>
          cat.items.map((it) => ({
            id: it.id,
            name: it.name,
            category: cat.name,
            price: it.price,
            tvaRate: 10,
            emoji: '🍽',
          }))
        );
        if (items.length > 0) {
          setMenuItems(items);
          setCategories(['Tout', ...Array.from(new Set(cats.map((c) => c.name)))]);
        }
      })
      .catch(() => {});
  }, [ctxRestaurantId, authUser?.restaurantIds]);
  const [pinInput, setPinInput] = useState('');

  const [activeCategory, setActiveCategory] = useState('Tout');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payStep, setPayStep] = useState<PayStep>('cart');
  const [payMethod, setPayMethod] = useState<'card' | 'cash' | 'mobile' | 'tr'>('card');
  const [cashGiven, setCashGiven] = useState('');
  const [ticketCounter, setTicketCounter] = useState(8821);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [lastTicket, setLastTicket] = useState<TicketData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Card transaction in-progress
  const [cardProcessing, setCardProcessing] = useState(false);

  // Split ticket
  const [showSplit, setShowSplit] = useState(false);
  const [splitN, setSplitN] = useState(2);
  const [splitActive, setSplitActive] = useState<number | null>(null);

  // Note inline editor
  const [noteTarget, setNoteTarget] = useState<string | null>(null);

  // Customer
  const [customerMode, setCustomerMode] = useState<'anon' | 'loyal'>('anon');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // Compliance state
  const [showCompliance, setShowCompliance] = useState(false);
  const [complianceTab, setComplianceTab] = useState<ComplianceTab>('journal');
  const [journal, setJournal] = useState<JournalEvent[]>([
    { id: 'e0', timestamp: '2026-05-14T07:00:00Z', type: 'open', description: 'Ouverture de caisse — session démarrée', operator: 'Alice', hash: 'A1B2C3D4F5E6' },
  ]);

  // Ticket scan modal
  const [showTicketScan, setShowTicketScan] = useState(false);
  const [appliedTicket, setAppliedTicket] = useState<{ amount: number; issuer: string } | null>(null);

  // Discount modal
  const [discountTarget, setDiscountTarget] = useState<string | null>(null);
  const [discountPct, setDiscountPct] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  const filteredItems = menuItems.filter((item) => {
    const matchCat = activeCategory === 'Tout' || item.category === activeCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = useCallback((item: POSItem) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) return prev.map((l) => l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l);
      return [...prev, { item, quantity: 1, discount: 0, discountReason: '', notes: '', offert: false }];
    });
  }, []);

  const updateQty = (itemId: string, qty: number) => {
    if (qty <= 0) setCart((prev) => prev.filter((l) => l.item.id !== itemId));
    else setCart((prev) => prev.map((l) => l.item.id === itemId ? { ...l, quantity: qty } : l));
  };

  const updateNote = (itemId: string, note: string) => {
    setCart((prev) => prev.map((l) => l.item.id === itemId ? { ...l, notes: note } : l));
  };

  const applyDiscount = () => {
    if (!discountTarget || !discountReason) return;
    const pct = parseFloat(discountPct) || 0;
    setCart((prev) => prev.map((l) =>
      l.item.id === discountTarget ? { ...l, discount: pct, discountReason } : l
    ));
    addJournalEvent('discount', `Remise ${pct}% sur ${menuItems.find(i => i.id === discountTarget)?.name} — ${discountReason}`, pct);
    setDiscountTarget(null);
    setDiscountPct('');
    setDiscountReason('');
  };

  const markOffert = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    setCart((prev) => prev.map((l) => l.item.id === itemId ? { ...l, offert: true, discount: 100, discountReason: 'Offert' } : l));
    addJournalEvent('offert', `Article offert : ${item?.name}`, item?.price);
  };

  const addJournalEvent = (type: JournalEvent['type'], desc: string, amount?: number, ticketNo?: string) => {
    const { iso } = now();
    const id = `e${Date.now()}`;
    const hash = fakeHash(id + desc + iso);
    setJournal((prev) => [{
      id, timestamp: iso, type, description: desc,
      amount, ticketNo, operator: operator || 'N/A', hash,
    }, ...prev]);
  };

  const subtotal = cart.reduce((acc, l) => {
    const base = l.item.price * l.quantity;
    return acc + base * (1 - l.discount / 100);
  }, 0);
  const tvaAmount = cart.reduce((acc, l) => {
    const base = l.item.price * l.quantity * (1 - l.discount / 100);
    return acc + base * (l.item.tvaRate / (100 + l.item.tvaRate));
  }, 0);
  const total = subtotal;
  const cashChange = cashGiven ? parseFloat(cashGiven) - total : 0;

  const completePayment = () => {
    const { date, time } = now();
    const no = formatTicketNo(ticketCounter + 1);
    const hash = fakeHash(no + total.toString() + date + time);
    const ticket: TicketData = {
      no, date, time,
      lines: [...cart],
      subtotalHT: subtotal - tvaAmount,
      tva: tvaAmount,
      total,
      payMethod: { card: 'Carte bancaire', cash: 'Espèces', mobile: 'Paiement mobile', tr: 'Ticket restaurant' }[payMethod],
      tableNumber,
      operator,
      hash,
      split: splitActive ?? undefined,
      customer: selectedCustomer?.name ?? null,
    };
    setLastTicket(ticket);
    setTicketCounter((c) => c + 1);
    addJournalEvent('sale', `Vente ${no} — ${total.toFixed(2)}€ (${ticket.payMethod})`, total, no);
    setPayStep('success');
    setTimeout(() => {
      setCart([]);
      setPayStep('cart');
      setCashGiven('');
      setTableNumber(null);
      setSplitActive(null);
      setSelectedCustomer(null);
      setCustomerMode('anon');
      toast.success(`${no} validé · ${total.toFixed(2)}€`);
    }, 4000);
  };

  const handleValidatePayment = () => {
    if (payMethod === 'card') {
      setCardProcessing(true);
    } else {
      completePayment();
    }
  };

  const handleCancel = () => {
    const no = formatTicketNo(ticketCounter);
    addJournalEvent('cancel', `Annulation commande (${cart.length} article${cart.length !== 1 ? 's' : ''}) — ${no}`, total, no);
    setCart([]);
    toast(`Commande annulée — journalisée`, { icon: '⚠️' });
  };

  const generateZReport = () => {
    const { date, time } = now();
    const salesInJournal = journal.filter(e => e.type === 'sale');
    const totalCA = salesInJournal.reduce((s, e) => s + (e.amount ?? 0), 0);
    const hash = fakeHash(`Z${date}${time}${totalCA}`);
    addJournalEvent('z_report', `Z de caisse généré — CA: ${totalCA.toFixed(2)}€ · ${salesInJournal.length} transaction(s) · Signé: ${hash}`);
    toast.success('Z de caisse généré et journalisé');
  };

  // Z report stats
  const salesEvents = journal.filter(e => e.type === 'sale');
  const totalCA = salesEvents.reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalDiscounts = journal.filter(e => e.type === 'discount').length;
  const totalOfferts = journal.filter(e => e.type === 'offert').length;

  const EVENT_COLORS: Record<JournalEvent['type'], string> = {
    open: 'text-blue-600', sale: 'text-brand-600', cancel: 'text-red-600',
    discount: 'text-yellow-600', offert: 'text-purple-600', close: 'text-gray-500',
    z_report: 'text-cyan-600',
  };
  const EVENT_ICONS: Record<JournalEvent['type'], string> = {
    open: '🔓', sale: '💳', cancel: '❌', discount: '%', offert: '🎁', close: '🔒', z_report: '📋',
  };

  // ── Auth modal ──
  if (!authenticated) {
    const handleAuth = (name?: string, pin?: string) => {
      const code = pin ?? pinInput;
      const preset = name
        ? STAFF_PRESETS.find(s => s.name === name && s.pin === code)
        : STAFF_PRESETS.find(s => s.pin === code);
      if (preset) {
        setOperator(preset.name);
        setAuthenticated(true);
        addJournalEvent('open', `Identification caisse — ${preset.name}`, undefined);
        toast.success(`Bienvenue ${preset.name}`);
      } else {
        toast.error('Code opérateur invalide');
      }
      setPinInput('');
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
        >
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-sm">
              <Lock className="h-6 w-6 text-black" />
            </div>
            <p className="text-xs font-bold tracking-widest text-gray-500">FOODSTACK POS</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Identification Caisse</h1>
            <p className="mt-1 text-sm text-gray-500">{RESTAURANT}</p>
          </div>

          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Code opérateur
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="mb-4 h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-center text-2xl font-bold tracking-[0.5em] text-gray-900 placeholder:text-gray-300 focus:border-brand-500 focus:bg-white focus:outline-none"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAuth(); }}
          />

          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Personnel autorisé
          </p>
          <div className="mb-5 space-y-1.5">
            {STAFF_PRESETS.map((s) => (
              <button
                key={s.name}
                onClick={() => { setPinInput(s.pin); handleAuth(s.name, s.pin); }}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors hover:border-brand-500/50 hover:bg-white"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/10 text-brand-700">
                    <User className="h-3.5 w-3.5" />
                  </span>
                  {s.name}
                </span>
                <span className="font-mono text-xs text-gray-400">PIN {s.pin}</span>
              </button>
            ))}
          </div>

          <Button fullWidth size="lg" onClick={() => handleAuth()} disabled={pinInput.length < 4}>
            Valider
          </Button>

          <div className="mt-4 text-center">
            <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-900">
              ← Retour au tableau de bord
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const filteredCustomers = CUSTOMERS.filter(c =>
    !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">

      {/* ── Left: Menu ─────────────────────────────────────────────────────── */}
      <div className="flex w-0 flex-col border-r border-gray-200 bg-white sm:w-[420px] lg:w-[520px]">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Point de Vente</h1>
            <p className="text-xs text-gray-500">{RESTAURANT} · <span className="text-gray-900 font-medium">{operator}</span></p>
          </div>
          <div className="flex items-center gap-2">
            {tableNumber && <Badge variant="brand">Table {tableNumber}</Badge>}
            <button
              onClick={() => setTableNumber(tableNumber ? null : Math.floor(Math.random() * 20) + 1)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Users className="h-3.5 w-3.5" />
              {tableNumber ? `Table ${tableNumber}` : 'Table'}
            </button>
            <button
              onClick={() => setShowCompliance(true)}
              className="flex items-center gap-1.5 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-500/20"
            >
              <Shield className="h-3.5 w-3.5" />
              NF525
            </button>
          </div>
        </div>

        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-500 text-black'
                  : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 thin-scrollbar">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filteredItems.map((item) => (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => addToCart(item)}
                className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-3 text-left transition-colors hover:border-brand-500/50 hover:shadow-sm"
              >
                <span className="mb-1.5 text-2xl">{item.emoji}</span>
                <span className="text-sm font-medium leading-tight text-gray-900 line-clamp-2">{item.name}</span>
                <div className="mt-1 flex w-full items-center justify-between">
                  <span className="text-sm font-bold text-brand-700">{item.price.toFixed(2)}€</span>
                  <span className="text-xs text-gray-400">TVA {item.tvaRate}%</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Cart / Payment ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-white">
        <AnimatePresence mode="wait">

          {payStep === 'cart' && (
            <motion.div key="cart" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div>
                  <h2 className="font-bold text-gray-900">Commande #{formatTicketNo(ticketCounter + 1)}</h2>
                  <p className="text-xs text-gray-500">{cart.length} article{cart.length !== 1 ? 's' : ''} · {operator}</p>
                </div>
                {cart.length > 0 && (
                  <button onClick={handleCancel} className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100">
                    <RotateCcw className="h-3.5 w-3.5" /> Annuler
                  </button>
                )}
              </div>

              {/* Customer section */}
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Client</p>
                  {selectedCustomer && (
                    <span className="text-xs font-medium text-brand-700">
                      <Star className="inline h-3 w-3 mr-0.5" /> {selectedCustomer.loyaltyPoints} pts
                    </span>
                  )}
                </div>
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setCustomerMode('loyal'); }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      customerMode === 'loyal'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Client fidèle
                  </button>
                  <button
                    onClick={() => { setCustomerMode('anon'); setSelectedCustomer(null); setShowFavorites(false); }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      customerMode === 'anon'
                        ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <User className="h-3.5 w-3.5" /> Client anonyme
                  </button>
                </div>

                {customerMode === 'loyal' && !selectedCustomer && (
                  <div>
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <input
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Rechercher un client..."
                        className="h-8 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                          className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-brand-500/50 hover:bg-brand-500/5"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCustomer && (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-semibold text-brand-700">
                        <User className="h-3 w-3" /> {selectedCustomer.name}
                        <button
                          onClick={() => { setSelectedCustomer(null); setShowFavorites(false); }}
                          className="ml-1 text-brand-700/60 hover:text-brand-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                      <button
                        onClick={() => setShowFavorites(s => !s)}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Star className="h-3 w-3" /> Commandes favorites
                      </button>
                    </div>
                    {showFavorites && (
                      <div className="mt-2 space-y-1">
                        {selectedCustomer.favorites.map(fid => {
                          const it = menuItems.find(m => m.id === fid);
                          if (!it) return null;
                          return (
                            <button
                              key={fid}
                              onClick={() => addToCart(it)}
                              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs hover:border-brand-500/50 hover:bg-brand-500/5"
                            >
                              <span className="flex items-center gap-1.5 text-gray-700">
                                <span>{it.emoji}</span> {it.name}
                              </span>
                              <span className="font-semibold text-brand-700">{it.price.toFixed(2)}€</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 thin-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-3 text-5xl">🛒</div>
                    <p className="text-gray-400">Aucun article sélectionné</p>
                    <p className="mt-1 text-sm text-gray-300">Cliquez sur un article pour l&apos;ajouter</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {cart.map((line) => (
                        <motion.div key={line.item.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                          className={`rounded-xl border bg-white p-3 ${line.offert ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{line.item.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">{line.item.name}</p>
                              <p className="text-xs text-gray-500">{line.item.price.toFixed(2)}€ · TVA {line.item.tvaRate}%</p>
                              {line.discount > 0 && !line.offert && (
                                <p className="text-xs text-yellow-600">−{line.discount}% · {line.discountReason}</p>
                              )}
                              {line.offert && <p className="text-xs text-purple-600">🎁 Offert</p>}
                              {line.notes && (
                                <p className="text-xs italic text-gray-500">📝 {line.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(line.item.id, line.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-gray-900">{line.quantity}</span>
                              <button onClick={() => updateQty(line.item.id, line.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="w-16 text-right">
                              <p className="text-sm font-bold text-brand-700">
                                {(line.item.price * line.quantity * (1 - line.discount / 100)).toFixed(2)}€
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button onClick={() => { setDiscountTarget(line.item.id); setDiscountPct(''); setDiscountReason(''); }} className="text-yellow-500 hover:text-yellow-600" title="Remise">
                                <Percent className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => markOffert(line.item.id)} className="text-purple-500 hover:text-purple-600" title="Offert">
                                <span className="text-xs">🎁</span>
                              </button>
                              <button
                                onClick={() => setNoteTarget(noteTarget === line.item.id ? null : line.item.id)}
                                className="text-gray-400 hover:text-gray-700"
                                title="Note"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => updateQty(line.item.id, 0)} className="text-gray-400 hover:text-red-600">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          {noteTarget === line.item.id && (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                autoFocus
                                value={line.notes}
                                onChange={(e) => updateNote(line.item.id, e.target.value)}
                                placeholder="Note (ex : sans oignon)"
                                className="h-8 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none"
                                onKeyDown={(e) => { if (e.key === 'Enter') setNoteTarget(null); }}
                              />
                              <button onClick={() => setNoteTarget(null)} className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-brand-400">
                                OK
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <div className="mb-4 space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>HT</span><span>{(subtotal - tvaAmount).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>TVA</span><span>{tvaAmount.toFixed(2)}€</span>
                  </div>
                  {cart.some(l => l.discount > 0) && (
                    <div className="flex justify-between text-sm text-yellow-600">
                      <span>Remises</span>
                      <span>−{cart.reduce((s, l) => s + l.item.price * l.quantity * (l.discount / 100), 0).toFixed(2)}€</span>
                    </div>
                  )}
                  {splitActive && (
                    <div className="flex justify-between text-sm text-brand-700">
                      <span>Ticket partagé en {splitActive}</span>
                      <span>{(total / splitActive).toFixed(2)}€ / pers.</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-2">
                    <span>Total TTC</span>
                    <span className="text-brand-700">{total.toFixed(2)}€</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { icon: Receipt,  label: 'Ticket',   action: () => lastTicket && setPayStep('success') },
                    { icon: Users,    label: 'Partager', action: () => { setShowSplit(true); setSplitN(splitActive ?? 2); } },
                    { icon: BookOpen, label: 'Journal',  action: () => { setShowCompliance(true); setComplianceTab('journal'); } },
                  ].map(({ icon: Icon, label, action }) => (
                    <button key={label} onClick={action} className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      <Icon className="h-4 w-4" />{label}
                    </button>
                  ))}
                </div>

                <Button fullWidth size="lg" disabled={cart.length === 0} onClick={() => setPayStep('payment')} icon={<CreditCard className="h-5 w-5" />}>
                  Encaisser · {total.toFixed(2)}€
                </Button>
              </div>
            </motion.div>
          )}

          {payStep === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex h-full flex-col">
              <div className="flex items-center gap-3 border-b border-gray-200 p-4">
                <button onClick={() => setPayStep('cart')} className="rounded-lg p-1.5 hover:bg-gray-100">
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>
                <h2 className="font-bold text-gray-900">Encaissement</h2>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
                  <Lock className="h-3 w-3" /> Transaction sécurisée NF525
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 thin-scrollbar">
                <div className="mb-6 text-center">
                  <p className="text-sm text-gray-500">Montant à encaisser</p>
                  <p className="mt-1 text-5xl font-black text-brand-600">{total.toFixed(2)}€</p>
                  <p className="mt-1 text-xs text-gray-400">dont TVA : {tvaAmount.toFixed(2)}€</p>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { id: 'card' as const,   icon: CreditCard, label: 'Carte' },
                    { id: 'cash' as const,   icon: Banknote,   label: 'Espèces' },
                    { id: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
                    { id: 'tr' as const,     icon: Hash,       label: 'Ticket R.' },
                  ].map((method) => (
                    <button key={method.id} onClick={() => setPayMethod(method.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border py-3 transition-colors ${
                        payMethod === method.id
                          ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}>
                      <method.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>

                {payMethod === 'cash' && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-3 rounded-xl bg-white border border-gray-200 px-4 py-3 text-center">
                      <p className="text-xs text-gray-500 mb-1">Montant remis</p>
                      <p className="text-3xl font-black text-gray-900 tracking-wide">
                        {cashGiven ? `${parseFloat(cashGiven).toFixed(2)} €` : '0.00 €'}
                      </p>
                      {cashGiven && parseFloat(cashGiven) > 0 && (
                        <p className={`mt-1 text-sm font-bold ${cashChange >= 0 ? 'text-brand-700' : 'text-red-600'}`}>
                          {cashChange >= 0 ? `Rendu : ${cashChange.toFixed(2)} €` : 'Montant insuffisant'}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {[Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, 50, 100]
                        .filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)
                        .map((amount) => (
                          <button key={amount} onClick={() => setCashGiven(amount.toString())}
                            className="rounded-lg border border-brand-500/40 bg-brand-500/10 py-1.5 text-sm font-bold text-brand-700 hover:bg-brand-500/20 transition-colors">
                            {amount}€
                          </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {['7','8','9','4','5','6','1','2','3','00','0','⌫'].map((key) => (
                        <button
                          key={key}
                          onClick={() => {
                            if (key === '⌫') {
                              setCashGiven(p => p.slice(0, -1));
                            } else {
                              setCashGiven(p => {
                                const next = (p === '0' ? '' : p) + key;
                                const num = parseFloat(next);
                                return isNaN(num) ? p : next;
                              });
                            }
                          }}
                          className={clsx(
                            'rounded-xl py-3.5 text-lg font-bold transition-all active:scale-95',
                            key === '⌫'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                          )}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {payMethod === 'tr' && appliedTicket && (
                  <div className="mb-3 rounded-xl border border-green-200 bg-green-50 p-3 flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-semibold text-green-800">{appliedTicket.issuer}</p>
                      <p className="text-xs text-green-600">Ticket appliqué</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-green-700">−{appliedTicket.amount.toFixed(2)}€</span>
                      <button onClick={() => setAppliedTicket(null)} className="text-green-600 hover:text-green-800">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {(payMethod === 'card' || payMethod === 'tr' || payMethod === 'mobile') && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                    {payMethod === 'tr' ? (
                      <>
                        <button
                          onClick={() => setShowTicketScan(true)}
                          className="mb-4 w-full flex items-center justify-center gap-2 rounded-xl border border-brand-500/50 bg-brand-500/10 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-500/20 transition-colors"
                        >
                          <Camera className="h-4 w-4" />
                          Scan ticket restaurant
                        </button>
                        <TRPaymentPanel />
                      </>
                    ) : (
                      <>
                        <div className="mb-2 text-center text-4xl">
                          {payMethod === 'card' ? '💳' : '📱'}
                        </div>
                        <p className="text-center text-sm text-gray-600">
                          {payMethod === 'card' ? 'Présentez la carte ou le terminal' : 'Apple Pay / Google Pay / Lydia'}
                        </p>
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="mt-4 flex items-center justify-center gap-2 text-gray-500">
                          <span className="h-2 w-2 rounded-full bg-gray-400 inline-block" />
                          <span className="text-xs">En attente...</span>
                        </motion.div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <Button fullWidth size="lg" onClick={handleValidatePayment}
                  disabled={payMethod === 'cash' && (!cashGiven || cashChange < 0)}
                  icon={<Check className="h-5 w-5" />}>
                  Valider le paiement
                </Button>
              </div>
            </motion.div>
          )}

          {payStep === 'success' && lastTicket && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex h-full flex-col overflow-y-auto p-6 thin-scrollbar">
              <div className="flex flex-col items-center mb-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500">
                  <Check className="h-8 w-8 text-black" strokeWidth={3} />
                </motion.div>
                <h2 className="text-xl font-bold text-gray-900">Paiement accepté</h2>
                <p className="text-brand-600 font-black text-3xl mt-1">{lastTicket.total.toFixed(2)}€</p>
                {lastTicket.split && (
                  <p className="mt-1 text-sm text-gray-500">Partagé en {lastTicket.split} · {(lastTicket.total / lastTicket.split).toFixed(2)}€ / pers.</p>
                )}
              </div>

              {/* Ticket preview — NF525 compliant */}
              <div className="mx-auto w-full max-w-xs rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-700">
                <div className="text-center mb-3">
                  <p className="font-bold text-gray-900 text-sm">{RESTAURANT}</p>
                  <p>{ADDRESS}</p>
                  <p className="mt-1">SIRET : {SIRET}</p>
                  <p>N° TVA : {TVA_NO}</p>
                </div>
                <div className="border-t border-gray-300 my-2" />
                <div className="flex justify-between">
                  <span>Ticket n°</span><span className="font-bold text-brand-700">{lastTicket.no}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date</span><span>{lastTicket.date} {lastTicket.time}</span>
                </div>
                {lastTicket.tableNumber && <div className="flex justify-between"><span>Table</span><span>{lastTicket.tableNumber}</span></div>}
                <div className="flex justify-between"><span>Caissier</span><span>{lastTicket.operator}</span></div>
                {lastTicket.customer && <div className="flex justify-between"><span>Client</span><span>{lastTicket.customer}</span></div>}
                <div className="border-t border-gray-300 my-2" />
                {lastTicket.lines.map((l, i) => (
                  <div key={i}>
                    <div className="flex justify-between gap-1">
                      <span className="truncate flex-1">{l.quantity}× {l.item.name}{l.offert ? ' (offert)' : l.discount > 0 ? ` −${l.discount}%` : ''}</span>
                      <span>{(l.item.price * l.quantity * (1 - l.discount / 100)).toFixed(2)}€</span>
                    </div>
                    {l.notes && <div className="pl-3 text-gray-500 italic">↳ {l.notes}</div>}
                  </div>
                ))}
                <div className="border-t border-gray-300 my-2" />
                <div className="flex justify-between"><span>HT</span><span>{lastTicket.subtotalHT.toFixed(2)}€</span></div>
                <div className="flex justify-between"><span>TVA</span><span>{lastTicket.tva.toFixed(2)}€</span></div>
                <div className="flex justify-between font-bold text-gray-900"><span>TOTAL TTC</span><span>{lastTicket.total.toFixed(2)}€</span></div>
                <div className="flex justify-between mt-1"><span>Règlement</span><span>{lastTicket.payMethod}</span></div>
                {lastTicket.split && (
                  <div className="flex justify-between"><span>Partagé en {lastTicket.split}</span><span>{(lastTicket.total / lastTicket.split).toFixed(2)}€</span></div>
                )}
                <div className="border-t border-gray-300 my-2" />
                <div className="text-center text-gray-500">
                  <p>Signature : {lastTicket.hash}</p>
                  <p className="mt-1">Merci de votre visite !</p>
                  <p>Conservation 6 ans — Art. L.102 B LPF</p>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="flex items-center gap-2 rounded-xl border border-brand-500/40 bg-brand-500/10 px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-500/20 transition-colors"
                >
                  <Receipt className="h-4 w-4" />
                  Imprimer le ticket
                </button>
              </div>
              <p className="mt-3 text-center text-sm text-gray-400">Réinitialisation en cours...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Card Transaction in-progress Modal ─────────────────────────────── */}
      <AnimatePresence>
        {cardProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            /* No backdrop dismiss — onClick intentionally omitted */
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                  className="mb-5"
                >
                  <Loader2 className="h-12 w-12 text-brand-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900">Transaction en cours...</h3>
                <p className="mt-2 text-sm text-gray-500">Présentez la carte ou attendez la confirmation du TPE</p>
                <p className="mt-4 text-3xl font-black text-brand-600">{total.toFixed(2)}€</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCardProcessing(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => { setCardProcessing(false); completePayment(); }}
                  className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-brand-400"
                >
                  Paiement confirmé
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Split Ticket Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSplit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowSplit(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-600" /> Partager le ticket
                </h3>
                <button onClick={() => setShowSplit(false)} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
              </div>

              <p className="mb-3 text-xs text-gray-500">Divisez l&apos;addition entre plusieurs convives.</p>

              <label className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Diviser en N</span>
                <span className="text-lg font-bold text-brand-700">{splitN}</span>
              </label>
              <input
                type="range"
                min={2}
                max={8}
                value={splitN}
                onChange={(e) => setSplitN(parseInt(e.target.value, 10))}
                className="mb-3 w-full accent-brand-500"
              />
              <div className="mb-4 grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
                {[2,3,4,5,6,7,8].map(n => (
                  <span key={n} className={n === splitN ? 'font-bold text-brand-700' : ''}>{n}</span>
                ))}
              </div>

              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-xs text-gray-500">Montant par personne</p>
                <p className="mt-1 text-3xl font-black text-brand-700">
                  {(total / splitN).toFixed(2)}€
                </p>
                <p className="mt-1 text-xs text-gray-400">Total : {total.toFixed(2)}€ ÷ {splitN}</p>
              </div>

              <Button fullWidth onClick={() => {
                setSplitActive(splitN);
                setShowSplit(false);
                addJournalEvent('discount', `Ticket partagé en ${splitN}`, total);
                toast.success(`Ticket partagé en ${splitN} · ${(total / splitN).toFixed(2)}€ / pers.`);
              }}>
                Valider
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Discount Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {discountTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" /> Remise tracée
                </h3>
                <button onClick={() => setDiscountTarget(null)} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
              </div>
              <p className="mb-4 text-xs text-gray-500">Toute remise est journalisée et non modifiable (NF525).</p>
              <input type="number" value={discountPct} onChange={e => setDiscountPct(e.target.value)} placeholder="% de remise" min={0} max={100}
                className="mb-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none" />
              <p className="mb-2 text-xs text-gray-500 uppercase tracking-wide">Motif obligatoire</p>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {DISCOUNT_REASONS.map(r => (
                  <button key={r} onClick={() => setDiscountReason(r)}
                    className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${discountReason === r ? 'border-brand-500 bg-brand-500/10 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <Button fullWidth onClick={applyDiscount} disabled={!discountReason || !discountPct}>
                Appliquer la remise
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Thermal Receipt Modal ─────────────────────────────────────────── */}
      <style>{`
        @media print {
          body > *:not(#receipt-modal) { display: none; }
          #receipt-modal { display: flex !important; position: fixed; inset: 0; align-items: center; justify-content: center; background: white; }
        }
      `}</style>
      <AnimatePresence>
        {showReceiptModal && lastTicket && (
          <motion.div
            id="receipt-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              style={{ width: '340px' }}
            >
              <div className="overflow-y-auto flex-1 bg-white px-5 py-5 font-mono text-xs text-gray-900" style={{ maxWidth: '320px', margin: '0 auto', width: '100%' }}>
                <div className="text-center">
                  <p className="text-sm font-bold tracking-widest">════════════════</p>
                  <p className="mt-1 text-base font-bold">FoodStack POS</p>
                  <p className="font-medium">Le Bistrot Parisien</p>
                  <p className="text-gray-500 mt-0.5">{lastTicket.date} à {lastTicket.time}</p>
                  <p className="text-sm font-bold tracking-widest">════════════════</p>
                  <p className="mt-1 font-bold text-sm tracking-widest">TICKET DE CAISSE</p>
                </div>
                <p className="my-1 text-center tracking-widest">────────────────</p>

                <div className="space-y-0.5">
                  {lastTicket.lines.map((l, i) => {
                    const lineTotal = (l.item.price * l.quantity * (1 - l.discount / 100)).toFixed(2) + ' €';
                    const label = `${l.quantity}x ${l.item.name}${l.offert ? ' (offert)' : l.discount > 0 ? ` -${l.discount}%` : ''}`;
                    const dots = '.'.repeat(Math.max(2, 32 - label.length - lineTotal.length));
                    return (
                      <div key={i}>
                        <p className="whitespace-pre text-xs leading-relaxed">
                          {label}{dots}{lineTotal}
                        </p>
                        {l.notes && <p className="pl-2 text-[10px] italic text-gray-600">  ↳ {l.notes}</p>}
                      </div>
                    );
                  })}
                </div>

                <p className="my-1 text-center tracking-widest">────────────────</p>

                <div className="space-y-0.5">
                  {(() => {
                    const shtLabel = 'Sous-total HT';
                    const shtVal = lastTicket.subtotalHT.toFixed(2) + ' €';
                    const shtDots = '.'.repeat(Math.max(2, 32 - shtLabel.length - shtVal.length));
                    const tvaLabel = 'TVA';
                    const tvaVal = lastTicket.tva.toFixed(2) + ' €';
                    const tvaDots = '.'.repeat(Math.max(2, 32 - tvaLabel.length - tvaVal.length));
                    return (
                      <>
                        <p className="whitespace-pre text-xs">{shtLabel}{shtDots}{shtVal}</p>
                        <p className="whitespace-pre text-xs">{tvaLabel}{tvaDots}{tvaVal}</p>
                      </>
                    );
                  })()}
                </div>

                <div className="my-1 border-t-2 border-b-2 border-gray-900 py-1">
                  {(() => {
                    const totLabel = 'TOTAL TTC';
                    const totVal = lastTicket.total.toFixed(2) + ' €';
                    const totDots = '.'.repeat(Math.max(2, 32 - totLabel.length - totVal.length));
                    return (
                      <p className="whitespace-pre text-sm font-bold">{totLabel}{totDots}{totVal}</p>
                    );
                  })()}
                </div>

                <p className="mt-1 text-xs text-gray-600">Paiement : {lastTicket.payMethod}</p>
                {lastTicket.tableNumber && <p className="text-xs text-gray-600">Table : {lastTicket.tableNumber}</p>}
                {lastTicket.split && <p className="text-xs text-gray-600">Partagé en {lastTicket.split} : {(lastTicket.total / lastTicket.split).toFixed(2)} €</p>}
                {lastTicket.customer && <p className="text-xs text-gray-600">Client : {lastTicket.customer}</p>}

                <p className="my-1 text-center tracking-widest text-gray-400">────────────────</p>
                <div className="text-center text-gray-500">
                  <p className="font-medium">Merci de votre visite !</p>
                  <p className="mt-1">[QR: Commandez en ligne]</p>
                  <p className="mt-0.5 text-xs text-gray-400">foodstack.app</p>
                </div>
                <p className="mt-1 text-center text-sm font-bold tracking-widest">════════════════</p>
                <p className="mt-1 text-center text-xs text-gray-400">Ticket n° {lastTicket.no}</p>
                <p className="text-center text-xs text-gray-400">Signature : {lastTicket.hash}</p>
              </div>

              <div className="flex gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
                <button
                  onClick={() => window.print()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  Imprimer
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="flex flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Ticket Scan Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTicketScan && (
          <TicketScanModal
            onClose={() => setShowTicketScan(false)}
            onValidate={(amount, issuer) => {
              setAppliedTicket({ amount, issuer });
              setShowTicketScan(false);
              toast.success(`${issuer} — ${amount.toFixed(2)}€ appliqué`);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Compliance Drawer ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCompliance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/30" onClick={() => setShowCompliance(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex w-full max-w-lg flex-col border-l border-gray-200 bg-white overflow-hidden">

              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand-600" />
                  <h2 className="font-bold text-gray-900">Conformité NF525</h2>
                  <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-700">Certifié</span>
                </div>
                <button onClick={() => setShowCompliance(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex border-b border-gray-200">
                {([
                  { id: 'journal',     label: 'Journal', icon: BookOpen },
                  { id: 'history',     label: 'Historique', icon: History },
                  { id: 'z_report',    label: 'Z Caisse', icon: FileText },
                  { id: 'attestation', label: 'Attestation', icon: Shield },
                ] as { id: ComplianceTab; label: string; icon: React.ElementType }[]).map(tab => (
                  <button key={tab.id} onClick={() => setComplianceTab(tab.id)}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                      complianceTab === tab.id ? 'border-b-2 border-brand-500 text-brand-700' : 'text-gray-500 hover:text-gray-900'
                    }`}>
                    <tab.icon className="h-4 w-4" /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 thin-scrollbar bg-gray-50">

                {/* Journal Tab */}
                {complianceTab === 'journal' && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Journal horodaté · inaltérable</p>
                      <span className="text-xs text-gray-500">{journal.length} événements</span>
                    </div>
                    <div className="space-y-2">
                      {journal.map((ev) => (
                        <div key={ev.id} className="rounded-xl border border-gray-200 bg-white p-3">
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 text-base ${EVENT_COLORS[ev.type]}`}>{EVENT_ICONS[ev.type]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{ev.description}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ev.timestamp).toLocaleString('fr-FR')}</span>
                                <span>{ev.operator}</span>
                                {ev.ticketNo && <span className="text-brand-700">{ev.ticketNo}</span>}
                              </div>
                              <p className="mt-1 text-xs text-gray-400 font-mono">#{ev.hash}</p>
                            </div>
                            {ev.amount !== undefined && (
                              <span className={`text-sm font-bold ${ev.type === 'cancel' ? 'text-red-600' : 'text-brand-700'}`}>
                                {ev.type === 'cancel' ? '−' : ''}{ev.amount.toFixed(2)}€
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {complianceTab === 'history' && (
                  <div className="space-y-5">
                    {([
                      { id: 'today' as const, label: "Aujourd'hui" },
                      { id: 'week'  as const, label: 'Semaine' },
                      { id: 'month' as const, label: 'Mois' },
                    ]).map(group => {
                      const rows = HISTORY.filter(h => h.bucket === group.id);
                      const sum = rows.reduce((s, r) => s + r.amount, 0);
                      return (
                        <div key={group.id}>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{group.label}</p>
                            <span className="text-xs font-bold text-brand-700">{sum.toFixed(2)}€ · {rows.length} tickets</span>
                          </div>
                          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                  <th className="px-3 py-2 text-left font-medium">Ticket</th>
                                  <th className="px-3 py-2 text-left font-medium">Heure</th>
                                  <th className="px-3 py-2 text-left font-medium">Méthode</th>
                                  <th className="px-3 py-2 text-left font-medium">Opérateur</th>
                                  <th className="px-3 py-2 text-right font-medium">Montant</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {rows.map(r => (
                                  <tr key={r.no} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-mono text-brand-700">{r.no}</td>
                                    <td className="px-3 py-2 text-gray-600">{new Date(r.time).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                                    <td className="px-3 py-2 text-gray-700">{r.method}</td>
                                    <td className="px-3 py-2 text-gray-700">{r.operator}</td>
                                    <td className="px-3 py-2 text-right font-bold text-gray-900">{r.amount.toFixed(2)}€</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Z Report Tab */}
                {complianceTab === 'z_report' && (
                  <div>
                    <div className="mb-4 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
                      <p className="text-xs text-brand-700 uppercase tracking-wide mb-3 font-semibold">Rapport journalier — {new Date().toLocaleDateString('fr-FR')}</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Chiffre d\'affaires', value: `${totalCA.toFixed(2)}€`, color: 'text-brand-700' },
                          { label: 'Transactions', value: salesEvents.length.toString(), color: 'text-gray-900' },
                          { label: 'Remises accordées', value: totalDiscounts.toString(), color: 'text-yellow-600' },
                          { label: 'Articles offerts', value: totalOfferts.toString(), color: 'text-purple-600' },
                          { label: 'Annulations', value: journal.filter(e => e.type === 'cancel').length.toString(), color: 'text-red-600' },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between text-sm">
                            <span className="text-gray-600">{row.label}</span>
                            <span className={`font-bold ${row.color}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
                      <p className="text-xs text-gray-500 uppercase mb-2 font-semibold">Répartition TVA</p>
                      {[{ rate: '5,5%', label: 'Boissons non alcoolisées' }, { rate: '10%', label: 'Restauration' }].map(t => (
                        <div key={t.rate} className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>TVA {t.rate} · {t.label}</span>
                          <span>{(totalCA * 0.1).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>

                    <Button fullWidth onClick={generateZReport} icon={<FileText className="h-4 w-4" />}>
                      Générer Z de Caisse (signé)
                    </Button>
                    <p className="mt-2 text-center text-xs text-gray-400">Le Z est horodaté, signé et journalisé automatiquement</p>
                  </div>
                )}

                {/* Attestation Tab */}
                {complianceTab === 'attestation' && (
                  <div>
                    <div className="mb-4 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20">
                          <Shield className="h-5 w-5 text-brand-700" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Attestation de conformité</p>
                          <p className="text-xs text-brand-700">NF525 · Loi anti-fraude TVA 2018</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        {[
                          { label: 'Logiciel', value: 'FoodStack POS v1.0' },
                          { label: 'Éditeur', value: 'FoodStack SAS' },
                          { label: 'SIRET éditeur', value: '987 654 321 00001' },
                          { label: 'Établissement', value: RESTAURANT },
                          { label: 'SIRET', value: SIRET },
                          { label: 'N° attestation', value: 'ATT-2026-FS-00142' },
                          { label: 'Valide jusqu\'au', value: '31/12/2027' },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between">
                            <span className="text-gray-500">{row.label}</span>
                            <span className="text-gray-900 font-medium">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4 space-y-2">
                      {[
                        { label: 'Inaltérabilité', desc: 'Chaque transaction horodatée et signée cryptographiquement' },
                        { label: 'Sécurisation', desc: 'Journaux signés SHA-256, stockage chiffré AES-256' },
                        { label: 'Conservation', desc: 'Données conservées 6 ans minimum (Art. L.102 B LPF)' },
                        { label: 'Archivage', desc: 'Export CSV/XML disponible pour contrôle fiscal' },
                      ].map(item => (
                        <div key={item.label} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3">
                          <Check className="h-4 w-4 text-brand-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-500">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button fullWidth onClick={() => toast.success('Attestation téléchargée (PDF)')} icon={<Download className="h-4 w-4" />}>
                      Télécharger l&apos;attestation PDF
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
