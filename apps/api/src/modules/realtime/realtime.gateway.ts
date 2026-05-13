import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export type OrderEvent = {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  status: string;
  customerId?: string;
  total?: number;
  itemCount?: number;
};

export type InventoryEvent = {
  itemId: string;
  name: string;
  restaurantId: string;
  currentStock: number;
  minStock: number;
};

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Room subscriptions ──────────────────────────────────────────────────

  @SubscribeMessage('restaurant:join')
  handleJoinRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() restaurantId: string,
  ) {
    client.join(`restaurant:${restaurantId}`);
    this.logger.log(`Client ${client.id} joined restaurant:${restaurantId}`);
    return { event: 'restaurant:joined', data: restaurantId };
  }

  @SubscribeMessage('restaurant:leave')
  handleLeaveRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() restaurantId: string,
  ) {
    client.leave(`restaurant:${restaurantId}`);
    return { event: 'restaurant:left', data: restaurantId };
  }

  @SubscribeMessage('order:track')
  handleTrackOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() orderId: string,
  ) {
    client.join(`order:${orderId}`);
    return { event: 'order:tracking', data: orderId };
  }

  @SubscribeMessage('order:untrack')
  handleUntrackOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() orderId: string,
  ) {
    client.leave(`order:${orderId}`);
    return { event: 'order:untracked', data: orderId };
  }

  // ── Emit helpers (called by services) ──────────────────────────────────

  emitOrderCreated(payload: OrderEvent) {
    this.server
      .to(`restaurant:${payload.restaurantId}`)
      .emit('order:created', payload);
  }

  emitOrderStatusUpdated(payload: OrderEvent) {
    // Notify restaurant dashboard
    this.server
      .to(`restaurant:${payload.restaurantId}`)
      .emit('order:status_updated', payload);
    // Notify the customer tracking that specific order
    this.server
      .to(`order:${payload.orderId}`)
      .emit('order:status_updated', payload);
  }

  emitInventoryLowStock(payload: InventoryEvent) {
    this.server
      .to(`restaurant:${payload.restaurantId}`)
      .emit('inventory:low_stock', payload);
  }

  emitInventoryUpdated(payload: InventoryEvent) {
    this.server
      .to(`restaurant:${payload.restaurantId}`)
      .emit('inventory:updated', payload);
  }
}
