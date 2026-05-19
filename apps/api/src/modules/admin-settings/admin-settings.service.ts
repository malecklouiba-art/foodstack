import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminSettingsService {
  private readonly store = new Map<string, Record<string, unknown>>([
    ['general', {
      appName: 'FoodStack',
      tagline: 'La plateforme de gestion de restaurant tout-en-un',
      supportEmail: 'support@foodstack.fr',
      contactPhone: '+33 1 23 45 67 89',
      website: 'https://foodstack.fr',
      vatNumber: '',
      companyName: 'FoodStack SAS',
      address: '',
    }],
    ['stripe', { publicKey: '', secretKey: '', webhookSecret: '', testMode: true }],
    ['smtp', { host: '', port: '587', user: '', pass: '', from: 'no-reply@foodstack.fr' }],
    ['security', { jwtExpiry: '7d', require2FA: false, maxLoginAttempts: 5 }],
    ['appearance', { primaryColor: '#1EFF6A', logoUrl: '', faviconUrl: '' }],
  ]);

  getSection(key: string) {
    const cfg = { ...(this.store.get(key) ?? {}) } as Record<string, unknown>;
    if (key === 'stripe' && cfg.secretKey) cfg.secretKey = '';
    if (key === 'smtp' && cfg.pass) cfg.pass = '';
    return cfg;
  }

  saveSection(key: string, data: Record<string, unknown>) {
    const existing = this.store.get(key) ?? {};
    const merged: Record<string, unknown> = { ...existing, ...data };
    // Don't overwrite secrets with empty strings sent from redacted frontend
    if (key === 'stripe' && !data.secretKey) merged.secretKey = existing.secretKey ?? '';
    if (key === 'smtp' && !data.pass) merged.pass = existing.pass ?? '';
    this.store.set(key, merged);
    const result = { ...merged };
    if (key === 'stripe') result.secretKey = '';
    if (key === 'smtp') result.pass = '';
    return result;
  }

  // Convenience aliases used by the controller
  getGeneral()                             { return this.getSection('general'); }
  saveGeneral(d: Record<string, unknown>)  { return this.saveSection('general', d); }
  getStripe()                              { return this.getSection('stripe'); }
  saveStripe(d: Record<string, unknown>)   { return this.saveSection('stripe', d); }
  getSmtp()                                { return this.getSection('smtp'); }
  saveSmtp(d: Record<string, unknown>)     { return this.saveSection('smtp', d); }
  getSecurity()                            { return this.getSection('security'); }
  saveSecurity(d: Record<string, unknown>) { return this.saveSection('security', d); }
  getAppearance()                          { return this.getSection('appearance'); }
  saveAppearance(d: Record<string, unknown>){ return this.saveSection('appearance', d); }
}
