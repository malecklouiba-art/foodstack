'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Users,
  RotateCcw,
  Percent,
  Receipt,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface POSItem {
  id: string;
  name: string;
  category: string;
  price: number;
  emoji: string;
}

interface CartLine {
  item: POSItem;
  quantity: number;
  discount: number;
  notes: string;
}

const CATEGORIES = ['Tout', 'Burgers', 'Pizzas', 'Salades', 'Boissons', 'Desserts'];

const MENU_ITEMS: POSItem[] = [
  { id: '1', name: 'Classic Smash Burger', category: 'Burgers', price: 14.90, emoji: '🍔' },
  { id: '2', name: 'Truffle Burger', category: 'Burgers', price: 22.50, emoji: '🍔' },
  { id: '3', name: 'Chicken Burger', category: 'Burgers', price: 12.90, emoji: '🍔' },
  { id: '4', name: 'Margherita', category: 'Pizzas', price: 13.90, emoji: '🍕' },
  { id: '5', name: 'Diavola', category: 'Pizzas', price: 16.50, emoji: '🍕' },
  { id: '6', name: 'Quattro Formaggi', category: 'Pizzas', price: 18.00, emoji: '🍕' },
  { id: '7', name: 'Salade César', category: 'Salades', price: 12.50, emoji: '🥗' },
  { id: '8', name: 'Salade Niçoise', category: 'Salades', price: 13.90, emoji: '🥗' },
  { id: '9', name: 'Eau Minérale', category: 'Boissons', price: 2.50, emoji: '💧' },
  { id: '10', name: 'Limonade', category: 'Boissons', price: 4.90, emoji: '🍋' },
  { id: '11', name: 'Café Espresso', category: 'Boissons', price: 2.20, emoji: '☕' },
  { id: '12', name: 'Tiramisu', category: 'Desserts', price: 7.50, emoji: '🍮' },
  { id: '13', name: 'Fondant Chocolat', category: 'Desserts', price: 8.00, emoji: '🍫' },
  { id: '14', name: 'Frites Maison', category: 'Tout', price: 4.50, emoji: '🍟' },
];

type PayStep = 'cart' | 'payment' | 'success';

interface ReceiptData {
  orderNumber: number;
  items: CartLine[];
  subtotal: number;
  tax: number;
  total: number;
  payMethod: 'card' | 'cash' | 'mobile';
  tableNumber: number | null;
}

function generateReceiptHtml(order: ReceiptData): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const divider = '--------------------------------';

  const payLabels: Record<string, string> = {
    card: 'Carte bancaire',
    cash: 'Espèces',
    mobile: 'Paiement mobile',
  };

  const itemLines = order.items
    .map((line) => {
      const name = line.item.name.length > 16 ? line.item.name.slice(0, 16) : line.item.name;
      const right = `${line.quantity}x${line.item.price.toFixed(2)}€`;
      const spaces = Math.max(1, 32 - name.length - right.length);
      return `<div style="display:flex;justify-content:space-between;"><span>${name}</span><span>${right}</span></div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ticket #${order.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 300px;
      margin: 0 auto;
      padding: 16px 8px;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .total { font-size: 16px; font-weight: bold; }
    .footer { margin-top: 12px; text-align: center; font-size: 11px; color: #555; }
    @media print {
      body { width: 80mm; padding: 8px 4px; }
    }
  </style>
</head>
<body>
  <div class="center bold" style="font-size:14px;">LE COMPTOIR MODERNE</div>
  <div class="center" style="margin-top:4px;">12 Rue de la Paix, 75001 Paris</div>
  <div class="center">Tél : 01 42 00 00 00</div>
  <div class="center" style="margin-top:4px;">${dateStr} à ${timeStr}</div>
  <div class="center">Ticket #${order.orderNumber}</div>
  <div class="divider"></div>
  ${itemLines}
  <div class="divider"></div>
  <div class="row"><span>Sous-total</span><span>${order.subtotal.toFixed(2)} €</span></div>
  <div class="row"><span>TVA (10%)</span><span>${order.tax.toFixed(2)} €</span></div>
  <div class="divider"></div>
  <div class="row total"><span>TOTAL</span><span>${order.total.toFixed(2)} €</span></div>
  <div class="divider"></div>
  <div class="row"><span>Règlement</span><span>${payLabels[order.payMethod] ?? order.payMethod}</span></div>
  <div class="divider"></div>
  <div class="footer">
    <div>Merci de votre visite !</div>
    ${order.tableNumber ? `<div>Table ${order.tableNumber}</div>` : ''}
    <div style="margin-top:6px;">WiFi : comptoir2024</div>
    <div style="margin-top:8px; font-size:22px;">▪ ▪ ▪ ▪ ▪</div>
    <div style="font-size:10px;">[ QR Code ]</div>
    <div style="font-size:10px;">www.lecomptoirmoderne.fr</div>
  </div>
</body>
</html>`;
}

export default function POSPage() {
  const [activeCategory, setActiveCategory] = useState('Tout');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payStep, setPayStep] = useState<PayStep>('cart');
  const [payMethod, setPayMethod] = useState<'card' | 'cash' | 'mobile'>('card');
  const [cashGiven, setCashGiven] = useState('');
  const [orderCount, setOrderCount] = useState(8821);
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  const filteredItems = MENU_ITEMS.filter((item) => {
    const matchCat = activeCategory === 'Tout' || item.category === activeCategory;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (item: POSItem) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) => l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, { item, quantity: 1, discount: 0, notes: '' }];
    });
  };

  const updateQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.item.id !== itemId));
    } else {
      setCart((prev) => prev.map((l) => l.item.id === itemId ? { ...l, quantity: qty } : l));
    }
  };

  const subtotal = cart.reduce((acc, l) => acc + l.item.price * l.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;
  const cashChange = cashGiven ? parseFloat(cashGiven) - total : 0;

  const printReceipt = () => {
    const html = generateReceiptHtml({
      orderNumber: orderCount,
      items: cart,
      subtotal,
      tax,
      total,
      payMethod,
      tableNumber,
    });
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handlePayment = () => {
    setPayStep('success');
    setOrderCount((c) => c + 1);
    setTimeout(() => {
      setCart([]);
      setPayStep('cart');
      setCashGiven('');
      setTableNumber(null);
      toast.success(`Commande #${orderCount + 1} validée !`);
    }, 3000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950 text-white">
      {/* Left: Menu */}
      <div className="flex w-0 flex-col border-r border-white/10 sm:w-[420px] lg:w-[520px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <h1 className="text-lg font-bold">Point de Vente</h1>
            <p className="text-xs text-white/50">Le Comptoir Moderne</p>
          </div>
          <div className="flex items-center gap-2">
            {tableNumber && (
              <Badge variant="brand">Table {tableNumber}</Badge>
            )}
            <button
              onClick={() => setTableNumber(tableNumber ? null : Math.floor(Math.random() * 20) + 1)}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              <Users className="h-3.5 w-3.5" />
              {tableNumber ? `Table ${tableNumber}` : 'Table'}
            </button>
          </div>
        </div>

        {/* Search */}
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

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items grid */}
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
                <span className="mt-1 text-sm font-bold text-brand-400">{item.price.toFixed(2)}€</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart / Payment */}
      <div className="flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          {payStep === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="flex h-full flex-col"
            >
              {/* Cart header */}
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div>
                  <h2 className="font-bold">Commande #{orderCount}</h2>
                  <p className="text-xs text-white/50">{cart.length} article{cart.length !== 1 ? 's' : ''}</p>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Vider
                  </button>
                )}
              </div>

              {/* Cart lines */}
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
                        <motion.div
                          key={line.item.id}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                          <span className="text-xl">{line.item.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-white">{line.item.name}</p>
                            <p className="text-xs text-white/50">{line.item.price.toFixed(2)}€ / unité</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQty(line.item.id, line.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
                            <button
                              onClick={() => updateQty(line.item.id, line.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="w-16 text-right">
                            <p className="text-sm font-bold text-brand-400">
                              {(line.item.price * line.quantity).toFixed(2)}€
                            </p>
                          </div>
                          <button
                            onClick={() => updateQty(line.item.id, 0)}
                            className="text-white/30 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Summary & actions */}
              <div className="border-t border-white/10 p-4">
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Sous-total</span>
                    <span>{subtotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>TVA (10%)</span>
                    <span>{tax.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>Total</span>
                    <span className="text-brand-400">{total.toFixed(2)}€</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { icon: Percent, label: 'Remise', onClick: undefined },
                    { icon: Receipt, label: 'Ticket', onClick: printReceipt },
                    { icon: Users, label: 'Partager', onClick: undefined },
                  ].map(({ icon: Icon, label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="flex flex-col items-center gap-1 rounded-xl border border-white/10 py-2.5 text-xs text-white/60 hover:bg-white/10"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                <Button
                  fullWidth
                  size="lg"
                  disabled={cart.length === 0}
                  onClick={() => setPayStep('payment')}
                  icon={<CreditCard className="h-5 w-5" />}
                >
                  Encaisser · {total.toFixed(2)}€
                </Button>
              </div>
            </motion.div>
          )}

          {payStep === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="flex h-full flex-col"
            >
              <div className="flex items-center gap-3 border-b border-white/10 p-4">
                <button onClick={() => setPayStep('cart')} className="rounded-lg p-1.5 hover:bg-white/10">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="font-bold">Mode de paiement</h2>
              </div>

              <div className="flex-1 p-6">
                <div className="mb-6 text-center">
                  <p className="text-sm text-white/50">Montant à encaisser</p>
                  <p className="mt-1 text-5xl font-black text-brand-400">{total.toFixed(2)}€</p>
                </div>

                {/* Payment method selector */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { id: 'card' as const, icon: CreditCard, label: 'Carte' },
                    { id: 'cash' as const, icon: Banknote, label: 'Espèces' },
                    { id: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPayMethod(method.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border py-4 transition-colors ${
                        payMethod === method.id
                          ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <method.icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>

                {/* Cash input */}
                {payMethod === 'cash' && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 text-sm font-medium text-white/70">Montant remis</p>
                    <div className="flex gap-2 mb-3">
                      {[20, 50, 100].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setCashGiven(amount.toString())}
                          className="flex-1 rounded-lg bg-white/10 py-2 text-sm font-medium hover:bg-white/20"
                        >
                          {amount}€
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder="Montant exact"
                      className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-lg font-bold text-white focus:border-brand-500 focus:outline-none"
                    />
                    {cashGiven && (
                      <div className={`mt-3 text-center ${cashChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <p className="text-sm">Rendu : <span className="font-bold">{cashChange.toFixed(2)}€</span></p>
                      </div>
                    )}
                  </div>
                )}

                {payMethod === 'card' && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                    <div className="mb-2 text-4xl">💳</div>
                    <p className="text-sm text-white/60">Présentez la carte ou le terminal</p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-white/40">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="h-2 w-2 rounded-full bg-white/40"
                      />
                      <span className="text-xs">En attente du paiement...</span>
                    </div>
                  </div>
                )}

                {payMethod === 'mobile' && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                    <div className="mb-2 text-4xl">📱</div>
                    <p className="text-sm text-white/60">Apple Pay / Google Pay / Lydia</p>
                    <p className="mt-1 text-xs text-white/40">Approchez votre téléphone</p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 p-4">
                <Button
                  fullWidth
                  size="lg"
                  onClick={handlePayment}
                  disabled={payMethod === 'cash' && (!cashGiven || cashChange < 0)}
                  icon={<Check className="h-5 w-5" />}
                >
                  Valider le paiement
                </Button>
              </div>
            </motion.div>
          )}

          {payStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-full flex-col items-center justify-center p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-500"
              >
                <Check className="h-12 w-12 text-white" strokeWidth={3} />
              </motion.div>
              <h2 className="text-2xl font-bold text-white">Paiement accepté !</h2>
              <p className="mt-2 text-white/60">Commande #{orderCount + 1} validée</p>
              <p className="mt-1 text-3xl font-black text-green-400">{total.toFixed(2)}€</p>
              <button
                onClick={printReceipt}
                className="mt-6 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/20"
              >
                <Receipt className="h-4 w-4" />
                Imprimer le ticket
              </button>
              <p className="mt-4 text-sm text-white/40">Réinitialisation en cours...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
