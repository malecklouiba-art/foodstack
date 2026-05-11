'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, Tag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/Button';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, subtotal, deliveryFee, tax, total } = useCartStore();

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-glass-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-100 px-6 py-5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-500" />
                <h2 className="text-lg font-semibold text-surface-900">
                  Mon panier
                  {items.length > 0 && (
                    <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                      {items.length}
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 thin-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
                    <ShoppingBag className="h-8 w-8 text-surface-300" />
                  </div>
                  <p className="text-surface-600 font-medium">Votre panier est vide</p>
                  <p className="mt-1 text-sm text-surface-400">Ajoutez des plats depuis le menu</p>
                  <Button variant="ghost" size="sm" className="mt-4" onClick={onClose}>
                    Parcourir le menu
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 32, height: 0 }}
                        className="flex gap-3 rounded-xl border border-surface-100 p-3"
                      >
                        {/* Image */}
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-surface-100 text-2xl">
                          🍔
                        </div>

                        {/* Details */}
                        <div className="flex flex-1 flex-col min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-medium text-surface-900">{item.name}</p>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="flex-shrink-0 rounded p-0.5 text-surface-300 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {item.modifiers && item.modifiers.length > 0 && (
                            <p className="mt-0.5 text-xs text-surface-400">
                              {item.modifiers.map((m) => m.name).join(', ')}
                            </p>
                          )}

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-lg border border-surface-200">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1.5 text-surface-500 hover:text-surface-900"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="min-w-[20px] text-center text-sm font-medium text-surface-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 text-surface-500 hover:text-surface-900"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="font-semibold text-surface-900">
                              {(item.price * item.quantity).toFixed(2)}€
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-surface-100 px-6 py-5">
                {/* Promo code */}
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-surface-200 p-3 text-sm text-surface-500">
                  <Tag className="h-4 w-4" />
                  <span>Ajouter un code promo</span>
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>Sous-total</span>
                    <span>{subtotal().toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>Livraison</span>
                    <span>
                      {deliveryFee() === 0 ? (
                        <span className="text-green-600 font-medium">Gratuite</span>
                      ) : (
                        `${deliveryFee().toFixed(2)}€`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-surface-600">
                    <span>TVA (10%)</span>
                    <span>{tax().toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between border-t border-surface-100 pt-2 text-base font-bold text-surface-900">
                    <span>Total</span>
                    <span>{total().toFixed(2)}€</span>
                  </div>
                </div>

                <Link href="/checkout" onClick={onClose}>
                  <Button fullWidth size="lg" className="mt-4 gap-3">
                    Commander maintenant
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>

                {subtotal() < 30 && (
                  <p className="mt-2 text-center text-xs text-surface-400">
                    Encore {(30 - subtotal()).toFixed(2)}€ pour la livraison gratuite !
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
