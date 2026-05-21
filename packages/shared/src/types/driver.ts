export interface Driver {
  id: string;
  userId: string;
  restaurantId: string;
  vehicleType: 'bike' | 'scooter' | 'car';
  vehiclePlate?: string;
  latitude?: number;
  longitude?: number;
  currentLat?: number;
  currentLng?: number;
  lastSeenAt?: Date;
  isAvailable: boolean;
  isOnline: boolean;
  totalDeliveries: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}
