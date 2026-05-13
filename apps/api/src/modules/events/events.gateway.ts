import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface OrderStatusEvent {
  orderId: string;
  restaurantId: string;
  status: string;
  updatedAt: string;
}

export interface InventoryAlertEvent {
  restaurantId: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  minStock: number;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:restaurant')
  handleJoinRestaurant(
    @MessageBody() restaurantId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`restaurant:${restaurantId}`);
    this.logger.log(`Client ${client.id} joined restaurant:${restaurantId}`);
    return { success: true, room: `restaurant:${restaurantId}` };
  }

  @SubscribeMessage('join:order')
  handleJoinOrder(
    @MessageBody() orderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`order:${orderId}`);
    this.logger.log(`Client ${client.id} joined order:${orderId}`);
    return { success: true, room: `order:${orderId}` };
  }

  @SubscribeMessage('leave:restaurant')
  handleLeaveRestaurant(
    @MessageBody() restaurantId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`restaurant:${restaurantId}`);
  }

  emitOrderStatusUpdate(event: OrderStatusEvent) {
    this.server.to(`restaurant:${event.restaurantId}`).emit('order:status', event);
    this.server.to(`order:${event.orderId}`).emit('order:status', event);
  }

  emitNewOrder(restaurantId: string, order: Record<string, unknown>) {
    this.server.to(`restaurant:${restaurantId}`).emit('order:new', order);
  }

  emitInventoryAlert(event: InventoryAlertEvent) {
    this.server.to(`restaurant:${event.restaurantId}`).emit('inventory:alert', event);
  }

  emitDriverLocation(driverId: string, orderId: string, lat: number, lng: number) {
    this.server
      .to(`order:${orderId}`)
      .emit('driver:location', { driverId, lat, lng, timestamp: new Date() });
  }
}
