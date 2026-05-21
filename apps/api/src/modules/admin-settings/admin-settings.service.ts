import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const DEFAULTS: Record<string, Record<string, unknown>> = {
  general: {
    appName: 'FoodStack',
    tagline: 'La plateforme de gestion de restaurant tout-en-un',
    supportEmail: 'support@foodstack.fr',
    contactPhone: '+33 1 23 45 67 89',
    website: 'https://foodstack.fr',
    vatNumber: '',
    companyName: 'FoodStack SAS',
    address: '',
  },
  stripe: { publicKey: '', secretKey: '', webhookSecret: '', testMode: true },
  smtp: { host: '', port: '587', user: '', pass: '', from: 'no-reply@foodstack.fr' },
  security: { jwtExpiry: '7d', require2FA: false, maxLoginAttempts: 5 },
  appearance: { primaryColor: '#1EFF6A', logoUrl: '', faviconUrl: '' },
};

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSection(key: string): Promise<Record<string, unknown>> {
    const row = await this.prisma.adminSetting.findUnique({ where: { key } });
    const cfg = { ...(DEFAULTS[key] ?? {}), ...(row?.value as Record<string, unknown> ?? {}) };
    if (key === 'stripe' && cfg.secretKey) cfg.secretKey = '';
    if (key === 'smtp' && cfg.pass) cfg.pass = '';
    return cfg;
  }

  async saveSection(key: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const raw = await this.getRaw(key);
    const existing: Record<string, unknown> = { ...(DEFAULTS[key] ?? {}), ...(raw ?? {}) };
    const merged: Record<string, unknown> = { ...existing, ...data };

    // Don't overwrite secrets with empty strings sent from redacted frontend
    if (key === 'stripe' && !data.secretKey) merged.secretKey = existing.secretKey ?? '';
    if (key === 'smtp' && !data.pass) merged.pass = existing.pass ?? '';

    await this.prisma.adminSetting.upsert({
      where: { key },
      create: { key, value: merged as any },
      update: { value: merged as any },
    });

    const result = { ...merged };
    if (key === 'stripe') result.secretKey = '';
    if (key === 'smtp') result.pass = '';
    return result;
  }

  private async getRaw(key: string): Promise<Record<string, unknown> | null> {
    const row = await this.prisma.adminSetting.findUnique({ where: { key } });
    return row ? (row.value as Record<string, unknown>) : null;
  }

  async getGeneral()                              { return this.getSection('general'); }
  async saveGeneral(d: Record<string, unknown>)   { return this.saveSection('general', d); }
  async getStripe()                               { return this.getSection('stripe'); }
  async saveStripe(d: Record<string, unknown>)    { return this.saveSection('stripe', d); }
  async getSmtp()                                 { return this.getSection('smtp'); }
  async saveSmtp(d: Record<string, unknown>)      { return this.saveSection('smtp', d); }
  async getSecurity()                             { return this.getSection('security'); }
  async saveSecurity(d: Record<string, unknown>)  { return this.saveSection('security', d); }
  async getAppearance()                           { return this.getSection('appearance'); }
  async saveAppearance(d: Record<string, unknown>){ return this.saveSection('appearance', d); }
}
