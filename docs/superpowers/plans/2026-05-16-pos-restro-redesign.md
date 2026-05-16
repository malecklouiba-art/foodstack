# POS Restro Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/pos` page to match Restro POS visual style — left icon nav, product image grid, persistent right cart panel, Customers/Orders/Reports views — while preserving all existing French compliance features (TVA, NF525 journal, Z-report, staff PIN).

**Architecture:** Single file rewrite of `apps/web/src/app/(dashboard)/pos/page.tsx`. All existing state, handlers, and compliance logic stays intact. New layout wraps: left icon sidebar (64px) + main content area (view switcher) + right cart panel (340px fixed). No new files needed.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Pixabay CDN images

---

## File Structure

| File | Action |
|------|--------|
| `apps/web/src/app/(dashboard)/pos/page.tsx` | Full rewrite — same logic, new layout |

---

### Task 1: Add product images + update MENU_ITEMS

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx:98-113`

- [ ] **Step 1: Add `image` field to `POSItem` interface**

At line 19, update the interface:
```typescript
interface POSItem {
  id: string;
  name: string;
  category: string;
  price: number;
  tvaRate: number;
  emoji: string;
  image: string; // Pixabay CDN URL
}
```

- [ ] **Step 2: Fetch Pixabay CDN image URLs for food categories**

Use WebFetch to find real CDN URLs from pixabay.com for: burger, pizza, salad, water/drink, coffee, tiramisu, chocolate fondant, fries. The CDN URL pattern is `https://cdn.pixabay.com/photo/YYYY/MM/DD/hh/mm/name-ID_640.jpg`.

Visit these Pixabay search pages and pick direct CDN URLs:
- `https://pixabay.com/photos/search/burger/`
- `https://pixabay.com/photos/search/pizza/`
- `https://pixabay.com/photos/search/salad/`
- `https://pixabay.com/photos/search/coffee/`
- `https://pixabay.com/photos/search/tiramisu/`

- [ ] **Step 3: Update MENU_ITEMS with real CDN image URLs**

Replace the existing `MENU_ITEMS` constant with one that includes `image` field:
```typescript
const MENU_ITEMS: POSItem[] = [
  { id: '1',  name: 'Classic Smash Burger',  category: 'Burgers',  price: 14.90, tvaRate: 10,  emoji: '🍔', image: '<BURGER_CDN_URL>' },
  { id: '2',  name: 'Truffle Burger',        category: 'Burgers',  price: 22.50, tvaRate: 10,  emoji: '🍔', image: '<BURGER_CDN_URL>' },
  { id: '3',  name: 'Chicken Burger',        category: 'Burgers',  price: 12.90, tvaRate: 10,  emoji: '🍔', image: '<BURGER_CDN_URL>' },
  { id: '4',  name: 'Margherita',            category: 'Pizzas',   price: 13.90, tvaRate: 10,  emoji: '🍕', image: '<PIZZA_CDN_URL>' },
  { id: '5',  name: 'Diavola',               category: 'Pizzas',   price: 16.50, tvaRate: 10,  emoji: '🍕', image: '<PIZZA_CDN_URL>' },
  { id: '6',  name: 'Quattro Formaggi',      category: 'Pizzas',   price: 18.00, tvaRate: 10,  emoji: '🍕', image: '<PIZZA_CDN_URL>' },
  { id: '7',  name: 'Salade César',          category: 'Salades',  price: 12.50, tvaRate: 10,  emoji: '🥗', image: '<SALAD_CDN_URL>' },
  { id: '8',  name: 'Salade Niçoise',        category: 'Salades',  price: 13.90, tvaRate: 10,  emoji: '🥗', image: '<SALAD_CDN_URL>' },
  { id: '9',  name: 'Eau Minérale',          category: 'Boissons', price: 2.50,  tvaRate: 5.5, emoji: '💧', image: '<WATER_CDN_URL>' },
  { id: '10', name: 'Limonade',              category: 'Boissons', price: 4.90,  tvaRate: 10,  emoji: '🍋', image: '<LEMONADE_CDN_URL>' },
  { id: '11', name: 'Café Espresso',         category: 'Boissons', price: 2.20,  tvaRate: 10,  emoji: '☕', image: '<COFFEE_CDN_URL>' },
  { id: '12', name: 'Tiramisu',              category: 'Desserts', price: 7.50,  tvaRate: 10,  emoji: '🍮', image: '<TIRAMISU_CDN_URL>' },
  { id: '13', name: 'Fondant Chocolat',      category: 'Desserts', price: 8.00,  tvaRate: 10,  emoji: '🍫', image: '<FONDANT_CDN_URL>' },
  { id: '14', name: 'Frites Maison',         category: 'Tout',     price: 4.50,  tvaRate: 10,  emoji: '🍟', image: '<FRIES_CDN_URL>' },
];
```

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): add product image URLs (Pixabay CDN)"
```

---

### Task 2: New top-level layout — left icon nav + main area + right cart panel

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx` (post-auth return statement)

Context: The existing post-auth `return` starts at line 702 with `<div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">`. Replace from that outer div through the end of the component (before the modals which stay unchanged).

- [ ] **Step 1: Add `activeView` state and type**

Add these near the other state declarations (around line 437):
```typescript
type POSView = 'home' | 'customers' | 'tables' | 'cashier' | 'orders' | 'reports' | 'settings';
const [activeView, setActiveView] = useState<POSView>('home');
```

- [ ] **Step 2: Add required imports for new icons**

Add to the existing lucide-react import at line 7:
```typescript
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone,
  Users, RotateCcw, Percent, Receipt, ChevronLeft, Check,
  Shield, FileText, BookOpen, X, Download, Lock, Hash,
  AlertTriangle, Clock, Pencil, Loader2, User, UserPlus, Star, History, Camera,
  Home, ShoppingBag, BarChart2, Settings, Wifi, RefreshCw, LayoutGrid, LogOut,
  ChevronRight, Package, ShoppingCart,
} from 'lucide-react';
```

- [ ] **Step 3: Replace outer layout with 3-column Restro POS layout**

Replace the entire post-auth return (from `return (` at line 702 to closing `</div>` at the end of the main component, before `{/* ── Card Transaction... */}`) with:

```tsx
return (
  <div className="flex h-screen overflow-hidden bg-[#f5f5f5] text-gray-900">

    {/* ── Left icon nav (64px) ─────────────────────────────────────────── */}
    <nav className="flex w-16 flex-col items-center border-r border-gray-200 bg-white py-4 gap-1">
      {/* Logo */}
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500">
        <ShoppingBag className="h-5 w-5 text-white" />
      </div>

      {([
        { id: 'home'      as POSView, icon: Home,        label: 'Home' },
        { id: 'customers' as POSView, icon: User,        label: 'Customers' },
        { id: 'tables'    as POSView, icon: LayoutGrid,  label: 'Tables' },
        { id: 'cashier'   as POSView, icon: CreditCard,  label: 'Cashier' },
        { id: 'orders'    as POSView, icon: ShoppingCart,label: 'Orders' },
        { id: 'reports'   as POSView, icon: BarChart2,   label: 'Reports' },
        { id: 'settings'  as POSView, icon: Settings,    label: 'Settings' },
      ] as { id: POSView; icon: React.ElementType; label: string }[]).map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setActiveView(id)}
          className={`group flex flex-col items-center gap-1 rounded-xl p-2.5 transition-colors w-12 ${
            activeView === id
              ? 'bg-orange-50 text-orange-500'
              : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-[9px] font-medium leading-none">{label}</span>
        </button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Avatar */}
      <div className="flex flex-col items-center gap-1 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
          {operator.charAt(0)}
        </div>
      </div>
      <button
        onClick={() => { setAuthenticated(false); setOperator(''); setCart([]); }}
        className="flex flex-col items-center gap-1 rounded-xl p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors w-12"
      >
        <LogOut className="h-5 w-5" />
        <span className="text-[9px] font-medium leading-none">Logout</span>
      </button>
    </nav>

    {/* ── Main content area ────────────────────────────────────────────── */}
    <div className="flex flex-1 flex-col min-w-0">

      {/* Top header */}
      <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 gap-4">
        <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">Restro POS</h1>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products....."
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50">
            <Wifi className="h-4 w-4 text-green-500" />
          </button>
          <button
            onClick={() => setTableNumber(tableNumber ? null : Math.floor(Math.random() * 34) + 1)}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            <LayoutGrid className="h-4 w-4" />
            {tableNumber ? `T-${tableNumber}` : 'Select Table'}
          </button>
        </div>
      </header>

      {/* View content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'home'      && <HomeView />}
        {activeView === 'customers' && <CustomersView />}
        {activeView === 'tables'    && <TablesView />}
        {activeView === 'cashier'   && <CashierView />}
        {activeView === 'orders'    && <OrdersView />}
        {activeView === 'reports'   && <ReportsView />}
        {activeView === 'settings'  && <SettingsView />}
      </div>
    </div>

    {/* ── Right cart panel (always visible, 340px) ─────────────────────── */}
    <aside className="flex w-[340px] flex-col border-l border-gray-200 bg-white">
      <CartPanel />
    </aside>

    {/* ── All modals stay unchanged below ─────────────────────────────── */}
```

Note: `HomeView`, `CustomersView`, `TablesView`, `CashierView`, `OrdersView`, `ReportsView`, `SettingsView`, `CartPanel` are sub-components defined INSIDE `POSPage` so they can close over state (no prop drilling needed).

- [ ] **Step 4: Commit layout skeleton**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): 3-column Restro POS layout skeleton — icon nav + main + cart panel"
```

---

### Task 3: HomeView — category tabs + product image grid

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx`

- [ ] **Step 1: Define `HomeView` sub-component inside `POSPage`**

Add after the `handleCancel` function (before the `return`):

```tsx
function HomeView() {
  return (
    <div className="flex h-full flex-col">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-4 py-3 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-orange-500 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-4 thin-scrollbar">
        <div className="grid grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => addToCart(item)}
              className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm transition-all hover:border-orange-300 hover:shadow-md"
            >
              {/* Round product image */}
              <div className="mb-3 h-20 w-20 overflow-hidden rounded-full ring-2 ring-gray-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const t = e.currentTarget;
                    t.style.display = 'none';
                    if (t.nextElementSibling) (t.nextElementSibling as HTMLElement).style.display = 'flex';
                  }}
                />
                <div className="hidden h-full w-full items-center justify-center bg-gray-100 text-3xl">
                  {item.emoji}
                </div>
              </div>
              <p className="text-sm font-semibold leading-tight text-gray-900 line-clamp-2">{item.name}</p>
              <p className="mt-1 text-sm font-bold text-gray-900">${item.price.toFixed(2)}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify `filteredItems`, `activeCategory`, `setActiveCategory`, `addToCart` are in scope (all defined in parent `POSPage` — they are)**

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): HomeView — round product images + orange category tabs"
```

---

### Task 4: CartPanel — persistent right cart with Restro POS styling

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx`

This replaces the existing right panel logic (currently the `payStep === 'cart'` view).

- [ ] **Step 1: Define `CartPanel` sub-component inside `POSPage`**

```tsx
function CartPanel() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          {selectedCustomer ? (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{selectedCustomer.name}</p>
                <p className="text-xs text-gray-500">#{selectedCustomer.id}</p>
              </div>
            </>
          ) : (
            <button
              onClick={() => setCustomerMode('loyal')}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <UserPlus className="h-4 w-4" />
              + Add Customer
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50">
            <Plus className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setCart([]); setSelectedCustomer(null); setCustomerMode('anon'); }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cart lines */}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6">
            <ShoppingCart className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Aucun article</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {cart.map((line) => (
                <motion.div
                  key={line.item.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {/* Collapsed row */}
                  <div
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50"
                    onClick={() => setNoteTarget(noteTarget === line.item.id ? null : line.item.id)}
                  >
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${noteTarget === line.item.id ? 'rotate-90' : ''}`}
                    />
                    <span className="text-sm font-medium text-gray-500">{line.quantity}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{line.item.name}</p>
                      {line.discount > 0 && !line.offert && (
                        <p className="text-xs text-gray-400 line-through">${(line.item.price * line.quantity).toFixed(2)}</p>
                      )}
                      {line.offert && <p className="text-xs text-purple-500">🎁 Offert</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ${(line.item.price * line.quantity * (1 - line.discount / 100)).toFixed(2)}
                      </p>
                      {line.discount > 0 && !line.offert && (
                        <p className="text-xs text-gray-400 line-through">
                          ${(line.item.price * line.quantity).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQty(line.item.id, 0); }}
                      className="text-gray-300 hover:text-red-500 ml-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Expanded row — qty + discount controls */}
                  <AnimatePresence>
                    {noteTarget === line.item.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-l-2 border-orange-400 bg-orange-50/30 px-4 py-3"
                      >
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQty(line.item.id, line.quantity - 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold">{line.quantity}</span>
                              <button
                                onClick={() => updateQty(line.item.id, line.quantity + 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Discount(%)</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={line.discount || ''}
                              onChange={(e) => {
                                const pct = parseFloat(e.target.value) || 0;
                                setCart(prev => prev.map(l => l.item.id === line.item.id ? { ...l, discount: pct } : l));
                              }}
                              className="h-8 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-orange-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setDiscountTarget(line.item.id); setDiscountPct(String(line.discount || '')); setDiscountReason(''); }}
                            className="flex-1 rounded-lg border border-gray-200 bg-white py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Remise tracée
                          </button>
                          <button
                            onClick={() => markOffert(line.item.id)}
                            className="flex-1 rounded-lg border border-purple-200 bg-purple-50 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-100"
                          >
                            🎁 Offert
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="border-t border-gray-100 px-4 py-2 flex gap-3 text-xs">
        {[
          { label: 'Add',         action: () => {} },
          { label: 'Discount',    action: () => cart.length > 0 && setDiscountTarget(cart[0].item.id), cls: 'text-orange-500' },
          { label: 'Coupon Code', action: () => toast('Coupon non implémenté') },
          { label: 'Note',        action: () => cart.length > 0 && setNoteTarget(cart[0].item.id) },
        ].map(({ label, action, cls }) => (
          <button key={label} onClick={action} className={`font-medium text-gray-500 hover:text-gray-900 ${cls ?? ''}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 px-4 py-3 space-y-1.5">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span className="font-medium text-gray-900">${(subtotal - tvaAmount).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Tax</span>
          <span className="font-medium text-gray-900">${tvaAmount.toFixed(2)}</span>
        </div>
        {cart.some(l => l.discount > 0 && !l.offert) && (
          <div className="flex justify-between text-sm text-orange-600">
            <span>Discount</span>
            <span>-${cart.reduce((s, l) => s + l.item.price * l.quantity * (l.discount / 100), 0).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
          <span>Payable Amount</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <button
          onClick={() => { addJournalEvent('cancel', `Commande mise en attente (${cart.length} articles)`); toast('Commande en attente'); }}
          disabled={cart.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 transition-colors disabled:opacity-40"
        >
          <RefreshCw className="h-4 w-4" />
          Hold Cart
        </button>
        <button
          onClick={() => setActiveView('cashier')}
          disabled={cart.length === 0}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 transition-colors disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          Proceed
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): CartPanel — persistent right panel with Restro POS design"
```

---

### Task 5: CashierView — numpad payment screen

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx`

This is the payment screen (replaces `payStep === 'payment'`). Shows when user clicks "Proceed" (sets `activeView = 'cashier'`).

- [ ] **Step 1: Define `CashierView` sub-component inside `POSPage`**

```tsx
function CashierView() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: order summary */}
      <div className="flex-1 overflow-y-auto border-r border-gray-200 bg-white p-6 thin-scrollbar">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setActiveView('home')}
            className="flex items-center gap-1 text-orange-500 text-sm font-medium hover:text-orange-600"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Order ID #O{String(ticketCounter).padStart(7, '0')}</h2>
          {selectedCustomer && <p className="text-sm text-gray-500">{selectedCustomer.name}</p>}
          <p className="text-sm text-gray-500">
            {tableNumber ? `Dine-In • T-${tableNumber}` : 'Takeaway'}
          </p>
        </div>

        {/* Order lines */}
        <div className="space-y-3 mb-6">
          {cart.map((line) => (
            <div key={line.item.id} className="flex items-start gap-3">
              <span className="text-sm text-gray-500 w-4">{line.quantity}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{line.item.name}</p>
                {line.notes && <p className="text-xs text-gray-400">{line.notes}</p>}
                {line.discount > 0 && !line.offert && (
                  <p className="text-xs text-gray-400">{line.discount}% Disc • ${(line.item.price * line.quantity * (line.discount / 100)).toFixed(2)} • <span className="line-through">${(line.item.price * line.quantity).toFixed(2)}</span></p>
                )}
              </div>
              <p className="text-sm font-bold text-gray-900">
                ${(line.item.price * line.quantity * (1 - line.discount / 100)).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>${(subtotal - tvaAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax</span><span>${tvaAmount.toFixed(2)}</span>
          </div>
          {cart.some(l => l.discount > 0) && (
            <div className="flex justify-between text-sm text-orange-500">
              <span>Discount</span>
              <span>-${cart.reduce((s, l) => s + l.item.price * l.quantity * (l.discount / 100), 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
            <span>Grand Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Cash summary (shown after payment) */}
        {payMethod === 'cash' && cashGiven && (
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Cash</span><span>${parseFloat(cashGiven).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Balance</span>
              <span className={cashChange < 0 ? 'text-red-600' : ''}>${cashChange.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleValidatePayment}
          disabled={payMethod === 'cash' && (!cashGiven || cashChange < 0)}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 py-4 text-base font-bold text-white hover:bg-green-600 transition-colors disabled:opacity-40"
        >
          <CreditCard className="h-5 w-5" />
          Confirm Payment
        </button>
      </div>

      {/* Right: payment methods + numpad */}
      <div className="w-80 flex flex-col border-l border-gray-200 bg-white">
        {/* Amount display */}
        <div className="border-b border-gray-200 px-6 py-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Payable Amount</p>
          <p className="text-3xl font-black text-green-500">${total.toFixed(2)}</p>
        </div>

        {/* Payment mode tabs */}
        <div className="flex border-b border-gray-200">
          {(['cash', 'card', 'mobile', 'tr'] as const).map((m, i) => {
            const labels = ['Cash', 'Other Modes', 'Mobile', 'Ticket R.'];
            if (i > 1) return null; // Only show Cash + Other Modes tabs
            return (
              <button
                key={m}
                onClick={() => setPayMethod(i === 0 ? 'cash' : 'card')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
                  (i === 0 && payMethod === 'cash') || (i === 1 && payMethod !== 'cash')
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {labels[i]}
              </button>
            );
          })}
        </div>

        {payMethod === 'cash' ? (
          <div className="flex-1 flex flex-col p-4">
            {/* Amount display */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right">
              <p className="text-2xl font-black text-gray-900">
                ${cashGiven ? parseFloat(cashGiven).toFixed(2) : '0.00'}
              </p>
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2 flex-1">
              {['1','2','3','4','5','6','7','8','9','00','0','⌫'].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === '⌫') {
                      setCashGiven(p => p.slice(0, -1));
                    } else {
                      setCashGiven(p => {
                        const next = (p === '0' ? '' : p) + key;
                        return isNaN(parseFloat(next)) ? p : next;
                      });
                    }
                  }}
                  className={`rounded-xl py-4 text-xl font-bold transition-all active:scale-95 ${
                    key === '⌫'
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Cancel */}
            <button
              onClick={() => setActiveView('home')}
              className="mt-3 w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex-1 p-4 space-y-3">
            {/* Other payment methods */}
            {(['card', 'mobile', 'tr'] as const).map((m) => {
              const icons = { card: CreditCard, mobile: Smartphone, tr: Hash };
              const labels = { card: 'Carte bancaire', mobile: 'Apple/Google Pay', tr: 'Ticket Restaurant' };
              const Icon = icons[m];
              return (
                <button
                  key={m}
                  onClick={() => setPayMethod(m)}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    payMethod === m
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${payMethod === m ? 'text-orange-500' : 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${payMethod === m ? 'text-orange-700' : 'text-gray-700'}`}>
                    {labels[m]}
                  </span>
                </button>
              );
            })}
            {payMethod === 'tr' && (
              <button
                onClick={() => setShowTicketScan(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-orange-300 bg-orange-50 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100"
              >
                <Camera className="h-4 w-4" />
                Scanner le ticket
              </button>
            )}
            <button
              onClick={() => setActiveView('home')}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 mt-auto"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `handleValidatePayment` to switch back to home on success**

Find the `setTimeout` inside `completePayment` (around line 564):
```typescript
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
```

Add `setActiveView('home');` inside that setTimeout:
```typescript
setTimeout(() => {
  setCart([]);
  setPayStep('cart');
  setCashGiven('');
  setTableNumber(null);
  setSplitActive(null);
  setSelectedCustomer(null);
  setCustomerMode('anon');
  setActiveView('home');
  toast.success(`${no} validé · ${total.toFixed(2)}€`);
}, 4000);
```

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): CashierView — Restro POS numpad payment screen"
```

---

### Task 6: CustomersView — profile card + recent customers list

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx`

- [ ] **Step 1: Define `CustomersView` sub-component inside `POSPage`**

```tsx
function CustomersView() {
  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Left: customer profile or search */}
      <div className="flex-1 overflow-y-auto p-6 thin-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Customers</h2>
          <button className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">
            <UserPlus className="h-4 w-4" />
            + Add New Customer
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="Search Customers......"
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Selected customer profile card */}
        {selectedCustomer ? (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-xl bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-600 shrink-0">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name} <span className="text-sm font-normal text-gray-500">#{selectedCustomer.id}</span></h3>
                <p className="text-sm text-gray-500 mt-0.5">client@example.com</p>
                <p className="text-sm text-gray-500">+12-XXXXXXXXXX</p>
                <div className="mt-3 flex items-center gap-3">
                  <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
              <button
                onClick={() => { setSelectedCustomer(null); setCustomerMode('anon'); }}
                className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-100"
              >
                Remove
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">{selectedCustomer.loyaltyPoints} loyalty points</span>
            </div>
          </div>
        ) : null}

        {/* Recent customers list */}
        <h3 className="mb-3 text-sm font-bold text-gray-700">Recent Customers</h3>
        <div className="space-y-1">
          {CUSTOMERS.filter(c =>
            !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase())
          ).map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelectedCustomer(c); setCustomerMode('loyal'); }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                selectedCustomer?.id === c.id ? 'bg-orange-50 border border-orange-200' : ''
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold text-sm">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-500">customer@example.com</p>
              </div>
              <p className="text-xs text-gray-400 shrink-0">16/02/2020</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): CustomersView — profile card + recent customers list"
```

---

### Task 7: OrdersView — Order History / On Hold / Offline tabs

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx`

- [ ] **Step 1: Add `orderTab` state and `selectedOrder` state near other state declarations**

```typescript
type OrderTab = 'history' | 'hold' | 'offline';
const [orderTab, setOrderTab] = useState<OrderTab>('history');
const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(HISTORY[0]?.no ?? null);
```

- [ ] **Step 2: Define `OrdersView` sub-component inside `POSPage`**

```tsx
function OrdersView() {
  const selectedOrder = HISTORY.find(h => h.no === selectedOrderNo) ?? HISTORY[0];

  const tabOrders = orderTab === 'history'
    ? HISTORY
    : orderTab === 'hold'
    ? HISTORY.filter(h => h.bucket === 'today').slice(0, 2)
    : HISTORY.slice(0, 6);

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Left: orders list */}
      <div className="flex-1 overflow-y-auto border-r border-gray-200 thin-scrollbar">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-1">
          {([
            { id: 'history' as OrderTab,  label: 'Order History' },
            { id: 'hold'    as OrderTab,  label: 'Order On Hold' },
            { id: 'offline' as OrderTab,  label: 'Offline Order' },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setOrderTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                orderTab === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Offline sync button */}
        {orderTab === 'offline' && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Offline Orders</h3>
            <button
              onClick={() => toast.success('Synchronisation terminée')}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <RefreshCw className="h-4 w-4" />
              Sync all Orders
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative px-4 py-3 border-b border-gray-100">
          <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder={orderTab === 'offline' ? 'Search Order Id' : 'Search Order Id or Customers.'}
            className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Table header */}
        <div className="grid grid-cols-3 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100">
          <span>Order ID</span>
          <span>Date</span>
          {orderTab !== 'offline' && <span className="text-right">Total Sales</span>}
        </div>

        {/* Rows */}
        <div>
          {tabOrders.map((order) => (
            <button
              key={order.no}
              onClick={() => setSelectedOrderNo(order.no)}
              className={`grid w-full grid-cols-3 gap-4 px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 border-b border-gray-50 ${
                selectedOrderNo === order.no ? 'border border-orange-300 bg-orange-50' : ''
              }`}
            >
              <span className="font-mono text-gray-900 text-xs">#{order.no.slice(-10)}</span>
              <span className="text-gray-500 text-xs">
                {new Date(order.time).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
              </span>
              {orderTab !== 'offline' && (
                <span className="text-right font-semibold text-gray-900">${order.amount.toFixed(2)}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right: order detail */}
      {selectedOrder && (
        <div className="flex w-80 flex-col border-l border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-4">
            <h3 className="text-base font-bold text-gray-900">Order ID #O{selectedOrder.no.slice(-7)}</h3>
            <p className="text-xs text-gray-500">{selectedOrder.operator}</p>
            <p className="text-xs text-gray-500">Dine-In • T-{Math.floor(Math.random() * 34) + 1}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 thin-scrollbar space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-900">Classic Smash Burger</span>
              <span className="font-semibold">${(selectedOrder.amount * 0.3).toFixed(2)}</span>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-900">Spicy Shrimp Soup</span>
                <span className="font-semibold">${(selectedOrder.amount * 0.4).toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400">10% Disc • ${(selectedOrder.amount * 0.04).toFixed(2)} • <span className="line-through">${(selectedOrder.amount * 0.44).toFixed(2)}</span></p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-900">Fried Basil</span>
              <span className="font-semibold">${(selectedOrder.amount * 0.3).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 p-4 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>${(selectedOrder.amount * 0.8).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax</span><span>${(selectedOrder.amount * 0.15).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-orange-500">
              <span>Discount</span><span>-${(selectedOrder.amount * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>Grand Total</span><span>${selectedOrder.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Cash</span><span>${selectedOrder.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Balance</span><span>$0.00</span>
            </div>
          </div>

          <div className="flex gap-2 border-t border-gray-200 p-4">
            {orderTab === 'offline' && (
              <button
                onClick={() => toast.success('Commande synchronisée')}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600"
              >
                <RefreshCw className="h-4 w-4" />
                Sync Order
              </button>
            )}
            <button
              onClick={() => setShowReceiptModal(true)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600"
            >
              <Receipt className="h-4 w-4" />
              Print Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): OrdersView — History/On Hold/Offline tabs with order detail"
```

---

### Task 8: ReportsView, TablesView, SettingsView

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx`

- [ ] **Step 1: Define `ReportsView` — move compliance content from drawer**

```tsx
function ReportsView() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900">Conformité NF525</h2>
          <span className="rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">Certifié</span>
        </div>
        <button
          onClick={generateZReport}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <FileText className="h-4 w-4" />
          Générer Z Caisse
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { id: 'journal'     as ComplianceTab, label: 'Journal',    icon: BookOpen },
          { id: 'history'     as ComplianceTab, label: 'Historique', icon: History },
          { id: 'z_report'    as ComplianceTab, label: 'Z Caisse',   icon: FileText },
          { id: 'attestation' as ComplianceTab, label: 'Attestation',icon: Shield },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setComplianceTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              complianceTab === tab.id ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content — reuse existing compliance tabs from the old drawer */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 thin-scrollbar">
        {/* Journal tab */}
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
                        {ev.ticketNo && <span className="text-orange-600">{ev.ticketNo}</span>}
                      </div>
                      <p className="mt-1 text-xs text-gray-400 font-mono">#{ev.hash}</p>
                    </div>
                    {ev.amount !== undefined && (
                      <span className={`text-sm font-bold ${ev.type === 'cancel' ? 'text-red-600' : 'text-orange-600'}`}>
                        {ev.type === 'cancel' ? '−' : ''}{ev.amount.toFixed(2)}€
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History tab */}
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
                    <span className="text-xs font-bold text-orange-600">{sum.toFixed(2)}€ · {rows.length} tickets</span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    {rows.map((h, i) => (
                      <div key={h.no} className={`flex items-center gap-3 px-4 py-3 text-sm ${i < rows.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <span className="font-mono text-xs text-gray-500 flex-1">{h.no}</span>
                        <span className="text-gray-500">{new Date(h.time).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}</span>
                        <span className="font-bold text-orange-600">{h.amount.toFixed(2)}€</span>
                        <span className="text-xs text-gray-400">{h.method}</span>
                        <span className="text-xs text-gray-400">{h.operator}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Z Report tab */}
        {complianceTab === 'z_report' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'CA Total', value: `${totalCA.toFixed(2)}€`, color: 'text-orange-600' },
                { label: 'Transactions', value: String(salesEvents.length), color: 'text-blue-600' },
                { label: 'Remises', value: String(totalDiscounts), color: 'text-yellow-600' },
                { label: 'Articles offerts', value: String(totalOfferts), color: 'text-purple-600' },
                { label: 'Annulations', value: String(journal.filter(e => e.type === 'cancel').length), color: 'text-red-600' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">SIRET · TVA</p>
              <p className="font-mono text-sm text-gray-700">SIRET : {SIRET}</p>
              <p className="font-mono text-sm text-gray-700">N° TVA : {TVA_NO}</p>
              <p className="font-mono text-sm text-gray-700">{RESTAURANT}</p>
            </div>
          </div>
        )}

        {/* Attestation tab */}
        {complianceTab === 'attestation' && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <Shield className="mx-auto h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Attestation de Conformité</h3>
            <p className="text-sm text-gray-500 mb-4">Ce logiciel est certifié conforme à la norme NF525 pour les logiciels de caisse.</p>
            <div className="rounded-xl bg-gray-50 p-4 font-mono text-xs text-gray-700 text-left space-y-1">
              <p>Éditeur : FoodStack SAS</p>
              <p>Logiciel : FoodStack POS</p>
              <p>Version : 1.0.0</p>
              <p>Certification : NF525 — Afnor</p>
              <p>Date : {new Date().toLocaleDateString('fr-FR')}</p>
              <p>Établissement : {RESTAURANT}</p>
              <p>SIRET : {SIRET}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Define `TablesView` and `SettingsView` placeholders**

```tsx
function TablesView() {
  const tables = Array.from({ length: 20 }, (_, i) => i + 1);
  return (
    <div className="h-full overflow-y-auto bg-white p-6 thin-scrollbar">
      <h2 className="mb-6 text-xl font-bold text-gray-900">Tables</h2>
      <div className="grid grid-cols-5 gap-4">
        {tables.map((n) => (
          <button
            key={n}
            onClick={() => { setTableNumber(n); setActiveView('home'); toast.success(`Table ${n} sélectionnée`); }}
            className={`rounded-2xl border py-8 text-center transition-all hover:shadow-md ${
              tableNumber === n
                ? 'border-orange-400 bg-orange-50 text-orange-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
            }`}
          >
            <LayoutGrid className="mx-auto h-6 w-6 mb-2" />
            <p className="text-sm font-bold">T-{n}</p>
            <p className="text-xs text-gray-400">{tableNumber === n ? 'Actif' : 'Libre'}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="h-full overflow-y-auto bg-white p-6 thin-scrollbar">
      <h2 className="mb-6 text-xl font-bold text-gray-900">Settings</h2>
      <div className="max-w-md space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="font-bold text-gray-900 mb-3">Opérateur actuel</h3>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 font-bold">
              {operator.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{operator}</p>
              <p className="text-xs text-gray-500">Caissier</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="font-bold text-gray-900 mb-3">Restaurant</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>{RESTAURANT}</p>
            <p>{ADDRESS}</p>
            <p>SIRET : {SIRET}</p>
            <p>N° TVA : {TVA_NO}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h3 className="font-bold text-gray-900 mb-3">Personnel autorisé</h3>
          <div className="space-y-2">
            {STAFF_PRESETS.map(s => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{s.name}</span>
                <span className="font-mono text-gray-400">PIN {s.pin}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Remove `showCompliance` state and button** (compliance is now in ReportsView; the old compliance drawer modal can be removed or kept as backup — keep it for now, just remove the NF525 button from old header since the header is replaced)

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): ReportsView, TablesView, SettingsView sub-components"
```

---

### Task 9: Success screen after payment

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx`

The existing `payStep === 'success'` screen was in the right panel. Since `CashierView` handles payment, success should appear as an overlay or the view switches back to home automatically. The `completePayment` already calls `setActiveView('home')` after 4s timeout (added in Task 5). We need to show success feedback in the CashierView itself.

- [ ] **Step 1: Add `paySuccess` state**

```typescript
const [paySuccess, setPaySuccess] = useState(false);
```

- [ ] **Step 2: Update `completePayment` to set `paySuccess = true` then reset after 3s**

In `completePayment` (around line 563), change the end of the function:
```typescript
setLastTicket(ticket);
setTicketCounter((c) => c + 1);
addJournalEvent('sale', `Vente ${no} — ${total.toFixed(2)}€ (${ticket.payMethod})`, total, no);
setPayStep('success');
setPaySuccess(true);
setTimeout(() => {
  setCart([]);
  setPayStep('cart');
  setCashGiven('');
  setTableNumber(null);
  setSplitActive(null);
  setSelectedCustomer(null);
  setCustomerMode('anon');
  setActiveView('home');
  setPaySuccess(false);
  toast.success(`${no} validé · ${total.toFixed(2)}€`);
}, 3000);
```

- [ ] **Step 3: Show success overlay inside `CashierView`**

At the top of `CashierView`, before the return, add:
```tsx
if (paySuccess && lastTicket) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-white p-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500"
      >
        <Check className="h-10 w-10 text-white" strokeWidth={3} />
      </motion.div>
      <h2 className="text-2xl font-black text-gray-900">Paiement accepté</h2>
      <p className="mt-2 text-3xl font-black text-green-500">${lastTicket.total.toFixed(2)}</p>
      <p className="mt-4 text-sm text-gray-400">Ticket n° {lastTicket.no}</p>
      <button
        onClick={() => setShowReceiptModal(true)}
        className="mt-6 flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700 hover:bg-green-100"
      >
        <Receipt className="h-4 w-4" /> Imprimer le ticket
      </button>
      <p className="mt-4 text-xs text-gray-300">Retour automatique dans 3s...</p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): success overlay after payment in CashierView"
```

---

### Task 10: Auth screen — Restro POS styling

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx:633-696`

- [ ] **Step 1: Update auth screen to match Restro POS brand (orange)**

Replace the auth screen return (starting at line 633) with:
```tsx
return (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
    >
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-sm">
          <ShoppingBag className="h-7 w-7 text-white" />
        </div>
        <p className="text-xs font-bold tracking-widest text-gray-500">RESTRO POS</p>
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
        className="mb-4 h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-center text-2xl font-bold tracking-[0.5em] text-gray-900 placeholder:text-gray-300 focus:border-orange-400 focus:bg-white focus:outline-none"
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
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors hover:border-orange-400/50 hover:bg-white"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <User className="h-3.5 w-3.5" />
              </span>
              {s.name}
            </span>
            <span className="font-mono text-xs text-gray-400">PIN {s.pin}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => handleAuth()}
        disabled={pinInput.length < 4}
        className="h-12 w-full rounded-xl bg-orange-500 text-sm font-bold text-white hover:bg-orange-600 transition-colors disabled:opacity-40"
      >
        Valider
      </button>

      <div className="mt-4 text-center">
        <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-900">
          ← Retour au tableau de bord
        </Link>
      </div>
    </motion.div>
  </div>
);
```

- [ ] **Step 2: Remove the old `<Button>` component usage (replaced by plain button)**

- [ ] **Step 3: Commit**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): auth screen — Restro POS orange brand + ShoppingBag icon"
```

---

### Task 11: Final lint pass + push

**Files:**
- Modify: `apps/web/src/app/(dashboard)/pos/page.tsx`

- [ ] **Step 1: Remove unused state variables and imports**

Remove these (no longer used in new layout):
- `showCompliance` / `setShowCompliance` (if compliance drawer modal removed)
- `payStep` / `setPayStep` if fully replaced by `activeView`
- Old `Button` import if not used
- Old `Badge` import if not used

Check which are still referenced and remove only unused ones.

- [ ] **Step 2: Run TypeScript check**
```bash
cd /home/user/foodstack && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -50
```
Fix any type errors.

- [ ] **Step 3: Run lint**
```bash
cd /home/user/foodstack && npx next lint --dir apps/web/src/app/\\(dashboard\\)/pos 2>&1 | head -50
```
Fix any lint errors. **IMPORTANT: never use `eslint-disable-next-line react-hooks/exhaustive-deps`** — use stable refs pattern instead.

- [ ] **Step 4: Final commit + push**
```bash
git add apps/web/src/app/(dashboard)/pos/page.tsx
git commit -m "feat(pos): Restro POS redesign complete — icon nav, product images, all views"
git push -u origin claude/foodstack-setup-libraries-ON7Nc
```

---

## Notes for implementor

- All sub-components (`HomeView`, `CartPanel`, etc.) are defined **inside** `POSPage` function so they can close over all state without prop drilling
- `payStep` state may become vestigial — keep it if `success` overlay still uses it, otherwise remove
- Product images: fetch real Pixabay CDN URLs during Task 1 Step 2 using WebFetch
- Orange color: `bg-orange-500` / `text-orange-500` / `border-orange-400` replaces existing brand-500 in POS page
- The old compliance drawer (`AnimatePresence` / `showCompliance`) can remain as a fallback and be triggered from ReportsView if needed
- `next/image` is NOT used for Pixabay CDN images (domain not in next.config) — use plain `<img>` with onError fallback to emoji
