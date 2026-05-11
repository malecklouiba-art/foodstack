export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderType = 'delivery' | 'pickup' | 'dine_in';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'card' | 'cash' | 'apple_pay' | 'google_pay' | 'loyalty_points';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: OrderModifier[];
  notes?: string;
  subtotal: number;
}

export interface OrderModifier {
  id: string;
  name: string;
  price: number;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  floor?: string;
  doorCode?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  customerId: string;
  driverId?: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  deliveryAddress?: DeliveryAddress;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  loyaltyPointsUsed: number;
  loyaltyPointsEarned: number;
  total: number;
  notes?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}
