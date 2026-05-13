import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { generateSecret as otpGenerateSecret, generateURI as otpGenerateURI, verify as otpVerify } from 'otplib';
import * as qrcode from 'qrcode';
import { Profile } from 'passport-google-oauth20';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Identifiants invalides');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Identifiants invalides');

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
      user,
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email déjà utilisé');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const [firstName, ...rest] = dto.name.trim().split(' ');
    const lastName = rest.join(' ') || '';
    const user = await this.usersService.create(
      { email: dto.email, firstName, lastName, password: dto.password, phone: dto.phone },
      passwordHash,
    );

    const { passwordHash: _, ...result } = user;
    return this.login(result);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.login(user);
    } catch {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  // ─── Google OAuth ─────────────────────────────────────────────

  async googleLogin(profile: Profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new BadRequestException('No email returned from Google');

    // Try find by googleId first, then by email
    let user = await this.prisma.user.findUnique({ where: { googleId: profile.id } });

    if (!user) {
      user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        // Link google id to existing account
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id },
        });
      } else {
        // Create new user via Google OAuth
        user = await this.prisma.user.create({
          data: {
            email,
            googleId: profile.id,
            firstName: profile.name?.givenName ?? profile.displayName ?? '',
            lastName: profile.name?.familyName ?? '',
            passwordHash: await bcrypt.hash(Math.random().toString(36), 12),
            emailVerified: true,
          },
        });
      }
    }

    const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { access_token: accessToken, user: safeUser };
  }

  // ─── 2FA TOTP ─────────────────────────────────────────────────

  async generate2FASecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const secret = otpGenerateSecret();
    const appName = this.config.get<string>('APP_NAME', 'FoodStack');
    const otpAuthUrl = otpGenerateURI({ issuer: appName, label: user.email, secret });

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);
    return { secret, qrCodeUrl };
  }

  async enable2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA secret not generated. Call /auth/2fa/generate first.');
    }

    const result = await otpVerify({ token, secret: user.twoFactorSecret });
    if (!result.valid) throw new BadRequestException('Invalid 2FA token');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: '2FA enabled successfully' };
  }

  async verify2FA(userId: string, token: string): Promise<{ valid: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) return { valid: false };

    const result = await otpVerify({ token, secret: user.twoFactorSecret });
    return { valid: result.valid };
  }

  async disable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return { message: '2FA disabled successfully' };
  }
}
