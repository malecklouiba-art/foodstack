jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('otplib', () => ({
  __esModule: true,
  generateSecret: jest.fn().mockReturnValue('TOTP_SECRET'),
  generateURI: jest.fn().mockReturnValue('otpauth://totp/FoodStack:test@example.com?secret=TOTP_SECRET'),
  verify: jest.fn().mockResolvedValue({ valid: true }),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

jest.mock('passport-google-oauth20', () => ({
  Profile: class {},
  Strategy: class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const otplib = require('otplib');

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Jean',
  lastName: 'Dupont',
  passwordHash: 'hashed',
  role: 'customer' as any,
  phone: null as any,
  avatar: null as any,
  isActive: true,
  emailVerified: false,
  loyaltyPoints: 0,
  loyaltyTier: 'bronze' as any,
  googleId: null as any,
  twoFactorSecret: null as any,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let prismaService: { user: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, fallback?: string) => {
              if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
              if (key === 'JWT_REFRESH_EXPIRES_IN') return fallback ?? '7d';
              if (key === 'APP_NAME') return fallback ?? 'FoodStack';
              return fallback;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.sign.mockReturnValue('mock-token');
    configService.get.mockImplementation((key: string, fallback?: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return fallback ?? '7d';
      if (key === 'APP_NAME') return fallback ?? 'FoodStack';
      return fallback;
    });
  });

  // ─── validateUser ─────────────────────────────────────────────────────────

  describe('validateUser', () => {
    it('should return user without passwordHash when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toMatchObject({ id: 'user-1', email: 'test@example.com' });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser('unknown@example.com', 'password'))
        .rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'wrongpassword'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw with message "Identifiants invalides" when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser('unknown@example.com', 'password'))
        .rejects.toThrow('Identifiants invalides');
    });

    it('should throw with message "Identifiants invalides" on wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser('test@example.com', 'wrong'))
        .rejects.toThrow('Identifiants invalides');
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should return accessToken, refreshToken and user', async () => {
      const { passwordHash: _, ...user } = mockUser;
      const result = await service.login(user);

      expect(result).toHaveProperty('accessToken', 'mock-token');
      expect(result).toHaveProperty('refreshToken', 'mock-token');
      expect(result).toHaveProperty('user', user);
    });

    it('should sign JWT with correct payload', async () => {
      const { passwordHash: _, ...user } = mockUser;
      await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'customer',
      });
    });

    it('should sign refresh token with refresh secret', async () => {
      const { passwordHash: _, ...user } = mockUser;
      await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-1' }),
        expect.objectContaining({ secret: 'refresh-secret' }),
      );
    });
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'Jean Dupont',
      email: 'jean@example.com',
      password: 'password123',
      phone: '0600000000',
    };

    beforeEach(() => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as any);
    });

    it('should create user and return tokens on successful registration', async () => {
      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('jean@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'jean@example.com',
          firstName: 'Jean',
          lastName: 'Dupont',
        }),
        'hashed',
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto))
        .rejects.toThrow(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException with message "Email déjà utilisé"', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto))
        .rejects.toThrow('Email déjà utilisé');
    });

    it('should handle single-word name (no last name)', async () => {
      const dto: RegisterDto = { ...registerDto, name: 'Jean' };

      await service.register(dto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Jean', lastName: '' }),
        'hashed',
      );
    });

    it('should handle multi-word last name', async () => {
      const dto: RegisterDto = { ...registerDto, name: 'Jean Pierre Dupont' };

      await service.register(dto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Jean', lastName: 'Pierre Dupont' }),
        'hashed',
      );
    });

    it('should return user data without passwordHash', async () => {
      const result = await service.register(registerDto);
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  // ─── refreshToken ─────────────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const payload = { sub: 'user-1', email: 'test@example.com', role: 'customer' };
      jwtService.verify.mockReturnValue(payload);
      usersService.findById.mockResolvedValue(mockUser as any);

      const result = await service.refreshToken('valid-refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token', {
        secret: 'refresh-secret',
      });
      expect(usersService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refreshToken('invalid-token'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with correct message on invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('expired');
      });

      await expect(service.refreshToken('expired-token'))
        .rejects.toThrow('Token de rafraîchissement invalide');
    });

    it('should throw UnauthorizedException when user no longer exists', async () => {
      const payload = { sub: 'user-1', email: 'test@example.com', role: 'customer' };
      jwtService.verify.mockReturnValue(payload);
      usersService.findById.mockResolvedValue(null as any);

      await expect(service.refreshToken('valid-token'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── googleLogin ──────────────────────────────────────────────────────────

  describe('googleLogin', () => {
    const googleProfile: any = {
      id: 'google-123',
      emails: [{ value: 'google@example.com' }],
      displayName: 'Google User',
      name: { givenName: 'Google', familyName: 'User' },
    };

    it('should create new user when not found by googleId or email', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(null) // findUnique by googleId
        .mockResolvedValueOnce(null); // findUnique by email
      prismaService.user.create.mockResolvedValue({
        ...mockUser,
        email: 'google@example.com',
        googleId: 'google-123',
        emailVerified: true,
      });

      const result = await service.googleLogin(googleProfile);

      expect(prismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'google@example.com',
            googleId: 'google-123',
            emailVerified: true,
          }),
        }),
      );
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });

    it('should link google id to existing email account', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(null) // findUnique by googleId
        .mockResolvedValueOnce(mockUser); // findUnique by email
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        googleId: 'google-123',
      });

      const result = await service.googleLogin(googleProfile);

      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { googleId: 'google-123' },
        }),
      );
      expect(result).toHaveProperty('access_token');
    });

    it('should return existing user when found by googleId', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        googleId: 'google-123',
      });

      const result = await service.googleLogin(googleProfile);

      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
    });

    it('should throw BadRequestException when no email in profile', async () => {
      const profileWithoutEmail: any = {
        id: 'google-123',
        emails: [],
        displayName: 'No Email',
        name: { givenName: 'No', familyName: 'Email' },
      };

      await expect(service.googleLogin(profileWithoutEmail))
        .rejects.toThrow(BadRequestException);
    });

    it('should return user without passwordHash and twoFactorSecret', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        googleId: 'google-123',
        twoFactorSecret: 'some-secret',
      });

      const result = await service.googleLogin(googleProfile);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('twoFactorSecret');
    });
  });

  // ─── generate2FASecret ────────────────────────────────────────────────────

  describe('generate2FASecret', () => {
    it('should generate TOTP secret and QR code for existing user', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: 'TOTP_SECRET',
      });

      const result = await service.generate2FASecret('user-1');

      expect(otplib.generateSecret).toHaveBeenCalled();
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { twoFactorSecret: 'TOTP_SECRET' },
      });
      expect(result).toHaveProperty('secret', 'TOTP_SECRET');
      expect(result).toHaveProperty('qrCodeUrl', 'data:image/png;base64,mock');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.generate2FASecret('unknown-id'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── enable2FA ────────────────────────────────────────────────────────────

  describe('enable2FA', () => {
    it('should enable 2FA when token is valid', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: 'TOTP_SECRET',
      });
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
      });
      (otplib.verify as jest.Mock).mockResolvedValue({ valid: true });

      const result = await service.enable2FA('user-1', '123456');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { twoFactorEnabled: true },
      });
      expect(result).toEqual({ message: '2FA enabled successfully' });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.enable2FA('unknown-id', '123456'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when 2FA secret not generated', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: null,
      });

      await expect(service.enable2FA('user-1', '123456'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when TOTP token is invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: 'TOTP_SECRET',
      });
      (otplib.verify as jest.Mock).mockResolvedValue({ valid: false });

      await expect(service.enable2FA('user-1', 'wrong-token'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ─── verify2FA ────────────────────────────────────────────────────────────

  describe('verify2FA', () => {
    it('should return { valid: true } when token is correct', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: 'TOTP_SECRET',
      });
      (otplib.verify as jest.Mock).mockResolvedValue({ valid: true });

      const result = await service.verify2FA('user-1', '123456');

      expect(result).toEqual({ valid: true });
    });

    it('should return { valid: false } when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.verify2FA('unknown-id', '123456');

      expect(result).toEqual({ valid: false });
    });

    it('should return { valid: false } when user has no 2FA secret', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: null,
      });

      const result = await service.verify2FA('user-1', '123456');

      expect(result).toEqual({ valid: false });
    });

    it('should return { valid: false } when token is incorrect', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: 'TOTP_SECRET',
      });
      (otplib.verify as jest.Mock).mockResolvedValue({ valid: false });

      const result = await service.verify2FA('user-1', 'wrong');

      expect(result).toEqual({ valid: false });
    });
  });

  // ─── disable2FA ───────────────────────────────────────────────────────────

  describe('disable2FA', () => {
    it('should disable 2FA for existing user', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'TOTP_SECRET',
      });
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });

      const result = await service.disable2FA('user-1');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });
      expect(result).toEqual({ message: '2FA disabled successfully' });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.disable2FA('unknown-id'))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
