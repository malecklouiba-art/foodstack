'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ShoppingBag, UtensilsCrossed, Users, Bike, Truck, Package,
  CreditCard, BarChart3, TableIcon, MapPin, Tag, Settings,
  ArrowLeft, Store, Loader2,
} from 'lucide-react';
import { RestaurantProvider } from '@/contexts/restaurant-context';
import api from '@/lib/api';

// ── Lazy-load each tab (avoids one giant bundle) ─────────────────────────────
const OrdersTab    = dynamic(() => import('../../orders/page'),    { ssr: false, loading: () => <TabLoader /> });
const MenuTab      = dynamic(() => import('../../menu/page'),      { ssr: false, loading: () => <TabLoader /> });
const StaffTab     = dynamic(() => import('../../staff/page'),     { ssr: false, loading: () => <TabLoader /> });
const DriversTab   = dynamic(() => import('../../drivers/page'),   { ssr: false, loading: () => <TabLoader /> });
const DeliveryTab  = dynamic(() => import('../../delivery/page'),  { ssr: false, loading: () => <TabLoader /> });
const InventoryTab = dynamic(() => import('../../inventory/page'), { ssr: false, loading: () => <TabLoader /> });
const CustomersTab = dynamic(() => import('../../customers/page'), { ssr: false, loading: () => <TabLoader /> });
const PaymentsTab  = dynamic(() => import('../../payments/page'),  { ssr: false, loading: () => <TabLoader /> });
const AnalyticsTab = dynamic(() => import('../../analytics/page'), { ssr: false, loading: () => <TabLoader /> });
const TablesTab    = dynamic(() => import('../../tables/page'),    { ssr: false, loading: () => <TabLoader /> });
const ZonesTab     = dynamic(() => import('../../zones/page'),     { ssr: false, loading: () => <TabLoader /> });
const CouponsTab   = dynamic(() => import('../../coupons/page'),   { ssr: false, loading: () => <TabLoader /> });
const SettingsTab  = dynamic(() => import('../../settings/page'),  { ssr: false, loading: () => <TabLoader /> });

function TabLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────────────────────
type TabKey =
  | 'commandes' | 'menu' | 'staff' | 'livreurs' | 'livraisons'
  | 'inventaire' | 'clients' | 'paiements' | 'analytiques'
  | 'tables' | 'zones' | 'coupons' | 'parametres';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'commandes',   label: 'Commandes',   icon: ShoppingBag    },
  { key: 'menu',        label: 'Menu',        icon: UtensilsCrossed },
  { key: 'staff',       label: 'Personnel',   icon: Users          },
  { key: 'livreurs',    label: 'Livreurs',    icon: Bike           },
  { key: 'livraisons',  label: 'Livraisons',  icon: Truck          },
  { key: 'inventaire',  label: 'Inventaire',  icon: Package        },
  { key: 'clients',     label: 'Clients',     icon: Users          },
  { key: 'paiements',   label: 'Paiements',   icon: CreditCard     },
  { key: 'analytiques', label: 'Analytiques', icon: BarChart3      },
  { key: 'tables',      label: 'Tables',      icon: TableIcon      },
  { key: 'zones',       label: 'Zones',       icon: MapPin         },
  { key: 'coupons',     label: 'Codes Promo', icon: Tag            },
  { key: 'parametres',  label: 'Paramètres',  icon: Settings       },
];

// ── Page ─────────────────────────────────────────────────────────────────────
export default function RestaurantHubPage({ params }: { params: { id: string } }) {
  const restaurantId = params.id;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('commandes');
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => {
    if (!restaurantId) return;
    (api.get(`/restaurants/${restaurantId}`) as Promise<{ name: string }>)
      .then((r) => { if (r?.name) setRestaurantName(r.name); })
      .catch(() => {});
  }, [restaurantId]);

  function renderTab() {
    switch (activeTab) {
      case 'commandes':   return <OrdersTab />;
      case 'menu':        return <MenuTab />;
      case 'staff':       return <StaffTab />;
      case 'livreurs':    return <DriversTab />;
      case 'livraisons':  return <DeliveryTab />;
      case 'inventaire':  return <InventoryTab />;
      case 'clients':     return <CustomersTab />;
      case 'paiements':   return <PaymentsTab />;
      case 'analytiques': return <AnalyticsTab />;
      case 'tables':      return <TablesTab />;
      case 'zones':       return <ZonesTab />;
      case 'coupons':     return <CouponsTab />;
      case 'parametres':  return <SettingsTab />;
      default:            return null;
    }
  }

  return (
    <RestaurantProvider id={restaurantId}>
      <div className="flex h-full flex-col overflow-hidden">

        {/* Breadcrumb header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-surface-100 bg-white px-6 py-3 dark:border-surface-700 dark:bg-surface-800">
          <button
            onClick={() => router.push('/dashboard/restaurants')}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-surface-500 hover:bg-surface-100 hover:text-surface-900 transition-colors dark:hover:bg-surface-700 dark:hover:text-surface-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Restaurants
          </button>
          <span className="text-surface-300 dark:text-surface-600">/</span>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
              <Store className="h-3.5 w-3.5 text-brand-600" />
            </div>
            <span className="text-sm font-semibold text-surface-900 dark:text-white">
              {restaurantName || restaurantId}
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex shrink-0 overflow-x-auto border-b border-surface-100 bg-white px-2 dark:border-surface-700 dark:bg-surface-800 no-scrollbar">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === key
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-surface-500 hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {renderTab()}
        </div>

      </div>
    </RestaurantProvider>
  );
}
