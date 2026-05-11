'use client';

import { useState } from 'react';
import { Plus, Star, Clock, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { useCartStore } from '@/store/cart';

interface MenuItem {
  id: string;
  menuItemId: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
  rating: number;
  reviewCount: number;
  prepTime: number;
  tags: string[];
  allergens: string[];
  calories: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  onCartOpen?: () => void;
}

const tagVariants: Record<string, 'brand' | 'success' | 'warning' | 'danger' | 'info'> = {
  Bestseller: 'brand',
  Populaire: 'brand',
  Premium: 'info',
  Nouveau: 'success',
  Végétarien: 'success',
  Vegan: 'success',
  Healthy: 'success',
  Maison: 'default',
  Épicé: 'danger',
  Frais: 'info',
  'Sans alcool': 'default',
};

export function MenuItemCard({ item, onCartOpen }: MenuItemCardProps) {
  const [adding, setAdding] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    setAdding(true);
    addItem({
      id: `${item.menuItemId}-${Date.now()}`,
      menuItemId: item.menuItemId,
      restaurantId: item.restaurantId,
      name: item.name,
      price: item.price,
      image: item.image ?? undefined,
    });
    toast.success(`${item.name} ajouté au panier !`);
    setTimeout(() => setAdding(false), 600);
    onCartOpen?.();
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Image area */}
      <div className="relative h-44 bg-gradient-to-br from-surface-100 to-surface-200 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">
            {item.category === 'burgers' ? '🍔' :
             item.category === 'pizza' ? '🍕' :
             item.category === 'salads' ? '🥗' :
             item.category === 'sides' ? '🍟' :
             item.category === 'drinks' ? '🥤' :
             item.category === 'desserts' ? '🍮' : '🍽️'}
          </div>
        )}
        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant={tagVariants[tag] ?? 'default'} size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {/* Calories */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-surface-900/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
          {item.calories} kcal
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-surface-900 leading-tight">{item.name}</h3>
          <span className="flex-shrink-0 font-bold text-brand-600">
            {item.price.toFixed(2)}€
          </span>
        </div>

        <p className="mt-1.5 line-clamp-2 text-xs text-surface-500 leading-relaxed">
          {item.description}
        </p>

        <div className="mt-3 flex items-center gap-3 text-xs text-surface-400">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-brand-400 text-brand-400" />
            <span className="font-medium text-surface-700">{item.rating}</span>
            <span>({item.reviewCount})</span>
          </span>
          <span className="h-0.5 w-0.5 rounded-full bg-surface-300" />
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.prepTime} min
          </span>
        </div>

        {item.allergens.length > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-surface-400">
            <Info className="h-3 w-3" />
            <span className="capitalize">{item.allergens.join(', ')}</span>
          </div>
        )}

        <div className="mt-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={adding}
            className={clsx(
              'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-200',
              adding
                ? 'bg-green-500 text-white'
                : 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand'
            )}
          >
            {adding ? (
              <>✓ Ajouté</>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Ajouter au panier
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
