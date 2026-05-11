'use client';

import { useRef } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface Category {
  id: string;
  label: string;
  count: number;
}

interface CategoryFilterProps {
  categories: Category[];
  active: string;
  onChange: (id: string) => void;
}

export function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={clsx(
            'relative flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
            active === cat.id
              ? 'bg-surface-900 text-white'
              : 'bg-white text-surface-600 border border-surface-200 hover:border-surface-300 hover:text-surface-900'
          )}
        >
          {active === cat.id && (
            <motion.div
              layoutId="category-active"
              className="absolute inset-0 rounded-xl bg-surface-900"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative">
            {cat.label}
            <span className={clsx('ml-1.5 text-xs', active === cat.id ? 'text-white/60' : 'text-surface-400')}>
              {cat.count}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
