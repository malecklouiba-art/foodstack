export type SubscriptionPlan = 'starter' | 'growth' | 'pro' | 'enterprise';

export type SubscriptionStatus = 'active' | 'past_due' | 'suspended' | 'cancelled' | 'trialing';

export interface Subscription {
  id: string;
  restaurantId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeSubId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
