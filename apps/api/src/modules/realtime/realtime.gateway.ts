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

export type DriverLocationEvent = {
  driverId: string;
  orderId: string;
  lat: number;
  lng: number;
  heading?: number;
};

export type DeliveryEvent = {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  driverId: string;
  status: string;
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

  // ── Driver room subscriptions ───────────────────────────────────────────

  @SubscribeMessage('driver:join')
  handleDriverJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() driverId: string,
  ) {
    client.join(`driver:${driverId}`);
    client.join('drivers:available');
    this.logger.log(`Driver ${driverId} joined available pool`);
    return { event: 'driver:joined', data: driverId };
  }

  @SubscribeMessage('driver:leave')
  handleDriverLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() driverId: string,
  ) {
    client.leave('drivers:available');
    this.logger.log(`Driver ${driverId} left available pool`);
    return { event: 'driver:left', data: driverId };
  }

  @SubscribeMessage('driver:location_update')
  handleDriverLocation(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: DriverLocationEvent,
  ) {
    // Forward live position to customer tracking the order
    this.server.to(`order:${payload.orderId}`).emit('driver:location', payload);
  }

  @SubscribeMessage('delivery:accepted')
  handleDeliveryAccepted(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: DeliveryEvent,
  ) {
    this.server
      .to(`restaurant:${payload.restaurantId}`)
      .emit('delivery:accepted', payload);
    this.server
      .to(`order:${payload.orderId}`)
      .emit('order:status_updated', { ...payload, status: 'delivering' });
  }

  @SubscribeMessage('delivery:status_update')
  handleDeliveryStatus(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: DeliveryEvent,
  ) {
    this.server
      .to(`restaurant:${payload.restaurantId}`)
      .emit('order:status_updated', payload);
    this.server
      .to(`order:${payload.orderId}`)
      .emit('order:status_updated', payload);
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

  emitOrderReady(payload: OrderEvent) {
    // Broadcast to all online drivers
    this.server.to('drivers:available').emit('order:available', payload);
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
