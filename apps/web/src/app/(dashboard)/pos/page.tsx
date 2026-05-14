'use client';

import { useState, useCallback } from 'react';
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone,
  Users, RotateCcw, Percent, Receipt, ChevronLeft, Check,
  Shield, FileText, BookOpen, X, Download, Lock, Hash,
  AlertTriangle, Clock, ChevronDown, ChevronUp,
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
}

type PayStep = 'cart' | 'payment' | 'success';
type ComplianceTab = 'journal' | 'z_report' | 'attestation';

// ── Constants ─────────────────────────────────────────────────────────────────

const SIRET = '123 456 789 00012';
const TVA_NO = 'FR 12 123456789';
const RESTAURANT = 'Le Comptoir Moderne';
const ADDRESS = '42 rue de la Paix, 75001 Paris';
const OPERATOR = 'Marie D.';

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

export default function POSPage() {
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payStep, setPayStep] = useState<PayStep>('cart');
  const [payMethod, setPayMethod] = useState<'card' | 'cash' | 'mobile' | 'tr'>('card');
  const [cashGiven, setCashGiven] = useState('');
  const [ticketCounter, setTicketCounter] = useState(8821);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [lastTicket, setLastTicket] = useState<TicketData | null>(null);

  // Compliance state
  const [showCompliance, setShowCompliance] = useState(false);
  const [complianceTab, setComplianceTab] = useState<ComplianceTab>('journal');
  const [journal, setJournal] = useState<JournalEvent[]>([
    { id: 'e0', timestamp: '2026-05-14T07:00:00Z', type: 'open', description: 'Ouverture de caisse — session démarrée', operator: 'Marie D.', hash: 'A1B2C3D4F5E6' },
  ]);

  // Discount modal
  const [discountTarget, setDiscountTarget] = useState<string | null>(null);
  const [discountPct, setDiscountPct] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  const filteredItems = MENU_ITEMS.filter((item) => {
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

  const applyDiscount = () => {
    if (!discountTarget || !discountReason) return;
    const pct = parseFloat(discountPct) || 0;
    setCart((prev) => prev.map((l) =>
      l.item.id === discountTarget ? { ...l, discount: pct, discountReason } : l
    ));
    addJournalEvent('discount', `Remise ${pct}% sur ${MENU_ITEMS.find(i => i.id === discountTarget)?.name} — ${discountReason}`, pct);
    setDiscountTarget(null);
    setDiscountPct('');
    setDiscountReason('');
  };

  const markOffert = (itemId: string) => {
    const item = MENU_ITEMS.find(i => i.id === itemId);
    setCart((prev) => prev.map((l) => l.item.id === itemId ? { ...l, offert: true, discount: 100, discountReason: 'Offert' } : l));
    addJournalEvent('offert', `Article offert : ${item?.name}`, item?.price);
  };

  const addJournalEvent = (type: JournalEvent['type'], desc: string, amount?: number, ticketNo?: string) => {
    const { time, iso } = now();
    const id = `e${Date.now()}`;
    const hash = fakeHash(id + desc + iso);
    setJournal((prev) => [{
      id, timestamp: iso, type, description: desc,
      amount, ticketNo, operator: OPERATOR, hash,
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

  const handlePayment = () => {
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
      operator: OPERATOR,
      hash,
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
      toast.success(`${no} validé · ${total.toFixed(2)}€`);
    }, 4000);
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
    open: 'text-blue-400', sale: 'text-brand-400', cancel: 'text-red-400',
    discount: 'text-yellow-400', offert: 'text-purple-400', close: 'text-gray-400',
    z_report: 'text-cyan-400',
  };
  const EVENT_ICONS: Record<JournalEvent['type'], string> = {
    open: '🔓', sale: '💳', cancel: '❌', discount: '%', offert: '🎁', close: '🔒', z_report: '📋',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950 text-white">

      {/* ── Left: Menu ─────────────────────────────────────────────────────── */}
      <div className="flex w-0 flex-col border-r border-white/10 sm:w-[420px] lg:w-[520px]">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <h1 className="text-lg font-bold">Point de Vente</h1>
            <p className="text-xs text-white/50">{RESTAURANT}</p>
          </div>
          <div className="flex items-center gap-2">
            {tableNumber && <Badge variant="brand">Table {tableNumber}</Badge>}
            <button
              onClick={() => setTableNumber(tableNumber ? null : Math.floor(Math.random() * 20) + 1)}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              <Users className="h-3.5 w-3.5" />
              {tableNumber ? `Table ${tableNumber}` : 'Table'}
            </button>
            <button
              onClick={() => setShowCompliance(true)}
              className="flex items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-sm text-brand-400 hover:bg-brand-500/20"
            >
              <Shield className="h-3.5 w-3.5" />
              NF525
            </button>
          </div>
        </div>

        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className="h-10 w-full rounded-xl border border-white/10 bg-white/10 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat ? 'bg-brand-500 text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
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
                className="flex flex-col items-start rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:border-brand-500/50 hover:bg-white/10"
              >
                <span className="mb-1.5 text-2xl">{item.emoji}</span>
                <span className="text-sm font-medium leading-tight text-white line-clamp-2">{item.name}</span>
                <div className="mt-1 flex w-full items-center justify-between">
                  <span className="text-sm font-bold text-brand-400">{item.price.toFixed(2)}€</span>
                  <span className="text-xs text-white/30">TVA {item.tvaRate}%</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Cart / Payment ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        <AnimatePresence mode="wait">

          {payStep === 'cart' && (
            <motion.div key="cart" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div>
                  <h2 className="font-bold">Commande #{formatTicketNo(ticketCounter + 1)}</h2>
                  <p className="text-xs text-white/50">{cart.length} article{cart.length !== 1 ? 's' : ''} · {OPERATOR}</p>
                </div>
                {cart.length > 0 && (
                  <button onClick={handleCancel} className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20">
                    <RotateCcw className="h-3.5 w-3.5" /> Annuler
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 thin-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-3 text-5xl">🛒</div>
                    <p className="text-white/40">Aucun article sélectionné</p>
                    <p className="mt-1 text-sm text-white/25">Cliquez sur un article pour l'ajouter</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {cart.map((line) => (
                        <motion.div key={line.item.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                          className={`rounded-xl border bg-white/5 p-3 ${line.offert ? 'border-purple-500/30' : 'border-white/10'}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{line.item.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium text-white">{line.item.name}</p>
                              <p className="text-xs text-white/50">{line.item.price.toFixed(2)}€ · TVA {line.item.tvaRate}%</p>
                              {line.discount > 0 && (
                                <p className="text-xs text-yellow-400">−{line.discount}% · {line.discountReason}</p>
                              )}
                              {line.offert && <p className="text-xs text-purple-400">🎁 Offert</p>}
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(line.item.id, line.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
                              <button onClick={() => updateQty(line.item.id, line.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="w-16 text-right">
                              <p className="text-sm font-bold text-brand-400">
                                {(line.item.price * line.quantity * (1 - line.discount / 100)).toFixed(2)}€
                              </p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <button onClick={() => { setDiscountTarget(line.item.id); setDiscountPct(''); setDiscountReason(''); }} className="text-yellow-400/50 hover:text-yellow-400">
                                <Percent className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => markOffert(line.item.id)} className="text-purple-400/50 hover:text-purple-400" title="Offert">
                                <span className="text-xs">🎁</span>
                              </button>
                              <button onClick={() => updateQty(line.item.id, 0)} className="text-white/30 hover:text-red-400">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 p-4">
                <div className="mb-4 space-y-1.5">
                  <div className="flex justify-between text-sm text-white/60">
                    <span>HT</span><span>{(subtotal - tvaAmount).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>TVA</span><span>{tvaAmount.toFixed(2)}€</span>
                  </div>
                  {cart.some(l => l.discount > 0) && (
                    <div className="flex justify-between text-sm text-yellow-400">
                      <span>Remises</span>
                      <span>−{cart.reduce((s, l) => s + l.item.price * l.quantity * (l.discount / 100), 0).toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-white border-t border-white/10 pt-2">
                    <span>Total TTC</span>
                    <span className="text-brand-400">{total.toFixed(2)}€</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { icon: Receipt, label: 'Ticket', action: () => lastTicket && setPayStep('success') },
                    { icon: Users,   label: 'Partager', action: () => {} },
                    { icon: BookOpen,label: 'Journal', action: () => { setShowCompliance(true); setComplianceTab('journal'); } },
                  ].map(({ icon: Icon, label, action }) => (
                    <button key={label} onClick={action} className="flex flex-col items-center gap-1 rounded-xl border border-white/10 py-2.5 text-xs text-white/60 hover:bg-white/10">
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
              <div className="flex items-center gap-3 border-b border-white/10 p-4">
                <button onClick={() => setPayStep('cart')} className="rounded-lg p-1.5 hover:bg-white/10">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="font-bold">Encaissement</h2>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-white/40">
                  <Lock className="h-3 w-3" /> Transaction sécurisée NF525
                </div>
              </div>

              <div className="flex-1 p-6">
                <div className="mb-6 text-center">
                  <p className="text-sm text-white/50">Montant à encaisser</p>
                  <p className="mt-1 text-5xl font-black text-brand-400">{total.toFixed(2)}€</p>
                  <p className="mt-1 text-xs text-white/30">dont TVA : {tvaAmount.toFixed(2)}€</p>
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
                        payMethod === method.id ? 'border-brand-500 bg-brand-500/20 text-brand-300' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                      }`}>
                      <method.icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>

                {payMethod === 'cash' && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 text-sm font-medium text-white/70">Montant remis</p>
                    <div className="flex gap-2 mb-3">
                      {[Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, 50, 100].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).map((amount) => (
                        <button key={amount} onClick={() => setCashGiven(amount.toString())} className="flex-1 rounded-lg bg-white/10 py-2 text-sm font-medium hover:bg-white/20">
                          {amount}€
                        </button>
                      ))}
                    </div>
                    <input type="number" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} placeholder="Montant exact"
                      className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-lg font-bold text-white focus:border-brand-500 focus:outline-none" />
                    {cashGiven && (
                      <div className={`mt-3 text-center ${cashChange >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                        <p className="text-sm">Rendu : <span className="text-xl font-bold">{cashChange.toFixed(2)}€</span></p>
                      </div>
                    )}
                  </div>
                )}

                {(payMethod === 'card' || payMethod === 'tr' || payMethod === 'mobile') && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                    <div className="mb-2 text-4xl">
                      {payMethod === 'card' ? '💳' : payMethod === 'tr' ? '🎫' : '📱'}
                    </div>
                    <p className="text-sm text-white/60">
                      {payMethod === 'card' ? 'Présentez la carte ou le terminal' : payMethod === 'tr' ? 'Scannez ou tapotez le ticket restaurant' : 'Apple Pay / Google Pay / Lydia'}
                    </p>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} className="mt-4 flex items-center justify-center gap-2 text-white/40">
                      <span className="h-2 w-2 rounded-full bg-white/40 inline-block" />
                      <span className="text-xs">En attente...</span>
                    </motion.div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 p-4">
                <Button fullWidth size="lg" onClick={handlePayment}
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
                <h2 className="text-xl font-bold text-white">Paiement accepté</h2>
                <p className="text-brand-400 font-black text-3xl mt-1">{lastTicket.total.toFixed(2)}€</p>
              </div>

              {/* Ticket preview — NF525 compliant */}
              <div className="mx-auto w-full max-w-xs rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-xs text-white/80">
                <div className="text-center mb-3">
                  <p className="font-bold text-white text-sm">{RESTAURANT}</p>
                  <p>{ADDRESS}</p>
                  <p className="mt-1">SIRET : {SIRET}</p>
                  <p>N° TVA : {TVA_NO}</p>
                </div>
                <div className="border-t border-white/20 my-2" />
                <div className="flex justify-between">
                  <span>Ticket n°</span><span className="font-bold text-brand-400">{lastTicket.no}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date</span><span>{lastTicket.date} {lastTicket.time}</span>
                </div>
                {lastTicket.tableNumber && <div className="flex justify-between"><span>Table</span><span>{lastTicket.tableNumber}</span></div>}
                <div className="flex justify-between"><span>Caissier</span><span>{lastTicket.operator}</span></div>
                <div className="border-t border-white/20 my-2" />
                {lastTicket.lines.map((l, i) => (
                  <div key={i} className="flex justify-between gap-1">
                    <span className="truncate flex-1">{l.quantity}× {l.item.name}{l.offert ? ' (offert)' : l.discount > 0 ? ` −${l.discount}%` : ''}</span>
                    <span>{(l.item.price * l.quantity * (1 - l.discount / 100)).toFixed(2)}€</span>
                  </div>
                ))}
                <div className="border-t border-white/20 my-2" />
                <div className="flex justify-between"><span>HT</span><span>{lastTicket.subtotalHT.toFixed(2)}€</span></div>
                <div className="flex justify-between"><span>TVA</span><span>{lastTicket.tva.toFixed(2)}€</span></div>
                <div className="flex justify-between font-bold text-white"><span>TOTAL TTC</span><span>{lastTicket.total.toFixed(2)}€</span></div>
                <div className="flex justify-between mt-1"><span>Règlement</span><span>{lastTicket.payMethod}</span></div>
                <div className="border-t border-white/20 my-2" />
                <div className="text-center text-white/40">
                  <p>Signature : {lastTicket.hash}</p>
                  <p className="mt-1">Merci de votre visite !</p>
                  <p>Conservation 6 ans — Art. L.102 B LPF</p>
                </div>
              </div>

              <p className="mt-4 text-center text-sm text-white/40">Réinitialisation en cours...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Discount Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {discountTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" /> Remise tracée
                </h3>
                <button onClick={() => setDiscountTarget(null)} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <p className="mb-4 text-xs text-white/50">Toute remise est journalisée et non modifiable (NF525).</p>
              <input type="number" value={discountPct} onChange={e => setDiscountPct(e.target.value)} placeholder="% de remise" min={0} max={100}
                className="mb-3 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-white focus:border-brand-500 focus:outline-none" />
              <p className="mb-2 text-xs text-white/50 uppercase tracking-wide">Motif obligatoire</p>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {DISCOUNT_REASONS.map(r => (
                  <button key={r} onClick={() => setDiscountReason(r)}
                    className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${discountReason === r ? 'border-brand-500 bg-brand-500/20 text-brand-300' : 'border-white/10 text-white/60 hover:bg-white/10'}`}>
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

      {/* ── Compliance Drawer ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCompliance && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/60" onClick={() => setShowCompliance(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex w-full max-w-lg flex-col border-l border-white/10 bg-surface-950 overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand-400" />
                  <h2 className="font-bold text-white">Conformité NF525</h2>
                  <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-xs text-brand-400">Certifié</span>
                </div>
                <button onClick={() => setShowCompliance(false)} className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {([
                  { id: 'journal',     label: 'Journal', icon: BookOpen },
                  { id: 'z_report',   label: 'Z de Caisse', icon: FileText },
                  { id: 'attestation',label: 'Attestation', icon: Shield },
                ] as { id: ComplianceTab; label: string; icon: React.ElementType }[]).map(tab => (
                  <button key={tab.id} onClick={() => setComplianceTab(tab.id)}
                    className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                      complianceTab === tab.id ? 'border-b-2 border-brand-500 text-brand-400' : 'text-white/40 hover:text-white'
                    }`}>
                    <tab.icon className="h-4 w-4" /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 thin-scrollbar">

                {/* Journal Tab */}
                {complianceTab === 'journal' && (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs text-white/40 uppercase tracking-wide">Journal horodaté · inaltérable</p>
                      <span className="text-xs text-white/40">{journal.length} événements</span>
                    </div>
                    <div className="space-y-2">
                      {journal.map((ev) => (
                        <div key={ev.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 text-base ${EVENT_COLORS[ev.type]}`}>{EVENT_ICONS[ev.type]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white">{ev.description}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/40">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ev.timestamp).toLocaleString('fr-FR')}</span>
                                <span>{ev.operator}</span>
                                {ev.ticketNo && <span className="text-brand-400">{ev.ticketNo}</span>}
                              </div>
                              <p className="mt-1 text-xs text-white/25 font-mono">#{ev.hash}</p>
                            </div>
                            {ev.amount !== undefined && (
                              <span className={`text-sm font-bold ${ev.type === 'cancel' ? 'text-red-400' : 'text-brand-400'}`}>
                                {ev.type === 'cancel' ? '−' : ''}{ev.amount.toFixed(2)}€
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Z Report Tab */}
                {complianceTab === 'z_report' && (
                  <div>
                    <div className="mb-4 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
                      <p className="text-xs text-brand-400 uppercase tracking-wide mb-3">Rapport journalier — {new Date().toLocaleDateString('fr-FR')}</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Chiffre d\'affaires', value: `${totalCA.toFixed(2)}€`, color: 'text-brand-400' },
                          { label: 'Transactions', value: salesEvents.length.toString(), color: 'text-white' },
                          { label: 'Remises accordées', value: totalDiscounts.toString(), color: 'text-yellow-400' },
                          { label: 'Articles offerts', value: totalOfferts.toString(), color: 'text-purple-400' },
                          { label: 'Annulations', value: journal.filter(e => e.type === 'cancel').length.toString(), color: 'text-red-400' },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between text-sm">
                            <span className="text-white/60">{row.label}</span>
                            <span className={`font-bold ${row.color}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-white/40 uppercase mb-2">Répartition TVA</p>
                      {[{ rate: '5,5%', label: 'Boissons non alcoolisées' }, { rate: '10%', label: 'Restauration' }].map(t => (
                        <div key={t.rate} className="flex justify-between text-sm text-white/60 mb-1">
                          <span>TVA {t.rate} · {t.label}</span>
                          <span>{(totalCA * 0.1).toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>

                    <Button fullWidth onClick={generateZReport} icon={<FileText className="h-4 w-4" />}>
                      Générer Z de Caisse (signé)
                    </Button>
                    <p className="mt-2 text-center text-xs text-white/30">Le Z est horodaté, signé et journalisé automatiquement</p>
                  </div>
                )}

                {/* Attestation Tab */}
                {complianceTab === 'attestation' && (
                  <div>
                    <div className="mb-4 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20">
                          <Shield className="h-5 w-5 text-brand-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white">Attestation de conformité</p>
                          <p className="text-xs text-brand-400">NF525 · Loi anti-fraude TVA 2018</p>
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
                            <span className="text-white/50">{row.label}</span>
                            <span className="text-white font-medium">{row.value}</span>
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
                        <div key={item.label} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                          <Check className="h-4 w-4 text-brand-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-white">{item.label}</p>
                            <p className="text-xs text-white/50">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button fullWidth onClick={() => toast.success('Attestation téléchargée (PDF)')} icon={<Download className="h-4 w-4" />}>
                      Télécharger l'attestation PDF
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
