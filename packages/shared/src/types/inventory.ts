export interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  sku?: string;
  category: string;
  currentStock: number;
  unit: InventoryUnit;
  minStock: number;
  maxStock?: number;
  costPerUnit: number;
  supplierId?: string;
  linkedMenuItems?: string[];
  lastRestockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type InventoryUnit = 'kg' | 'g' | 'L' | 'mL' | 'units' | 'boxes' | 'bottles' | 'portions';

export type StockStatus = 'ok' | 'low' | 'critical' | 'out_of_stock';

export interface Supplier {
  id: string;
  restaurantId: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'restock' | 'usage' | 'waste' | 'adjustment' | 'return';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  userId: string;
  createdAt: Date;
}
