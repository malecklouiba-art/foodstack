'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Download,
  Copy,
  Printer,
  Check,
  Globe,
  TableProperties,
  ChevronDown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

const RESTAURANT_ID = 'REST_001';
const RESTAURANT_NAME = 'Le Gourmet Paris';
const MENU_BASE_URL = 'https://foodstack.app/menu';

type Tab = 'menu' | 'tables';
type QRSize = 128 | 256 | 512;
type QRBg = 'white' | 'black' | 'brand';

const BG_MAP: Record<QRBg, { bg: string; fg: string; label: string; swatch: string }> = {
  white: { bg: '#ffffff', fg: '#18181b', label: 'Blanc',  swatch: 'bg-white border border-surface-200' },
  black: { bg: '#18181b', fg: '#ffffff', label: 'Noir',   swatch: 'bg-zinc-900' },
  brand: { bg: '#f97316', fg: '#ffffff', label: 'Brand',  swatch: 'bg-orange-500' },
};

const SIZE_OPTIONS: { value: QRSize; label: string }[] = [
  { value: 128, label: '128 px – Petit' },
  { value: 256, label: '256 px – Moyen' },
  { value: 512, label: '512 px – Grand' },
];

const TABLE_COUNT = 12;

function menuUrl(tableId?: number): string {
  const base = `${MENU_BASE_URL}?r=${RESTAURANT_ID}`;
  return tableId !== undefined ? `${base}&t=TABLE_${tableId}` : base;
}

function downloadQR(id: string, filename: string) {
  const svg = document.getElementById(id) as SVGSVGElement | null;
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function useCopyToast() {
  const [copied, setCopied] = useState(false);

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return { copied, copy };
}

// ─── Menu Tab ────────────────────────────────────────────────────────────────

function MenuTab() {
  const [bg, setBg] = useState<QRBg>('white');
  const [size, setSize] = useState<QRSize>(256);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const { copied, copy } = useCopyToast();

  const url = menuUrl();
  const colors = BG_MAP[bg];

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <Card padding="md">
        <div className="flex items-start gap-3">
          <Globe className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50">
              Partagez votre menu en ligne via QR Code
            </p>
            <p className="mt-1 text-sm text-surface-500">
              Imprimez ce QR code et affichez-le dans votre restaurant. Vos clients pourront
              consulter votre menu directement depuis leur téléphone.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* QR Preview Card */}
        <Card padding="lg" className="flex flex-col items-center gap-6">
          {/* QR Code */}
          <div
            className="rounded-2xl p-6 shadow-md transition-all"
            style={{ backgroundColor: colors.bg }}
          >
            <QRCodeSVG
              id="qr-menu"
              value={url}
              size={size}
              bgColor={colors.bg}
              fgColor={colors.fg}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Info */}
          <div className="w-full space-y-1 text-center">
            <p className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {RESTAURANT_NAME}
            </p>
            <p className="break-all text-xs text-surface-400">{url}</p>
          </div>

          {/* Action buttons */}
          <div className="flex w-full flex-wrap gap-3 justify-center">
            <button
              onClick={() => downloadQR('qr-menu', `qr-menu-${RESTAURANT_ID}.svg`)}
              className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95"
            >
              <Download className="h-4 w-4" />
              Télécharger SVG
            </button>
            <button
              onClick={() => copy(url)}
              className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 shadow-sm transition-all hover:bg-surface-50 active:scale-95 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copier le lien
                </>
              )}
            </button>
          </div>
        </Card>

        {/* Customization + Print */}
        <div className="space-y-4">
          <Card padding="md">
            <CardHeader className="mb-4">
              <CardTitle>Personnaliser</CardTitle>
            </CardHeader>

            {/* Background color */}
            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                Couleur de fond
              </p>
              <div className="flex gap-3">
                {(Object.entries(BG_MAP) as [QRBg, typeof BG_MAP[QRBg]][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setBg(key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                      bg === key
                        ? 'ring-2 ring-orange-500 ring-offset-2'
                        : 'hover:bg-surface-50 dark:hover:bg-surface-700'
                    }`}
                  >
                    <span className={`h-8 w-8 rounded-lg ${val.swatch}`} />
                    <span className="text-xs text-surface-600 dark:text-surface-400">
                      {val.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size select */}
            <div>
              <p className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                Taille
              </p>
              <div className="relative">
                <button
                  onClick={() => setShowSizeMenu((s) => !s)}
                  className="flex w-full items-center justify-between rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-800 transition-all hover:border-surface-300 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
                >
                  {SIZE_OPTIONS.find((s) => s.value === size)?.label}
                  <ChevronDown
                    className={`h-4 w-4 text-surface-400 transition-transform ${showSizeMenu ? 'rotate-180' : ''}`}
                  />
                </button>
                {showSizeMenu && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800">
                    {SIZE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSize(opt.value);
                          setShowSizeMenu(false);
                        }}
                        className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-surface-50 dark:hover:bg-surface-700 ${
                          size === opt.value
                            ? 'text-orange-500 font-medium'
                            : 'text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {opt.label}
                        {size === opt.value && <Check className="ml-auto h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Print */}
          <Card padding="md">
            <p className="mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">
              Impression
            </p>
            <p className="mb-4 text-xs text-surface-500">
              Ouvre la fenêtre d&apos;impression de votre navigateur. Le QR code sera centré sur la
              page.
            </p>
            <button
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-all hover:bg-surface-50 active:scale-95 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700 print:hidden"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Tables Tab ───────────────────────────────────────────────────────────────

function TableQRCard({ tableNumber }: { tableNumber: number }) {
  const url = menuUrl(tableNumber);
  const id = `qr-table-${tableNumber}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: tableNumber * 0.03 }}
    >
      <Card padding="sm" hover className="flex flex-col items-center gap-3">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <QRCodeSVG
            id={id}
            value={url}
            size={128}
            bgColor="#ffffff"
            fgColor="#18181b"
            level="H"
            includeMargin={false}
          />
        </div>
        <p className="text-sm font-semibold text-surface-800 dark:text-surface-100">
          Table {tableNumber}
        </p>
        <button
          onClick={() => downloadQR(id, `qr-table-${tableNumber}.svg`)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-600 transition-all hover:bg-surface-100 active:scale-95 dark:border-surface-700 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600"
        >
          <Download className="h-3.5 w-3.5" />
          Télécharger
        </button>
      </Card>
    </motion.div>
  );
}

function TablesTab() {
  const [toast, setToast] = useState(false);

  function handleDownloadAll() {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
    // Trigger individual downloads with staggered delay
    Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).forEach((n, idx) => {
      setTimeout(() => {
        downloadQR(`qr-table-${n}`, `qr-table-${n}.svg`);
      }, idx * 200);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableProperties className="h-5 w-5 text-orange-500" />
          <p className="font-medium text-surface-900 dark:text-surface-50">
            {TABLE_COUNT} tables configurées
          </p>
        </div>
        <div className="relative">
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95"
          >
            <Download className="h-4 w-4" />
            Télécharger tous
          </button>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-xl bg-zinc-800 px-3 py-2 text-xs text-white shadow-lg"
            >
              Téléchargement en cours…
            </motion.div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map((n) => (
          <TableQRCard key={n} tableNumber={n} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function QRCodesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('menu');

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #qr-menu, #qr-menu * { visibility: visible; }
          #qr-menu {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>

      <div className="space-y-6 p-6">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
              <QrCode className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                Codes QR
              </h1>
              <p className="text-sm text-surface-500">
                Générez et gérez vos QR codes pour le menu et les tables
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setActiveTab(activeTab === 'menu' ? 'tables' : 'menu')
            }
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95"
          >
            <QrCode className="h-4 w-4" />
            Générer un QR Code
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1 dark:border-surface-700 dark:bg-surface-800/50 w-fit">
          {(
            [
              { key: 'menu' as Tab, label: 'Menu en ligne', icon: Globe },
              { key: 'tables' as Tab, label: 'Tables', icon: TableProperties },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-white shadow-sm text-surface-900 dark:bg-surface-700 dark:text-surface-50'
                  : 'text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'menu' ? <MenuTab /> : <TablesTab />}
        </motion.div>
      </div>
    </>
  );
}
