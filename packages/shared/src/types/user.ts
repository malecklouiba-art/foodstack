export type UserRole = 'super_admin' | 'restaurant_owner' | 'staff' | 'driver' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  restaurantIds?: string[];
  loyaltyPoints?: number;
  loyaltyTier?: LoyaltyTier;
  createdAt: Date;
  updatedAt: Date;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export const LOYALTY_TIERS: Record<LoyaltyTier, { minPoints: number; multiplier: number }> = {
  bronze: { minPoints: 0, multiplier: 1 },
  silver: { minPoints: 500, multiplier: 1.25 },
  gold: { minPoints: 1000, multiplier: 1.5 },
  platinum: { minPoints: 2500, multiplier: 2 },
};
