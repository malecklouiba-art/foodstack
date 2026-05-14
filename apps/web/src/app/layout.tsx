import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'FoodStack — Unified Retail & Delivery Platform',
    template: '%s | FoodStack',
  },
  description:
    'Comprehensive POS, inventory management, online ordering, and delivery tracking platform for restaurants and retail businesses.',
  keywords: ['POS', 'restaurant management', 'delivery tracking', 'inventory', 'online ordering'],
  authors: [{ name: 'FoodStack' }],
  creator: 'FoodStack',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    alternateLocale: 'en_US',
    siteName: 'FoodStack',
    title: 'FoodStack — Unified Retail & Delivery Platform',
    description: 'Streamline your restaurant operations with our all-in-one platform.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FoodStack — Unified Retail & Delivery Platform',
    description: 'Streamline your restaurant operations with our all-in-one platform.',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1EFF6A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#18181b',
              color: '#fafafa',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#1EFF6A', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
