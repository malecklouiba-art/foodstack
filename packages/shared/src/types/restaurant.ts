export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  address: RestaurantAddress;
  phone: string;
  email: string;
  website?: string;
  siret?: string;
  tva?: string;
  categories: string[];
  businessHours: BusinessHours;
  settings: RestaurantSettings;
  isActive: boolean;
  isOpen: boolean;
  rating?: number;
  reviewCount?: number;
  ownerId: string;
  staffIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RestaurantAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface BusinessHours {
  monday: DayHours | null;
  tuesday: DayHours | null;
  wednesday: DayHours | null;
  thursday: DayHours | null;
  friday: DayHours | null;
  saturday: DayHours | null;
  sunday: DayHours | null;
}

export interface DayHours {
  open: string;
  close: string;
  breaks?: { start: string; end: string }[];
}

export interface RestaurantSettings {
  deliveryEnabled: boolean;
  deliveryRadius: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minOrderAmount: number;
  estimatedPrepTime: number;
  acceptsReservations: boolean;
  acceptsCash: boolean;
  taxRate: number;
  currency: string;
  loyaltyEnabled: boolean;
  pointsPerEuro: number;
}
