'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Menu as MenuIcon,
  X,
  Bell,
  User,
  ChevronDown,
  Star,
  LogOut,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useCartStore } from '@/store/cart';

const navLinks = [
  { href: '/menu', label: 'Menu' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/offers', label: 'Offres' },
  { href: '/track', label: 'Suivi' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const cartCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-surface-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand shadow-brand">
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <span className="text-lg font-bold text-surface-900">FoodStack</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-surface-500 hover:bg-surface-100">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
          </button>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-surface-500 hover:bg-surface-100"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-surface-100"
            >
              <Avatar name="Jean Dupont" size="sm" />
              <ChevronDown className="h-3.5 w-3.5 text-surface-400" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-glass-lg"
                >
                  <div className="border-b border-surface-100 p-3">
                    <p className="text-sm font-semibold text-surface-900">Jean Dupont</p>
                    <p className="text-xs text-surface-400">jean@exemple.fr</p>
                    <div className="mt-2 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-brand-500" />
                      <span className="text-xs font-medium text-surface-700">450 points fidélité</span>
                    </div>
                  </div>
                  <div className="p-1.5">
                    {[
                      { href: '/profile', icon: User, label: 'Mon Profil' },
                      { href: '/orders', icon: ShoppingCart, label: 'Mes Commandes' },
                      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                      { href: '/settings', icon: Settings, label: 'Paramètres' },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-surface-700 transition-colors hover:bg-surface-100"
                      >
                        <item.icon className="h-4 w-4 text-surface-400" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-surface-100 p-1.5">
                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50">
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="ml-1 rounded-lg p-2 text-surface-500 hover:bg-surface-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-surface-200 bg-white md:hidden"
          >
            <nav className="space-y-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'flex rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive(link.href)
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-surface-600 hover:bg-surface-100'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
