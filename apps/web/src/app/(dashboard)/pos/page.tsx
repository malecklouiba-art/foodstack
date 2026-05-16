'use client';

import { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone,
  Users, Percent, Receipt, ChevronLeft, Check,
  Shield, FileText, BookOpen, X, Lock, Hash,
  AlertTriangle, Clock, Pencil, Loader2, User, UserPlus, Star, History, Camera,
  Home, ShoppingBag, BarChart2, Settings, Wifi, RefreshCw,
  ChevronRight, ShoppingCart, LayoutGrid, LogOut, RotateCcw, Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// ── Types ──────────────────────────────────────────────────────────────────────

interface POSItem {
  id: string;
  name: string;
  category: string;
  price: number;
  tvaRate: number;
  emoji: string;
  image: string;
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
  items: CartLine[];
  total: number;
  tva: number;
  paymentMode: string;
  cashGiven?: number;
  change?: number;
  tableNumber?: number | null;
  operator: string;
  hash: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  loyalty: number;
  totalSpent: number;
  visits: number;
}

type POSView = 'home' | 'customers' | 'tables' | 'cashier' | 'orders' | 'reports' | 'settings';
type OrderTab = 'history' | 'hold' | 'offline';

// ── Constants ──────────────────────────────────────────────────────────────────

const TVA_RATES = [5.5, 10, 20];
const CATEGORIES = ['Tout', 'Burgers', 'Pizzas', 'Salades', 'Boissons', 'Desserts'];
const PIN_OPERATORS: Record<string, { name: string; role: string }> = {
  '1234': { name: 'Alice Martin', role: 'Caissière' },
  '5678': { name: 'Bob Durand', role: 'Manager' },
  '9012': { name: 'Chef Léa', role: 'Cuisine' },
};

const MENU_ITEMS: POSItem[] = [
  { id: '1',  name: 'Classic Smash Burger',  category: 'Burgers',  price: 14.90, tvaRate: 10,  emoji: '🍔', image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_640.jpg' },
  { id: '2',  name: 'Truffle Burger',        category: 'Burgers',  price: 22.50, tvaRate: 10,  emoji: '🍔', image: 'https://cdn.pixabay.com/photo/2020/08/09/14/17/mushroom-burger-5476453_640.jpg' },
  { id: '3',  name: 'Chicken Burger',        category: 'Burgers',  price: 12.90, tvaRate: 10,  emoji: '🍔', image: 'https://cdn.pixabay.com/photo/2014/10/23/18/05/burger-500054_640.jpg' },
  { id: '4',  name: 'Margherita',            category: 'Pizzas',   price: 13.90, tvaRate: 10,  emoji: '🍕', image: 'https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_640.jpg' },
  { id: '5',  name: 'Diavola',               category: 'Pizzas',   price: 16.50, tvaRate: 10,  emoji: '🍕', image: 'https://cdn.pixabay.com/photo/2019/09/26/08/14/pizza-4505870_640.jpg' },
  { id: '6',  name: 'Quattro Formaggi',      category: 'Pizzas',   price: 18.00, tvaRate: 10,  emoji: '🍕', image: 'https://cdn.pixabay.com/photo/2022/02/10/21/23/pizza-7005859_640.jpg' },
  { id: '7',  name: 'Salade César',          category: 'Salades',  price: 12.50, tvaRate: 10,  emoji: '🥗', image: 'https://cdn.pixabay.com/photo/2017/10/09/19/29/salad-2836445_640.jpg' },
  { id: '8',  name: 'Salade Niçoise',        category: 'Salades',  price: 13.90, tvaRate: 10,  emoji: '🥗', image: 'https://cdn.pixabay.com/photo/2017/05/11/19/44/fresh-2305367_640.jpg' },
  { id: '9',  name: 'Eau Minérale',          category: 'Boissons', price: 2.50,  tvaRate: 5.5, emoji: '💧', image: 'https://cdn.pixabay.com/photo/2016/12/22/09/21/mineral-water-1925835_640.jpg' },
  { id: '10', name: 'Limonade',              category: 'Boissons', price: 4.90,  tvaRate: 10,  emoji: '🍋', image: 'https://cdn.pixabay.com/photo/2018/07/07/19/55/lemon-3523243_640.jpg' },
  { id: '11', name: 'Café Espresso',         category: 'Boissons', price: 2.20,  tvaRate: 10,  emoji: '☕', image: 'https://cdn.pixabay.com/photo/2017/11/29/15/41/coffee-2987455_640.jpg' },
  { id: '12', name: 'Tiramisu',              category: 'Desserts', price: 7.50,  tvaRate: 10,  emoji: '🍮', image: 'https://cdn.pixabay.com/photo/2017/01/11/11/33/cake-1971552_640.jpg' },
  { id: '13', name: 'Fondant Chocolat',      category: 'Desserts', price: 8.00,  tvaRate: 10,  emoji: '🍫', image: 'https://cdn.pixabay.com/photo/2020/01/17/16/54/chocolate-4773322_640.jpg' },
  { id: '14', name: 'Frites Maison',         category: 'Tout',     price: 4.50,  tvaRate: 10,  emoji: '🍟', image: 'https://cdn.pixabay.com/photo/2016/11/20/11/06/fries-1842589_640.jpg' },
];

const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Marie Dupont',   phone: '06 12 34 56 78', loyalty: 450, totalSpent: 342.50, visits: 18 },
  { id: 'c2', name: 'Jean-Pierre L.', phone: '07 89 01 23 45', loyalty: 120, totalSpent: 89.00,  visits: 6  },
  { id: 'c3', name: 'Sophie Martin',  phone: '06 55 66 77 88', loyalty: 890, totalSpent: 712.00, visits: 34 },
  { id: 'c4', name: 'Luc Moreau',     phone: '07 11 22 33 44', loyalty: 60,  totalSpent: 45.00,  visits: 3  },
];

const TABLES = Array.from({ length: 12 }, (_, i) => ({
  no: i + 1,
  status: ['free', 'occupied', 'free', 'reserved', 'free', 'occupied',
           'free', 'free', 'occupied', 'free', 'reserved', 'free'][i] as 'free' | 'occupied' | 'reserved',
  covers: [0, 4, 0, 2, 0, 6, 0, 0, 3, 0, 4, 0][i],
}));

function makeFakeHash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, '0').toUpperCase();
}

const HISTORY: TicketData[] = [
  {
    no: 'T-2024-001', date: '2024-01-15 12:34', operator: 'Alice Martin', hash: makeFakeHash('T-2024-001'),
    items: [{ item: MENU_ITEMS[0], quantity: 2, discount: 0, discountReason: '', notes: '', offert: false }],
    total: 29.80, tva: 2.71, paymentMode: 'cash', cashGiven: 30, change: 0.20,
  },
  {
    no: 'T-2024-002', date: '2024-01-15 13:02', operator: 'Alice Martin', hash: makeFakeHash('T-2024-002'),
    items: [{ item: MENU_ITEMS[3], quantity: 1, discount: 0, discountReason: '', notes: '', offert: false }],
    total: 13.90, tva: 1.26, paymentMode: 'card',
  },
  {
    no: 'T-2024-003', date: '2024-01-15 13:45', operator: 'Bob Durand', hash: makeFakeHash('T-2024-003'),
    items: [
      { item: MENU_ITEMS[6], quantity: 1, discount: 0, discountReason: '', notes: '', offert: false },
      { item: MENU_ITEMS[10], quantity: 2, discount: 0, discountReason: '', notes: '', offert: false },
    ],
    total: 16.90, tva: 1.54, paymentMode: 'card',
  },
];

const HELD_ORDERS = [
  { no: 'HOLD-01', items: 3, total: 45.20, time: '14:12', table: 5 },
  { no: 'HOLD-02', items: 1, total: 14.90, time: '14:28', table: null },
];

// ── NF525 Journal helpers ──────────────────────────────────────────────────────

function makeJournalEvent(
  type: JournalEvent['type'],
  description: string,
  operator: string,
  amount?: number,
  ticketNo?: string,
): JournalEvent {
  const id = `EVT-${Date.now()}`;
  const timestamp = new Date().toISOString();
  const hash = makeFakeHash(`${id}${timestamp}${operator}${amount ?? 0}`);
  return { id, timestamp, type, description, amount, ticketNo, operator, hash };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TRPaymentPanel({
  cart, total, cashGiven, setCashGiven, onConfirm, operator,
}: {
  cart: CartLine[];
  total: number;
  cashGiven: string;
  setCashGiven: (v: string) => void;
  onConfirm: (mode: string) => void;
  operator: string;
}) {
  const [tab, setTab] = useState<'cash' | 'other'>('cash');
  const given = parseFloat(cashGiven) || 0;
  const change = Math.max(0, given - total);

  const pad = (digit: string) => {
    if (digit === 'C') { setCashGiven(''); return; }
    if (digit === '⌫') { setCashGiven(cashGiven.slice(0, -1)); return; }
    if (digit === '.' && cashGiven.includes('.')) return;
    setCashGiven(cashGiven + digit);
  };

  const shortcuts = [total, Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10];

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Left: order summary */}
      <div className="flex w-56 flex-col gap-2 overflow-y-auto">
        <p className="text-sm font-semibold text-gray-500">Commande — {operator}</p>
        {cart.map((line, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="truncate text-gray-700">{line.item.name} ×{line.quantity}</span>
            <span className="ml-2 font-medium">{(line.item.price * line.quantity * (1 - line.discount / 100)).toFixed(2)}€</span>
          </div>
        ))}
        <div className="mt-auto border-t pt-2">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span><span>{total.toFixed(2)}€</span>
          </div>
        </div>
      </div>

      {/* Right: payment */}
      <div className="flex flex-1 flex-col">
        {/* Tabs */}
        <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
          {(['cash', 'other'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={clsx('flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t === 'cash' ? 'Espèces' : 'Autres modes'}
            </button>
          ))}
        </div>

        {tab === 'cash' ? (
          <div className="flex flex-1 flex-col gap-3">
            {/* Shortcuts */}
            <div className="grid grid-cols-4 gap-1">
              {shortcuts.map((s, i) => (
                <button key={i} onClick={() => setCashGiven(s.toFixed(2))}
                  className="rounded-lg border border-orange-300 bg-orange-50 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100">
                  {s.toFixed(2)}€
                </button>
              ))}
            </div>
            {/* Display */}
            <div className="flex items-center justify-between rounded-xl border-2 border-orange-400 bg-orange-50 px-4 py-3">
              <span className="text-sm text-gray-500">Donné</span>
              <span className="text-2xl font-bold text-orange-600">{given > 0 ? `${given.toFixed(2)}€` : '0.00€'}</span>
            </div>
            {given > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
                <span className="text-sm text-gray-500">Rendu</span>
                <span className="text-2xl font-bold text-green-600">{change.toFixed(2)}€</span>
              </div>
            )}
            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2">
              {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(d => (
                <button key={d} onClick={() => pad(d)}
                  className={clsx('rounded-xl py-3 text-lg font-bold transition-colors',
                    d === 'C' ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : d === '⌫' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200')}>
                  {d}
                </button>
              ))}
            </div>
            <button onClick={() => onConfirm('cash')}
              disabled={given < total}
              className="rounded-xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-40 transition-colors">
              Confirmer le paiement espèces
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3">
            {[
              { mode: 'card',   icon: CreditCard, label: 'Carte bancaire',  color: 'bg-blue-500' },
              { mode: 'mobile', icon: Smartphone, label: 'Paiement mobile',  color: 'bg-purple-500' },
              { mode: 'check',  icon: FileText,   label: 'Chèque',           color: 'bg-gray-500' },
            ].map(({ mode, icon: Icon, label, color }) => (
              <button key={mode} onClick={() => onConfirm(mode)}
                className={clsx('flex items-center gap-3 rounded-xl py-4 px-5 text-left text-white transition-opacity hover:opacity-90', color)}>
                <Icon className="h-6 w-6 shrink-0" />
                <div>
                  <p className="font-bold">{label}</p>
                  <p className="text-sm opacity-80">Total: {total.toFixed(2)}€</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketScanModal({ onClose, onFound }: { onClose: () => void; onFound: (t: TicketData) => void }) {
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const results = HISTORY.filter(t =>
    t.no.toLowerCase().includes(query.toLowerCase()) ||
    t.operator.toLowerCase().includes(query.toLowerCase()),
  );

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      if (HISTORY[0]) onFound(HISTORY[0]);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Rechercher un ticket</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-4 flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="N° ticket ou opérateur..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <button onClick={handleScan}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Scanner
          </button>
        </div>
        <div className="space-y-2">
          {results.map(t => (
            <button key={t.no} onClick={() => onFound(t)}
              className="w-full rounded-lg border p-3 text-left hover:border-orange-400 hover:bg-orange-50 transition-colors">
              <div className="flex justify-between">
                <span className="font-mono text-sm font-bold">{t.no}</span>
                <span className="text-sm font-bold text-orange-500">{t.total.toFixed(2)}€</span>
              </div>
              <p className="text-xs text-gray-500">{t.date} · {t.operator}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function POSPage() {
  // Auth
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [operator, setOperator] = useState('');

  // Navigation
  const [activeView, setActiveView] = useState<POSView>('home');

  // Home / catalog
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart
  const [cart, setCart] = useState<CartLine[]>([]);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cartExpanded, setCartExpanded] = useState(true);

  // Payment / cashier
  const [cashGiven, setCashGiven] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);
  const [lastTicket, setLastTicket] = useState<TicketData | null>(null);
  const [splitActive, setSplitActive] = useState<number | null>(null);

  // Modals
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountTarget, setDiscountTarget] = useState<number | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [showTicketScan, setShowTicketScan] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showCardProcessing, setShowCardProcessing] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitParts, setSplitParts] = useState(2);

  // Orders view
  const [orderTab, setOrderTab] = useState<OrderTab>('history');
  const [selectedOrderNo, setSelectedOrderNo] = useState<string>(HISTORY[0].no);

  // NF525 Journal
  const [journal, setJournal] = useState<JournalEvent[]>([
    makeJournalEvent('open', 'Ouverture de caisse', 'Système'),
  ]);
  const [zReportDone, setZReportDone] = useState(false);

  // Settings
  const [tvaRate, setTvaRate] = useState<number>(10);
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesInput, setNotesInput] = useState('');

  const addJournalEvent = useCallback((ev: JournalEvent) => {
    setJournal(prev => [...prev, ev]);
  }, []);

  // ── Auth ────────────────────────────────────────────────────────────────────

  const handlePinDigit = useCallback((digit: string) => {
    if (digit === '⌫') { setPinInput(prev => prev.slice(0, -1)); return; }
    if (pinInput.length >= 4) return;
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === 4) {
      const op = PIN_OPERATORS[next];
      if (op) {
        setOperator(op.name);
        setAuthenticated(true);
        setPinInput('');
        setPinError(false);
        addJournalEvent(makeJournalEvent('open', `Connexion opérateur`, op.name));
      } else {
        setPinError(true);
        setTimeout(() => { setPinInput(''); setPinError(false); }, 800);
      }
    }
  }, [pinInput, addJournalEvent]);

  // ── Cart helpers ────────────────────────────────────────────────────────────

  const addToCart = useCallback((item: POSItem) => {
    setCart(prev => {
      const idx = prev.findIndex(l => l.item.id === item.id && !l.offert);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { item, quantity: 1, discount: 0, discountReason: '', notes: '', offert: false }];
    });
  }, []);

  const updateQty = useCallback((idx: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== idx);
      next[idx] = { ...next[idx], quantity: newQty };
      return next;
    });
  }, []);

  const removeLine = useCallback((idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const markOffert = useCallback((idx: number) => {
    setCart(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], offert: !next[idx].offert };
      return next;
    });
    addJournalEvent(makeJournalEvent('offert', `Article offert`, operator));
  }, [operator, addJournalEvent]);

  // ── Totals ──────────────────────────────────────────────────────────────────

  const subtotal = cart.reduce((acc, l) => {
    if (l.offert) return acc;
    return acc + l.item.price * l.quantity * (1 - l.discount / 100);
  }, 0);

  const totalTva = cart.reduce((acc, l) => {
    if (l.offert) return acc;
    const base = l.item.price * l.quantity * (1 - l.discount / 100);
    return acc + base * (l.item.tvaRate / (100 + l.item.tvaRate));
  }, 0);

  const total = splitActive ? subtotal / splitActive : subtotal;

  // ── Payment ─────────────────────────────────────────────────────────────────

  const completePayment = useCallback((mode: string) => {
    const no = `T-${Date.now()}`;
    const given = parseFloat(cashGiven) || 0;
    const ticket: TicketData = {
      no, date: new Date().toLocaleString('fr-FR'),
      items: [...cart], total, tva: totalTva,
      paymentMode: mode,
      cashGiven: mode === 'cash' ? given : undefined,
      change: mode === 'cash' ? Math.max(0, given - total) : undefined,
      tableNumber, operator, hash: makeFakeHash(no + operator),
    };
    setLastTicket(ticket);
    addJournalEvent(makeJournalEvent('sale', `Vente ${mode}`, operator, total, no));
    setPaySuccess(true);
    setTimeout(() => {
      setCart([]);
      setCashGiven('');
      setTableNumber(null);
      setSplitActive(null);
      setSelectedCustomer(null);
      setActiveView('home');
      setPaySuccess(false);
      toast.success(`${no} validé · ${total.toFixed(2)}€`);
    }, 3000);
  }, [cart, cashGiven, total, totalTva, tableNumber, operator, addJournalEvent]);

  const handleConfirmPayment = useCallback((mode: string) => {
    if (mode === 'card') {
      setShowCardProcessing(true);
      setTimeout(() => {
        setShowCardProcessing(false);
        completePayment('card');
      }, 2000);
    } else {
      completePayment(mode);
    }
  }, [completePayment]);

  // ── Discount ────────────────────────────────────────────────────────────────

  const applyDiscount = useCallback(() => {
    const pct = parseFloat(discountInput);
    if (isNaN(pct) || pct < 0 || pct > 100) return;
    if (discountTarget === null) return;
    setCart(prev => {
      const next = [...prev];
      next[discountTarget] = { ...next[discountTarget], discount: pct, discountReason };
      return next;
    });
    addJournalEvent(makeJournalEvent('discount', `Remise ${pct}%: ${discountReason}`, operator, pct, undefined));
    setShowDiscount(false);
    setDiscountInput('');
    setDiscountReason('');
  }, [discountInput, discountReason, discountTarget, operator, addJournalEvent]);

  // ── Z-Report ────────────────────────────────────────────────────────────────

  const runZReport = useCallback(() => {
    addJournalEvent(makeJournalEvent('z_report', 'Rapport Z effectué', operator));
    setZReportDone(true);
    toast.success('Rapport Z généré');
  }, [operator, addJournalEvent]);

  // ── Filtered items ──────────────────────────────────────────────────────────

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchCat = activeCategory === 'Tout' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // ── Render: Auth ────────────────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Restro POS</h1>
            <p className="text-sm text-gray-500">Entrez votre code PIN</p>
          </div>
          <div className="mb-4 flex justify-center gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={clsx(
                'h-4 w-4 rounded-full border-2 transition-all',
                i < pinInput.length
                  ? pinError ? 'border-red-500 bg-red-500' : 'border-orange-500 bg-orange-500'
                  : 'border-gray-300',
              )} />
            ))}
          </div>
          {pinError && <p className="mb-3 text-center text-sm font-medium text-red-500">Code incorrect</p>}
          <div className="grid grid-cols-3 gap-3">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
              d === '' ? <div key={i} /> :
              <button key={i} onClick={() => handlePinDigit(d)}
                className={clsx(
                  'rounded-xl py-4 text-xl font-bold transition-colors',
                  d === '⌫'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-900 hover:bg-orange-50 hover:text-orange-600 border border-gray-200',
                )}>
                {d}
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-2">
            {Object.entries(PIN_OPERATORS).map(([pin, op]) => (
              <button key={pin} onClick={() => {
                setOperator(op.name);
                setAuthenticated(true);
                addJournalEvent(makeJournalEvent('open', `Connexion opérateur`, op.name));
              }}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5 text-left hover:border-orange-400 hover:bg-orange-50 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                  {op.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{op.name}</p>
                  <p className="text-xs text-gray-400">{op.role} · PIN: {pin}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Home view ───────────────────────────────────────────────────────

  function renderHomeView() {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Category tabs */}
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-gray-200 bg-white px-4 py-3">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={clsx(
                'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}>
              {cat}
            </button>
          ))}
        </div>
        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.map(item => (
              <button key={item.id} onClick={() => addToCart(item)}
                className="group flex flex-col items-center rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-orange-300 active:scale-95">
                <div className="mb-3 h-20 w-20 overflow-hidden rounded-full ring-2 ring-gray-100">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                      if (sib) sib.style.display = 'flex';
                    }}
                  />
                  <div className="hidden h-full w-full items-center justify-center bg-gray-100 text-3xl">
                    {item.emoji}
                  </div>
                </div>
                <p className="mb-1 text-center text-xs font-medium leading-tight text-gray-800 line-clamp-2">{item.name}</p>
                <p className="text-sm font-bold text-orange-500">{item.price.toFixed(2)}€</p>
                <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-3.5 w-3.5 text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Customers view ──────────────────────────────────────────────────

  function renderCustomersView() {
    return (
      <div className="flex h-full flex-col overflow-y-auto p-4">
        {/* Profile card if selected */}
        {selectedCustomer && (
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 p-5 text-white shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
                {selectedCustomer.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold">{selectedCustomer.name}</p>
                <p className="text-sm opacity-80">{selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="rounded-lg p-1 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/15 py-2">
                <p className="text-xl font-bold">{selectedCustomer.loyalty}</p>
                <p className="text-xs opacity-80">Points</p>
              </div>
              <div className="rounded-xl bg-white/15 py-2">
                <p className="text-xl font-bold">{selectedCustomer.totalSpent.toFixed(0)}€</p>
                <p className="text-xs opacity-80">Dépensé</p>
              </div>
              <div className="rounded-xl bg-white/15 py-2">
                <p className="text-xl font-bold">{selectedCustomer.visits}</p>
                <p className="text-xs opacity-80">Visites</p>
              </div>
            </div>
          </div>
        )}
        {/* Add new customer */}
        <button className="mb-3 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-orange-300 p-4 text-orange-500 hover:bg-orange-50 transition-colors">
          <UserPlus className="h-5 w-5" />
          <span className="font-medium">Nouveau client</span>
        </button>
        {/* Recent customers */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Clients récents</p>
        <div className="space-y-2">
          {CUSTOMERS.map(c => (
            <button key={c.id} onClick={() => setSelectedCustomer(c)}
              className={clsx(
                'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                selectedCustomer?.id === c.id
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-orange-300',
              )}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-500">{c.phone}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-orange-500">{c.loyalty} pts</p>
                <p className="text-xs text-gray-400">{c.visits} visites</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Render: Tables view ─────────────────────────────────────────────────────

  function renderTablesView() {
    return (
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-green-400" />Libre
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-red-400" />Occupée
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full bg-yellow-400" />Réservée
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {TABLES.map(t => (
            <button key={t.no} onClick={() => {
              if (t.status !== 'occupied') {
                setTableNumber(t.no);
                setActiveView('home');
                toast.success(`Table ${t.no} sélectionnée`);
              }
            }}
              className={clsx(
                'rounded-2xl border-2 p-4 text-center transition-all',
                t.status === 'free' && 'border-green-300 bg-green-50 hover:border-green-400 hover:shadow-md',
                t.status === 'occupied' && 'border-red-200 bg-red-50 cursor-not-allowed opacity-70',
                t.status === 'reserved' && 'border-yellow-300 bg-yellow-50 hover:border-yellow-400',
                tableNumber === t.no && 'ring-2 ring-orange-500',
              )}>
              <p className="text-2xl font-bold text-gray-800">{t.no}</p>
              <p className="text-xs text-gray-500 capitalize">{t.status === 'free' ? 'Libre' : t.status === 'occupied' ? 'Occupée' : 'Réservée'}</p>
              {t.covers > 0 && <p className="text-xs text-gray-400">{t.covers} couverts</p>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Render: Cashier view ────────────────────────────────────────────────────

  function renderCashierView() {
    if (paySuccess && lastTicket) {
      return (
        <div className="flex h-full flex-col items-center justify-center bg-white p-8 text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
            <Check className="h-10 w-10 text-white" strokeWidth={3} />
          </motion.div>
          <h2 className="mb-1 text-2xl font-bold text-gray-900">Paiement validé</h2>
          <p className="mb-2 text-gray-500">{lastTicket.no}</p>
          <p className="mb-6 text-3xl font-bold text-green-600">{lastTicket.total.toFixed(2)}€</p>
          {lastTicket.paymentMode === 'cash' && lastTicket.change !== undefined && (
            <div className="mb-4 rounded-xl bg-green-50 px-6 py-3">
              <p className="text-sm text-gray-500">Rendu monnaie</p>
              <p className="text-xl font-bold text-green-600">{lastTicket.change.toFixed(2)}€</p>
            </div>
          )}
          <p className="text-sm text-gray-400">Retour à l'accueil dans 3s…</p>
        </div>
      );
    }

    if (cart.length === 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center text-gray-400">
          <ShoppingCart className="mb-3 h-12 w-12" />
          <p className="text-sm">Panier vide — ajoutez des articles</p>
          <button onClick={() => setActiveView('home')}
            className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
            Aller au menu
          </button>
        </div>
      );
    }

    return (
      <TRPaymentPanel
        cart={cart}
        total={total}
        cashGiven={cashGiven}
        setCashGiven={setCashGiven}
        onConfirm={handleConfirmPayment}
        operator={operator}
      />
    );
  }

  // ── Render: Orders view ─────────────────────────────────────────────────────

  function renderOrdersView() {
    const selectedOrder = HISTORY.find(h => h.no === selectedOrderNo);

    return (
      <div className="flex h-full overflow-hidden">
        {/* Left: tabs + list */}
        <div className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {([
              { key: 'history', label: 'Historique' },
              { key: 'hold',    label: 'En attente' },
              { key: 'offline', label: 'Hors ligne' },
            ] as { key: OrderTab; label: string }[]).map(t => (
              <button key={t.key} onClick={() => setOrderTab(t.key)}
                className={clsx(
                  'flex-1 py-2.5 text-xs font-medium transition-colors',
                  orderTab === t.key
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-500 hover:text-gray-700',
                )}>
                {t.label}
              </button>
            ))}
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto p-2">
            {orderTab === 'history' && HISTORY.map(h => (
              <button key={h.no} onClick={() => setSelectedOrderNo(h.no)}
                className={clsx(
                  'w-full rounded-xl p-3 text-left mb-1 transition-colors',
                  selectedOrderNo === h.no ? 'bg-orange-50 ring-1 ring-orange-400' : 'hover:bg-gray-50',
                )}>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-gray-800">{h.no}</span>
                  <span className="text-xs font-bold text-orange-500">{h.total.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-gray-400">{h.date}</p>
                <Badge variant="success">Payé</Badge>
              </button>
            ))}
            {orderTab === 'hold' && HELD_ORDERS.map(h => (
              <div key={h.no} className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 mb-1">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-gray-800">{h.no}</span>
                  <span className="text-xs font-bold text-orange-500">{h.total.toFixed(2)}€</span>
                </div>
                <p className="text-xs text-gray-400">{h.time} · {h.items} articles{h.table ? ` · Table ${h.table}` : ''}</p>
                <button className="mt-2 rounded-lg bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:bg-orange-600 transition-colors">
                  Reprendre
                </button>
              </div>
            ))}
            {orderTab === 'offline' && (
              <div className="flex flex-col items-center justify-center p-6 text-gray-400">
                <Wifi className="mb-2 h-8 w-8" />
                <p className="text-xs text-center">Aucune commande hors ligne</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: order detail */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {orderTab === 'history' && selectedOrder ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{selectedOrder.no}</h2>
                <button onClick={() => { setShowReceiptModal(true); }}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
                  <Receipt className="h-4 w-4" />Ticket
                </button>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-sm font-medium">{selectedOrder.date}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Opérateur</p>
                  <p className="text-sm font-medium">{selectedOrder.operator}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">Mode paiement</p>
                  <p className="text-sm font-medium capitalize">{selectedOrder.paymentMode}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-400">TVA</p>
                  <p className="text-sm font-medium">{selectedOrder.tva.toFixed(2)}€</p>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white">
                {selectedOrder.items.map((line, i) => (
                  <div key={i} className={clsx('flex items-center justify-between px-4 py-3', i > 0 && 'border-t border-gray-100')}>
                    <span className="text-sm text-gray-700">{line.item.name} ×{line.quantity}</span>
                    <span className="text-sm font-medium">{(line.item.price * line.quantity).toFixed(2)}€</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t-2 border-gray-200 px-4 py-3">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-orange-500">{selectedOrder.total.toFixed(2)}€</span>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-gray-50 p-3">
                <p className="mb-1 text-xs font-semibold text-gray-400">Hash NF525</p>
                <p className="font-mono text-xs text-gray-600">{selectedOrder.hash}</p>
              </div>
            </>
          ) : orderTab !== 'history' ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <p className="text-sm">Sélectionnez une commande</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // ── Render: Reports view ────────────────────────────────────────────────────

  function renderReportsView() {
    const totalSales = HISTORY.reduce((s, h) => s + h.total, 0);
    const totalTvaAll = HISTORY.reduce((s, h) => s + h.tva, 0);

    return (
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Chiffre d\'affaires', value: `${totalSales.toFixed(2)}€`, icon: Banknote, color: 'text-green-600 bg-green-50' },
            { label: 'Transactions', value: String(HISTORY.length), icon: Receipt, color: 'text-blue-600 bg-blue-50' },
            { label: 'TVA collectée', value: `${totalTvaAll.toFixed(2)}€`, icon: Percent, color: 'text-purple-600 bg-purple-50' },
            { label: 'Panier moyen', value: `${(totalSales / Math.max(HISTORY.length, 1)).toFixed(2)}€`, icon: ShoppingCart, color: 'text-orange-600 bg-orange-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <div className={clsx('mb-2 inline-flex rounded-xl p-2', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* NF525 Compliance */}
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <h3 className="font-bold text-gray-900">Conformité NF525</h3>
            <Badge variant="success">Conforme</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={runZReport}
              disabled={zReportDone}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm hover:border-orange-400 hover:bg-orange-50 disabled:opacity-50 transition-colors">
              <FileText className="h-4 w-4 text-orange-500" />
              {zReportDone ? 'Rapport Z effectué' : 'Rapport Z'}
            </button>
            <button onClick={() => setShowTicketScan(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm hover:border-orange-400 hover:bg-orange-50 transition-colors">
              <Camera className="h-4 w-4 text-orange-500" />
              Scanner ticket
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm hover:border-orange-400 hover:bg-orange-50 transition-colors">
              <Download className="h-4 w-4 text-orange-500" />
              Attestation
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm hover:border-orange-400 hover:bg-orange-50 transition-colors">
              <BookOpen className="h-4 w-4 text-orange-500" />
              Journal d'audit
            </button>
          </div>
        </div>

        {/* Journal events */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2 border-b border-gray-100 p-4">
            <History className="h-4 w-4 text-gray-400" />
            <h3 className="font-bold text-gray-900">Journal des événements</h3>
            <span className="ml-auto text-xs text-gray-400">{journal.length} événements</span>
          </div>
          <div className="divide-y divide-gray-50">
            {[...journal].reverse().slice(0, 10).map(ev => (
              <div key={ev.id} className="flex items-start gap-3 px-4 py-3">
                <div className={clsx('mt-0.5 h-2 w-2 shrink-0 rounded-full',
                  ev.type === 'sale' ? 'bg-green-400'
                  : ev.type === 'z_report' ? 'bg-blue-400'
                  : ev.type === 'discount' || ev.type === 'offert' ? 'bg-yellow-400'
                  : 'bg-gray-300'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{ev.description}</p>
                  <p className="text-xs text-gray-400">{new Date(ev.timestamp).toLocaleString('fr-FR')} · {ev.operator}</p>
                </div>
                {ev.amount !== undefined && (
                  <span className="text-xs font-bold text-gray-700 shrink-0">{ev.amount.toFixed(2)}€</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Settings view ───────────────────────────────────────────────────

  function renderSettingsView() {
    return (
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 font-bold text-gray-900">Taux TVA par défaut</h3>
            <div className="flex gap-2">
              {TVA_RATES.map(r => (
                <button key={r} onClick={() => setTvaRate(r)}
                  className={clsx(
                    'rounded-xl px-4 py-2 text-sm font-bold transition-colors',
                    tvaRate === r ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}>
                  {r}%
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 font-bold text-gray-900">Opérateur actuel</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                {operator[0]}
              </div>
              <div>
                <p className="font-medium text-gray-900">{operator}</p>
                <p className="text-xs text-gray-400">Connecté</p>
              </div>
              <button onClick={() => { setAuthenticated(false); setOperator(''); setCart([]); }}
                className="ml-auto flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="h-4 w-4" />Déconnexion
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-3 font-bold text-gray-900">À propos</h3>
            <div className="space-y-1 text-sm text-gray-500">
              <p>Restro POS v2.0</p>
              <p>Conforme NF525 · Homologué DGFIP</p>
              <p>© 2024 FoodStack</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Cart panel ──────────────────────────────────────────────────────

  function renderCartPanel() {
    return (
      <>
        {/* Customer header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
            {selectedCustomer ? selectedCustomer.name[0] : <User className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {selectedCustomer ? selectedCustomer.name : 'Client de passage'}
            </p>
            {tableNumber && <p className="text-xs text-gray-400">Table {tableNumber}</p>}
          </div>
          <button onClick={() => setCartExpanded(e => !e)} className="rounded-lg p-1 hover:bg-gray-100">
            <ChevronRight className={clsx('h-4 w-4 text-gray-400 transition-transform', cartExpanded && 'rotate-90')} />
          </button>
        </div>

        {/* Cart lines */}
        <div className={clsx('flex-1 overflow-y-auto', !cartExpanded && 'hidden')}>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <ShoppingCart className="h-8 w-8 mb-2" />
              <p className="text-xs">Panier vide</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 p-2">
              {cart.map((line, idx) => (
                <div key={idx} className={clsx('py-2', line.offert && 'opacity-60')}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{line.item.name}</p>
                      {line.discount > 0 && (
                        <p className="text-xs text-orange-500">-{line.discount}% {line.discountReason && `(${line.discountReason})`}</p>
                      )}
                      {line.offert && <Badge variant="warning">Offert</Badge>}
                    </div>
                    <span className="shrink-0 text-sm font-bold text-gray-900">
                      {line.offert ? '0.00€' : (line.item.price * line.quantity * (1 - line.discount / 100)).toFixed(2) + '€'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <button onClick={() => updateQty(idx, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{line.quantity}</span>
                    <button onClick={() => updateQty(idx, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button onClick={() => { setDiscountTarget(idx); setShowDiscount(true); }}
                      className="ml-1 flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 hover:bg-orange-100 text-gray-500 hover:text-orange-500 transition-colors">
                      <Percent className="h-3 w-3" />
                    </button>
                    <button onClick={() => markOffert(idx)}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 hover:bg-yellow-100 text-gray-500 hover:text-yellow-600 transition-colors">
                      <Star className="h-3 w-3" />
                    </button>
                    <button onClick={() => {
                      setEditingNotes(idx);
                      setNotesInput(line.notes);
                    }}
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={() => removeLine(idx)}
                      className="ml-auto flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  {editingNotes === idx && (
                    <div className="mt-1.5 flex gap-1">
                      <input value={notesInput} onChange={e => setNotesInput(e.target.value)}
                        placeholder="Note cuisine..."
                        className="flex-1 rounded-lg border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400" />
                      <button onClick={() => {
                        setCart(prev => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], notes: notesInput };
                          return next;
                        });
                        setEditingNotes(null);
                      }}
                        className="rounded-lg bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600">
                        OK
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="shrink-0 border-t border-gray-200 p-4">
          <div className="mb-2 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Sous-total HT</span>
              <span>{(subtotal - totalTva).toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>TVA</span>
              <span>{totalTva.toFixed(2)}€</span>
            </div>
            {splitActive && (
              <div className="flex justify-between text-sm text-orange-500 font-medium">
                <span>Partage ÷{splitActive}</span>
                <span>{total.toFixed(2)}€</span>
              </div>
            )}
          </div>
          <div className="mb-4 flex justify-between text-lg font-bold text-gray-900">
            <span>Total TTC</span>
            <span className="text-orange-500">{total.toFixed(2)}€</span>
          </div>
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowSplitModal(true)}
              disabled={cart.length === 0}
              className="flex-1 rounded-xl border border-orange-400 py-3 text-sm font-bold text-orange-500 hover:bg-orange-50 disabled:opacity-40 transition-colors">
              Partager
            </button>
            <button onClick={() => {
              if (cart.length === 0) return;
              toast.success('Commande mise en attente');
              setCart([]);
            }}
              disabled={cart.length === 0}
              className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-40 transition-colors">
              En attente
            </button>
          </div>
          <button onClick={() => setActiveView('cashier')} disabled={cart.length === 0}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-40 transition-colors">
            <Check className="h-4 w-4" />Procéder au paiement
          </button>
        </div>
      </>
    );
  }

  // ── Nav config ──────────────────────────────────────────────────────────────

  const navItems: { view: POSView; icon: React.ElementType; label: string }[] = [
    { view: 'home',      icon: Home,        label: 'Accueil' },
    { view: 'customers', icon: Users,        label: 'Clients' },
    { view: 'tables',    icon: LayoutGrid,   label: 'Tables' },
    { view: 'cashier',   icon: CreditCard,   label: 'Caisse' },
    { view: 'orders',    icon: ShoppingBag,  label: 'Commandes' },
    { view: 'reports',   icon: BarChart2,    label: 'Rapports' },
    { view: 'settings',  icon: Settings,     label: 'Paramètres' },
  ];

  // ── Main layout ─────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f5] text-gray-900">
      {/* Left icon nav */}
      <nav className="flex w-16 shrink-0 flex-col items-center border-r border-gray-200 bg-white py-4 gap-1">
        {/* Logo */}
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500">
          <ShoppingBag className="h-5 w-5 text-white" />
        </div>
        <div className="my-2 w-8 border-t border-gray-200" />
        {/* Nav items */}
        {navItems.map(({ view, icon: Icon, label }) => (
          <button key={view} onClick={() => setActiveView(view)} title={label}
            className={clsx(
              'flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 w-full transition-colors',
              activeView === view
                ? 'bg-orange-50 text-orange-500'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
            )}>
            <Icon className="h-5 w-5" />
            <span className="text-[9px] font-medium leading-tight text-center">{label}</span>
          </button>
        ))}
        {/* Bottom: avatar + logout */}
        <div className="mt-auto flex flex-col items-center gap-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600" title={operator}>
            {operator[0]}
          </div>
          <button onClick={() => { setAuthenticated(false); setOperator(''); setCart([]); }}
            title="Déconnexion"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
          <h1 className="text-base font-bold text-gray-900">Restro POS</h1>
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-100 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
          <button onClick={() => window.location.reload()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            <Wifi className="h-4 w-4 text-green-500" />
          </button>
          <button
            onClick={() => setActiveView('tables')}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 transition-colors">
            <LayoutGrid className="h-4 w-4" />
            {tableNumber ? `Table ${tableNumber}` : 'Choisir table'}
          </button>
        </header>

        {/* View content */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'home'      && renderHomeView()}
          {activeView === 'customers' && renderCustomersView()}
          {activeView === 'tables'    && renderTablesView()}
          {activeView === 'cashier'   && renderCashierView()}
          {activeView === 'orders'    && renderOrdersView()}
          {activeView === 'reports'   && renderReportsView()}
          {activeView === 'settings'  && renderSettingsView()}
        </div>
      </div>

      {/* Right cart panel */}
      <aside className="flex w-[340px] shrink-0 flex-col border-l border-gray-200 bg-white">
        {renderCartPanel()}
      </aside>

      {/* ── Modals ── */}

      {/* Card processing */}
      <AnimatePresence>
        {showCardProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-2xl">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-orange-500" />
              <p className="text-lg font-bold text-gray-900">Traitement en cours…</p>
              <p className="text-sm text-gray-500">Paiement par carte</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discount modal */}
      {showDiscount && discountTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Appliquer une remise</h2>
              <button onClick={() => setShowDiscount(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-gray-500">
              Article : {cart[discountTarget]?.item.name}
            </p>
            <input value={discountInput} onChange={e => setDiscountInput(e.target.value)}
              type="number" min={0} max={100} placeholder="% de remise"
              className="mb-3 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <input value={discountReason} onChange={e => setDiscountReason(e.target.value)}
              placeholder="Motif (obligatoire NF525)"
              className="mb-4 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <div className="flex gap-2">
              <button onClick={() => setShowDiscount(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={applyDiscount}
                disabled={!discountInput || !discountReason}
                className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-40 transition-colors">
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split modal */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Partage de l'addition</h2>
              <button onClick={() => setShowSplitModal(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-500">Diviser {total.toFixed(2)}€ en :</p>
            <div className="mb-4 flex items-center justify-center gap-4">
              <button onClick={() => setSplitParts(p => Math.max(2, p - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-xl font-bold">
                −
              </button>
              <span className="text-3xl font-bold text-orange-500">{splitParts}</span>
              <button onClick={() => setSplitParts(p => Math.min(10, p + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-xl font-bold">
                +
              </button>
            </div>
            <p className="mb-4 text-center text-lg font-bold text-gray-900">
              {(total / splitParts).toFixed(2)}€ par personne
            </p>
            <div className="flex gap-2">
              <button onClick={() => { setSplitActive(null); setShowSplitModal(false); }}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
                Annuler partage
              </button>
              <button onClick={() => { setSplitActive(splitParts); setShowSplitModal(false); }}
                className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket scan modal */}
      {showTicketScan && (
        <TicketScanModal
          onClose={() => setShowTicketScan(false)}
          onFound={t => {
            setShowTicketScan(false);
            toast.success(`Ticket ${t.no} retrouvé`);
          }}
        />
      )}

      {/* Receipt modal */}
      {showReceiptModal && lastTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Ticket de caisse</h2>
              <button onClick={() => setShowReceiptModal(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 rounded-xl bg-gray-50 p-4 font-mono text-xs">
              <p className="text-center font-bold text-base mb-2">RESTRO POS</p>
              <p className="text-center text-gray-500 mb-3">{lastTicket.date}</p>
              {lastTicket.items.map((line, i) => (
                <div key={i} className="flex justify-between mb-1">
                  <span>{line.item.name} ×{line.quantity}</span>
                  <span>{(line.item.price * line.quantity).toFixed(2)}€</span>
                </div>
              ))}
              <div className="border-t border-gray-300 mt-2 pt-2">
                <div className="flex justify-between font-bold">
                  <span>TOTAL TTC</span>
                  <span>{lastTicket.total.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>TVA</span>
                  <span>{lastTicket.tva.toFixed(2)}€</span>
                </div>
              </div>
              <p className="mt-3 text-center text-gray-400">{lastTicket.no}</p>
              <p className="text-center text-gray-400">Hash: {lastTicket.hash}</p>
            </div>
            <button onClick={() => { window.print(); }}
              className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition-colors">
              Imprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
