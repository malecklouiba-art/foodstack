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
    ['notifications', {}],
    ['security', {}],
    ['appearance', {}],
  ]);

  getGeneral() {
    return this.store.get('general') ?? {};
  }

  saveGeneral(data: Record<string, unknown>) {
    this.store.set('general', { ...this.store.get('general'), ...data });
    return this.store.get('general');
  }

  getStripe() {
    const cfg = { ...(this.store.get('stripe') ?? {}) } as Record<string, unknown>;
    cfg.secretKey = '';
    return cfg;
  }

  saveStripe(data: Record<string, unknown>) {
    const existing = this.store.get('stripe') ?? {};
    const merged = {
      ...existing,
      ...data,
      secretKey: (data.secretKey as string) || (existing.secretKey as string) || '',
    };
    this.store.set('stripe', merged);
    return { ...merged, secretKey: '' };
  }
}
