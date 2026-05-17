export type NotificationType = 'order_update' | 'order_new' | 'order_status' | 'low_stock' | 'promo' | 'system';

export type NotificationChannel = 'push' | 'email' | 'sms';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  sentAt: Date;
  readAt?: Date;
  createdAt: Date;
}
