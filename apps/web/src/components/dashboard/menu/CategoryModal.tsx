'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { MenuCategory } from '@foodstack/shared';

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<MenuCategory>) => void;
  initial?: MenuCategory | null;
}

const EMPTY: Partial<MenuCategory> = {
  name: '',
  description: '',
  isActive: true,
  availableFrom: '',
  availableTo: '',
};

export function CategoryModal({ open, onClose, onSave, initial }: CategoryModalProps) {
  const [form, setForm] = useState<Partial<MenuCategory>>(EMPTY);

  useEffect(() => {
    setForm(initial ? { ...initial } : EMPTY);
  }, [initial, open]);

  const set = (field: keyof MenuCategory, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    onSave(form);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit}>
            {initial ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom"
          required
          placeholder="Ex : Burgers, Pizzas, Desserts…"
          value={form.name ?? ''}
          onChange={(e) => set('name', e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-surface-700">Description</label>
          <textarea
            rows={2}
            placeholder="Description courte (optionnel)"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            className="w-full resize-none rounded-xl border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Disponible à partir de"
            type="time"
            value={form.availableFrom ?? ''}
            onChange={(e) => set('availableFrom', e.target.value)}
          />
          <Input
            label="Disponible jusqu'à"
            type="time"
            value={form.availableTo ?? ''}
            onChange={(e) => set('availableTo', e.target.value)}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-3">
          <div
            onClick={() => set('isActive', !form.isActive)}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${form.isActive ? 'bg-brand-500' : 'bg-surface-300'}`}
          >
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </div>
          <span className="text-sm font-medium text-surface-700">Catégorie active</span>
        </label>
      </form>
    </Modal>
  );
}
