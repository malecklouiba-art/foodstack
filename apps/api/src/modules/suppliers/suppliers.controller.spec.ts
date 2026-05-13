import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import * as request from 'supertest';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const mockSuppliersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('SuppliersController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        { provide: SuppliersService, useValue: mockSuppliersService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── GET /suppliers ──────────────────────────────────────────────────────────

  describe('GET /suppliers', () => {
    it('returns 200 and an array of suppliers for restaurantId', async () => {
      const suppliers = [
        { id: 'sup-1', name: 'Acme Foods', restaurantId: 'rest-1' },
        { id: 'sup-2', name: 'Best Produce', restaurantId: 'rest-1' },
      ];
      mockSuppliersService.findAll.mockResolvedValue(suppliers);

      const res = await request(app.getHttpServer())
        .get('/suppliers?restaurantId=rest-1')
        .expect(200);

      expect(res.body).toEqual(suppliers);
      expect(mockSuppliersService.findAll).toHaveBeenCalledWith('rest-1');
    });
  });

  // ─── GET /suppliers/:id ──────────────────────────────────────────────────────

  describe('GET /suppliers/:id', () => {
    it('returns 200 and the supplier when found', async () => {
      const supplier = { id: 'sup-1', name: 'Acme Foods', restaurantId: 'rest-1' };
      mockSuppliersService.findOne.mockResolvedValue(supplier);

      const res = await request(app.getHttpServer())
        .get('/suppliers/sup-1')
        .expect(200);

      expect(res.body).toEqual(supplier);
      expect(mockSuppliersService.findOne).toHaveBeenCalledWith('sup-1');
    });

    it('returns 404 when service throws NotFoundException', async () => {
      mockSuppliersService.findOne.mockRejectedValue(
        new NotFoundException('Supplier not found'),
      );

      await request(app.getHttpServer())
        .get('/suppliers/missing-id')
        .expect(404);
    });
  });

  // ─── POST /suppliers ─────────────────────────────────────────────────────────

  describe('POST /suppliers', () => {
    it('returns 201 and the created supplier', async () => {
      const body = {
        restaurantId: 'rest-1',
        name: 'Acme Foods',
        email: 'acme@example.com',
        phone: '555-1234',
      };
      const created = { id: 'sup-1', ...body };
      mockSuppliersService.create.mockResolvedValue(created);

      const res = await request(app.getHttpServer())
        .post('/suppliers')
        .send(body)
        .expect(201);

      expect(res.body).toEqual(created);
      expect(mockSuppliersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ restaurantId: 'rest-1', name: 'Acme Foods' }),
      );
    });
  });

  // ─── PATCH /suppliers/:id ────────────────────────────────────────────────────

  describe('PATCH /suppliers/:id', () => {
    it('returns 200 and the updated supplier', async () => {
      const updated = { id: 'sup-1', name: 'Acme Foods Updated', restaurantId: 'rest-1' };
      mockSuppliersService.update.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch('/suppliers/sup-1')
        .send({ name: 'Acme Foods Updated' })
        .expect(200);

      expect(res.body).toEqual(updated);
      expect(mockSuppliersService.update).toHaveBeenCalledWith(
        'sup-1',
        expect.objectContaining({ name: 'Acme Foods Updated' }),
      );
    });
  });

  // ─── DELETE /suppliers/:id ───────────────────────────────────────────────────

  describe('DELETE /suppliers/:id', () => {
    it('returns 200 on successful delete', async () => {
      const deleted = { id: 'sup-1', name: 'Acme Foods', restaurantId: 'rest-1' };
      mockSuppliersService.remove.mockResolvedValue(deleted);

      const res = await request(app.getHttpServer())
        .delete('/suppliers/sup-1')
        .expect(200);

      expect(res.body).toEqual(deleted);
      expect(mockSuppliersService.remove).toHaveBeenCalledWith('sup-1');
    });
  });
});
