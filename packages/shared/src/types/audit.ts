export interface AuditLog {
  id: string;
  userId?: string;
  action: string; // "order.created" | "payment.processed" | "user.deleted" etc.
  resource?: string;
  resourceId?: string;
  entityType?: string; // "Order" | "User" | "Restaurant"
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ip?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
