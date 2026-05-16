export type Locale = 'fr' | 'en';
export const DEFAULT_LOCALE: Locale = 'fr';
export const SUPPORTED_LOCALES: Locale[] = ['fr', 'en'];
export const LOCALE_COOKIE = 'fs_locale';

export async function getMessages(locale: Locale) {
  return (await import(`../../messages/${locale}.json`)).default;
}
