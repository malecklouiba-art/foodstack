import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway, OrderStatusEvent, InventoryAlertEvent } from './events.gateway';

// ---------------------------------------------------------------------------
// Mock Socket.io primitives
// ---------------------------------------------------------------------------
const mockEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
const mockServer = { to: mockTo } as any;

function mockClient(id = 'socket-1') {
  return {
    id,
    join: jest.fn(),
    leave: jest.fn(),
  } as any;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function buildGateway(): Promise<EventsGateway> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [EventsGateway],
  }).compile();

  const gateway = module.get<EventsGateway>(EventsGateway);
  // Inject mock server (normally set by the WebSocket adapter at runtime)
  gateway.server = mockServer;
  return gateway;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('EventsGateway', () => {
  let gateway: EventsGateway;

  beforeEach(async () => {
    jest.clearAllMocks();
    gateway = await buildGateway();
  });

  // -------------------------------------------------------------------------
  // handleConnection / handleDisconnect
  // -------------------------------------------------------------------------
  describe('handleConnection', () => {
    it('does not throw when a client connects', () => {
      expect(() => gateway.handleConnection(mockClient('conn-1'))).not.toThrow();
    });
  });

  describe('handleDisconnect', () => {
    it('does not throw when a client disconnects', () => {
      expect(() => gateway.handleDisconnect(mockClient('disc-1'))).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // handleJoinRestaurant
  // -------------------------------------------------------------------------
  describe('handleJoinRestaurant', () => {
    it('makes the client join the restaurant room', () => {
      const client = mockClient();

      gateway.handleJoinRestaurant('rest-42', client);

      expect(client.join).toHaveBeenCalledWith('restaurant:rest-42');
    });

    it('returns success and the room name', () => {
      const result = gateway.handleJoinRestaurant('rest-42', mockClient());

      expect(result).toEqual({ success: true, room: 'restaurant:rest-42' });
    });
  });

  // -------------------------------------------------------------------------
  // handleJoinOrder
  // -------------------------------------------------------------------------
  describe('handleJoinOrder', () => {
    it('makes the client join the order room', () => {
      const client = mockClient();

      gateway.handleJoinOrder('order-99', client);

      expect(client.join).toHaveBeenCalledWith('order:order-99');
    });

    it('returns success and the order room name', () => {
      const result = gateway.handleJoinOrder('order-99', mockClient());

      expect(result).toEqual({ success: true, room: 'order:order-99' });
    });
  });

  // -------------------------------------------------------------------------
  // handleLeaveRestaurant
  // -------------------------------------------------------------------------
  describe('handleLeaveRestaurant', () => {
    it('makes the client leave the restaurant room', () => {
      const client = mockClient();

      gateway.handleLeaveRestaurant('rest-42', client);

      expect(client.leave).toHaveBeenCalledWith('restaurant:rest-42');
    });
  });

  // -------------------------------------------------------------------------
  // emitNewOrder
  // -------------------------------------------------------------------------
  describe('emitNewOrder', () => {
    it('emits to the correct restaurant room', () => {
      const order = { id: 'ord-1', total: 25.5 };

      gateway.emitNewOrder('rest-7', order);

      expect(mockTo).toHaveBeenCalledWith('restaurant:rest-7');
    });

    it('emits with the order:new event and the order payload', () => {
      const order = { id: 'ord-1', total: 25.5 };

      gateway.emitNewOrder('rest-7', order);

      expect(mockEmit).toHaveBeenCalledWith('order:new', order);
    });
  });

  // -------------------------------------------------------------------------
  // emitOrderStatusUpdate
  // -------------------------------------------------------------------------
  describe('emitOrderStatusUpdate', () => {
    const event: OrderStatusEvent = {
      orderId: 'ord-55',
      restaurantId: 'rest-3',
      status: 'READY',
      updatedAt: new Date().toISOString(),
    };

    it('emits to the restaurant room', () => {
      gateway.emitOrderStatusUpdate(event);

      expect(mockTo).toHaveBeenCalledWith('restaurant:rest-3');
    });

    it('emits to the order room', () => {
      gateway.emitOrderStatusUpdate(event);

      expect(mockTo).toHaveBeenCalledWith('order:ord-55');
    });

    it('uses the order:status event name for both rooms', () => {
      gateway.emitOrderStatusUpdate(event);

      expect(mockEmit).toHaveBeenCalledTimes(2);
      for (const [eventName] of mockEmit.mock.calls) {
        expect(eventName).toBe('order:status');
      }
    });

    it('passes the full event object in both emits', () => {
      gateway.emitOrderStatusUpdate(event);

      for (const [, payload] of mockEmit.mock.calls) {
        expect(payload).toEqual(event);
      }
    });
  });

  // -------------------------------------------------------------------------
  // emitInventoryAlert
  // -------------------------------------------------------------------------
  describe('emitInventoryAlert', () => {
    const alert: InventoryAlertEvent = {
      restaurantId: 'rest-10',
      itemId: 'item-5',
      itemName: 'Burger Buns',
      currentStock: 3,
      minStock: 10,
    };

    it('emits to the correct restaurant room', () => {
      gateway.emitInventoryAlert(alert);

      expect(mockTo).toHaveBeenCalledWith('restaurant:rest-10');
    });

    it('emits with the inventory:alert event and the alert payload', () => {
      gateway.emitInventoryAlert(alert);

      expect(mockEmit).toHaveBeenCalledWith('inventory:alert', alert);
    });
  });

  // -------------------------------------------------------------------------
  // emitDriverLocation
  // -------------------------------------------------------------------------
  describe('emitDriverLocation', () => {
    it('emits to the order room (not the driver room)', () => {
      gateway.emitDriverLocation('driver-1', 'ord-77', 51.5, -0.1);

      expect(mockTo).toHaveBeenCalledWith('order:ord-77');
      expect(mockTo).not.toHaveBeenCalledWith('driver:driver-1');
    });

    it('emits with the driver:location event name', () => {
      gateway.emitDriverLocation('driver-1', 'ord-77', 51.5, -0.1);

      expect(mockEmit.mock.calls[0][0]).toBe('driver:location');
    });

    it('includes driverId, lat, and lng in the payload', () => {
      gateway.emitDriverLocation('driver-1', 'ord-77', 51.5074, -0.1278);

      const payload = mockEmit.mock.calls[0][1];
      expect(payload).toMatchObject({ driverId: 'driver-1', lat: 51.5074, lng: -0.1278 });
    });

    it('includes a timestamp in the payload', () => {
      gateway.emitDriverLocation('driver-1', 'ord-77', 51.5, -0.1);

      const payload = mockEmit.mock.calls[0][1];
      expect(payload.timestamp).toBeInstanceOf(Date);
    });
  });
});
