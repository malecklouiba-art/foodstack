export type TableStatus = 'free' | 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface RestaurantTable {
  id: string;
  restaurantId: string;
  number: number;
  capacity: number;
  section: string;
  status: TableStatus;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}
