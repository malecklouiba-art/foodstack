export type DietaryTag = 'vegetarian' | 'vegan' | 'gluten_free' | 'halal' | 'kosher' | 'dairy_free' | 'nut_free' | 'spicy';

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  image?: string;
  position: number;
  isActive: boolean;
  availableFrom?: string;
  availableTo?: string;
}

export interface MenuModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: MenuModifierOption[];
}

export interface MenuModifierOption {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  calories?: number;
  allergens: string[];
  dietaryTags: DietaryTag[];
  modifierGroups: MenuModifierGroup[];
  prepTime: number;
  isActive: boolean;
  isFeatured: boolean;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Menu {
  id: string;
  restaurantId: string;
  categories: MenuCategory[];
  items: MenuItem[];
}
