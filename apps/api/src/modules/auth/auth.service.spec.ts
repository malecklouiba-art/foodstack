import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

// ---------------------------------------------------------------------------
// bcryptjs mock — declared before the module is loaded by NestJS DI
// ---------------------------------------------------------------------------
const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();

jest.mock('bcryptjs', () => ({
  compare: (...args: unknown[]) => mockBcryptCompare(...args),
  hash: (...args: unknown[]) => mockBcryptHash(...args),
}));

// ---------------------------------------------------------------------------
// Dependency mocks
// ---------------------------------------------------------------------------
const mockUsersService = {
  findByEmail: jest.fn(),
  findByEmailWithHash: jest.fn(),
  findByIdWithRefreshHash: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  getRestaurantIds: jest.fn(),
  updateUser: jest.fn().mockResolvedValue({}),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockNotifications = {
  sendWelcome: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // validateUser()
  // ---------------------------------------------------------------------------
  describe('validateUser', () => {
    it('should return user without passwordHash when credentials match', async () => {
      const storedUser = {
        id: 'user_1',
        email: 'jean@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'customer',
        passwordHash: 'hashed_secret',
      };
      mockUsersService.findByEmailWithHash.mockResolvedValue(storedUser);
      mockBcryptCompare.mockResolvedValue(true);

      const result = await service.validateUser('jean@example.com', 'plaintext');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toMatchObject({
        id: 'user_1',
        email: 'jean@example.com',
        role: 'customer',
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUsersService.findByEmailWithHash.mockResolvedValue(null);

      await expect(service.validateUser('ghost@example.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      mockUsersService.findByEmailWithHash.mockResolvedValue({
        id: 'user_2',
        email: 'user@example.com',
        passwordHash: 'hashed_wrong',
      });
      mockBcryptCompare.mockResolvedValue(false);

      await expect(service.validateUser('user@example.com', 'wrong_pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // register()
  // ---------------------------------------------------------------------------
  describe('register', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing', email: 'taken@example.com' });

      await expect(
        service.register({ name: 'Existing User', email: 'taken@example.com', password: 'pass1234' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash the password with bcrypt (not store plaintext)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('bcrypt_hashed_pw');
      const createdUser = {
        id: 'new_user',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'customer',
        passwordHash: 'bcrypt_hashed_pw',
      };
      mockUsersService.create.mockResolvedValue(createdUser);
      mockUsersService.getRestaurantIds.mockResolvedValue([]);
      mockJwtService.sign.mockReturnValue('token_value');

      await service.register({ name: 'New User', email: 'new@example.com', password: 'plaintext_pw' });

      expect(mockBcryptHash).toHaveBeenCalledWith('plaintext_pw', 12);
      // The hashed value should be passed to create, NOT the plaintext
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com' }),
        'bcrypt_hashed_pw',
      );
    });

    it('should split dto.name into firstName and lastName', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed');
      const createdUser = {
        id: 'user_split',
        email: 'split@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'customer',
        passwordHash: 'hashed',
      };
      mockUsersService.create.mockResolvedValue(createdUser);
      mockUsersService.getRestaurantIds.mockResolvedValue([]);
      mockJwtService.sign.mockReturnValue('tok');

      await service.register({ name: 'Jean Dupont', email: 'split@example.com', password: 'pass1234' });

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Jean', lastName: 'Dupont' }),
        'hashed',
      );
    });

    it('should return accessToken and refreshToken on success', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed');
      const createdUser = {
        id: 'user_tok',
        email: 'tok@example.com',
        firstName: 'Marie',
        lastName: '',
        role: 'customer',
        passwordHash: 'hashed',
      };
      mockUsersService.create.mockResolvedValue(createdUser);
      mockUsersService.getRestaurantIds.mockResolvedValue([]);
      mockJwtService.sign
        .mockReturnValueOnce('access_token_value')
        .mockReturnValueOnce('refresh_token_value');

      const result = await service.register({
        name: 'Marie',
        email: 'tok@example.com',
        password: 'pass1234',
      });

      expect(result).toHaveProperty('accessToken', 'access_token_value');
      expect(result).toHaveProperty('refreshToken', 'refresh_token_value');
    });

    it('should NOT pass a role field to usersService.create', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockBcryptHash.mockResolvedValue('hashed');
      const createdUser = {
        id: 'user_norole',
        email: 'norole@example.com',
        firstName: 'No',
        lastName: 'Role',
        role: 'customer',
        passwordHash: 'hashed',
      };
      mockUsersService.create.mockResolvedValue(createdUser);
      mockUsersService.getRestaurantIds.mockResolvedValue([]);
      mockJwtService.sign.mockReturnValue('token');

      await service.register({ name: 'No Role', email: 'norole@example.com', password: 'pass1234' });

      const [createDtoArg] = mockUsersService.create.mock.calls[0];
      expect(createDtoArg).not.toHaveProperty('role');
    });
  });

  // ---------------------------------------------------------------------------
  // refreshToken()
  // ---------------------------------------------------------------------------
  describe('refreshToken', () => {
    it('should throw UnauthorizedException when token is invalid or expired', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refreshToken('bad.token.here')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new tokens when refresh token is valid', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user_refresh', email: 'r@example.com', role: 'customer' });
      const foundUser = {
        id: 'user_refresh',
        email: 'r@example.com',
        firstName: 'Refresh',
        lastName: 'User',
        role: 'customer',
        refreshTokenHash: '$hashed$',
      };
      mockUsersService.findByIdWithRefreshHash.mockResolvedValue(foundUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockUsersService.getRestaurantIds.mockResolvedValue([]);
      mockJwtService.sign
        .mockReturnValueOnce('new_access_token')
        .mockReturnValueOnce('new_refresh_token');

      const result = await service.refreshToken('valid.refresh.token');

      expect(result).toHaveProperty('accessToken', 'new_access_token');
      expect(result).toHaveProperty('refreshToken', 'new_refresh_token');
    });

    it('should throw UnauthorizedException when stored hash does not match', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'user_tampered', email: 'x@example.com', role: 'customer' });
      mockUsersService.findByIdWithRefreshHash.mockResolvedValue({
        id: 'user_tampered', refreshTokenHash: '$stored$',
      });
      mockBcryptCompare.mockResolvedValue(false);

      await expect(service.refreshToken('tampered.token')).rejects.toThrow(UnauthorizedException);
    });

    it('should use JWT_REFRESH_SECRET when verifying the refresh token', async () => {
      mockConfigService.get.mockReturnValue('my_refresh_secret');
      mockJwtService.verify.mockReturnValue({ sub: 'user_secret_check', email: 'x@example.com', role: 'customer' });
      const foundUser = { id: 'user_secret_check', email: 'x@example.com', role: 'customer', refreshTokenHash: '$h$' };
      mockUsersService.findByIdWithRefreshHash.mockResolvedValue(foundUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockUsersService.getRestaurantIds.mockResolvedValue([]);
      mockJwtService.sign.mockReturnValue('tok');

      await service.refreshToken('some.valid.token');

      expect(mockJwtService.verify).toHaveBeenCalledWith(
        'some.valid.token',
        expect.objectContaining({ secret: 'my_refresh_secret' }),
      );
    });
  });
});
