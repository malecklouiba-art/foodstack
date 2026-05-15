'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { MenuItem, MenuCategory, DietaryTag } from '@foodstack/shared';

interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<MenuItem>) => void;
  initial?: MenuItem | null;
  categories: MenuCategory[];
}

const DIETARY_OPTIONS: { value: DietaryTag; label: string; emoji: string }[] = [
  { value: 'vegetarian', label: 'Végétarien', emoji: '🥦' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'gluten_free', label: 'Sans gluten', emoji: '🌾' },
  { value: 'halal', label: 'Halal', emoji: '☪️' },
  { value: 'kosher', label: 'Casher', emoji: '✡️' },
  { value: 'dairy_free', label: 'Sans lactose', emoji: '🥛' },
  { value: 'nut_free', label: 'Sans noix', emoji: '🥜' },
  { value: 'spicy', label: 'Épicé', emoji: '🌶️' },
];

const ALLERGEN_OPTIONS = [
  'Gluten', 'Crustacés', 'Oeufs', 'Poissons', 'Arachides',
  'Soja', 'Lait', 'Fruits à coques', 'Céleri', 'Moutarde',
  'Graines de sésame', 'Anhydride sulfureux', 'Lupin', 'Mollusques',
];

const EMPTY: Partial<MenuItem> = {
  name: '',
  description: '',
  price: 0,
  compareAtPrice: undefined,
  calories: undefined,
  prepTime: 10,
  dietaryTags: [],
  allergens: [],
  isActive: true,
  isFeatured: false,
  categoryId: '',
};

export function ItemModal({ open, onClose, onSave, initial, categories }: ItemModalProps) {
  const [form, setForm] = useState<Partial<MenuItem>>(EMPTY);
  const [priceStr, setPriceStr] = useState('0');
  const [compareStr, setCompareStr] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({ ...initial });
      setPriceStr(initial.price.toFixed(2));
      setCompareStr(initial.compareAtPrice?.toFixed(2) ?? '');
    } else {
      setForm({ ...EMPTY, categoryId: categories[0]?.id ?? '' });
      setPriceStr('0');
      setCompareStr('');
    }
  }, [initial, open, categories]);

  const set = (field: keyof MenuItem, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  function toggleDietary(tag: DietaryTag) {
    const tags = form.dietaryTags ?? [];
    set('dietaryTags', tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  }

  function handleFile(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      set('image', reader.result as string);
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  }

  function toggleAllergen(allergen: string) {
    const list = form.allergens ?? [];
    set('allergens', list.includes(allergen) ? list.filter((a) => a !== allergen) : [...list, allergen]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim() || !form.categoryId) return;
    const price = parseFloat(priceStr) || 0;
    const compareAtPrice = compareStr ? parseFloat(compareStr) : undefined;
    onSave({ ...form, price, compareAtPrice });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier l\'article' : 'Nouvel article'}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit}>
            {initial ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name + Category */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nom de l'article"
            required
            placeholder="Ex : Classic Burger"
            value={form.name ?? ''}
            onChange={(e) => set('name', e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-700">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <select
              value={form.categoryId ?? ''}
              onChange={(e) => set('categoryId', e.target.value)}
              className="h-10 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="" disabled>Choisir une catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700">Description</label>
          <textarea
            rows={2}
            placeholder="Décrivez l'article, ses ingrédients…"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            className="w-full resize-none rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Prices + Prep + Calories */}
        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-700">Prix (€) <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              className="h-10 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-700">Prix barré (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="—"
              value={compareStr}
              onChange={(e) => setCompareStr(e.target.value)}
              className="h-10 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-700">Calories</label>
            <input
              type="number"
              min="0"
              placeholder="kcal"
              value={form.calories ?? ''}
              onChange={(e) => set('calories', e.target.value ? parseInt(e.target.value) : undefined)}
              className="h-10 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-surface-700">Préparation (min)</label>
            <input
              type="number"
              min="1"
              value={form.prepTime ?? 10}
              onChange={(e) => set('prepTime', parseInt(e.target.value) || 10)}
              className="h-10 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Image upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700">Image de l'article</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {form.image ? (
            <div className="relative h-40 w-full overflow-hidden rounded-xl border border-surface-200 bg-surface-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.image} alt="Aperçu" className="h-full w-full object-cover" />
              <div className="absolute right-2 top-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-medium text-surface-700 shadow hover:bg-white"
                >
                  Remplacer
                </button>
                <button
                  type="button"
                  onClick={() => set('image', undefined)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-red-500 shadow hover:bg-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 bg-surface-50 text-surface-500 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
            >
              {uploading ? (
                <>
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  <span className="text-sm">Chargement…</span>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Upload className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">Cliquez ou glissez une image</span>
                  <span className="text-xs text-surface-400">PNG, JPG, WebP — démo locale</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Dietary tags */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-surface-700">Tags alimentaires</label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => {
              const active = (form.dietaryTags ?? []).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleDietary(opt.value)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 ${
                    active
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Allergens */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-surface-700">Allergènes</label>
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((a) => {
              const active = (form.allergens ?? []).includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 ${
                    active
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300 hover:bg-surface-50'
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => set('isActive', !form.isActive)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${form.isActive ? 'bg-brand-500' : 'bg-surface-300'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-surface-700">Article actif</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => set('isFeatured', !form.isFeatured)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${form.isFeatured ? 'bg-yellow-400' : 'bg-surface-300'}`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${form.isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-surface-700">Mis en avant ⭐</span>
          </label>
        </div>
      </form>
    </Modal>
  );
}
