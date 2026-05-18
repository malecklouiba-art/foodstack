'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import {
  QrCode,
  Download,
  Copy,
  Printer,
  Check,
  Globe,
  TableProperties,
  ChevronDown,
  Gift,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

const RESTAURANT_ID = 'REST_001';
const RESTAURANT_NAME = 'Le Gourmet Paris';
const MENU_BASE_URL = 'https://foodstack.app/menu';
const LOYALTY_BASE_URL = 'https://foodstack.app/loyalty';

type Tab = 'menu' | 'tables' | 'loyalty';
type QRSize = 128 | 256 | 512;
type QRBg = 'white' | 'black' | 'brand';

const BG_MAP: Record<QRBg, { bg: string; fg: string; label: string; swatch: string }> = {
  white: { bg: '#ffffff', fg: '#18181b', label: 'Blanc',  swatch: 'bg-white border border-surface-200' },
  black: { bg: '#18181b', fg: '#ffffff', label: 'Noir',   swatch: 'bg-zinc-900' },
  brand: { bg: '#f97316', fg: '#ffffff', label: 'Brand',  swatch: 'bg-orange-500' },
};

const SIZE_OPTIONS: { value: QRSize; label: string }[] = [
  { value: 128, label: 'Petit – 128 px' },
  { value: 256, label: 'Moyen – 256 px' },
  { value: 512, label: 'Grand – 512 px' },
];

const TABLE_COUNT = 12;

function menuUrl(tableId?: number): string {
  const base = `${MENU_BASE_URL}?r=${RESTAURANT_ID}`;
  return tableId !== undefined ? `${base}&t=TABLE_${tableId}` : base;
}

function loyaltyUrl(): string {
  return `${LOYALTY_BASE_URL}?r=${RESTAURANT_ID}`;
}

/** Download a QR code rendered by QRCodeCanvas as a PNG. */
function downloadQRPNG(canvasId: string, filename: string) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
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

// ─── Shared action buttons ────────────────────────────────────────────────────

interface QRActionsProps {
  canvasId: string;
  filename: string;
  url: string;
  onPrint?: () => void;
}

function QRActions({ canvasId, filename, url, onPrint }: QRActionsProps) {
  const { copied, copy } = useCopyToast();

  return (
    <div className="flex w-full flex-wrap gap-2 justify-center">
      <button
        onClick={() => downloadQRPNG(canvasId, filename)}
        className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95"
      >
        <Download className="h-4 w-4" />
        Télécharger PNG
      </button>
      <button
        onClick={onPrint ?? (() => window.print())}
        className="flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 shadow-sm transition-all hover:bg-surface-50 active:scale-95 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700 print:hidden"
      >
        <Printer className="h-4 w-4" />
        Imprimer
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
  );
}

// ─── Size + Color customizer ──────────────────────────────────────────────────

interface CustomizerProps {
  bg: QRBg;
  setBg: (v: QRBg) => void;
  size: QRSize;
  setSize: (v: QRSize) => void;
}

function Customizer({ bg, setBg, size, setSize }: CustomizerProps) {
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  return (
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
          {(Object.entries(BG_MAP) as [QRBg, (typeof BG_MAP)[QRBg]][]).map(([key, val]) => (
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
              <span className="text-xs text-surface-600 dark:text-surface-400">{val.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Size select */}
      <div>
        <p className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">Taille</p>
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
                      ? 'font-medium text-orange-500'
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
  );
}

// ─── Menu Tab ────────────────────────────────────────────────────────────────

function MenuTab() {
  const [bg, setBg] = useState<QRBg>('white');
  const [size, setSize] = useState<QRSize>(256);
  const url = menuUrl();
  const colors = BG_MAP[bg];
  const canvasId = 'qr-canvas-menu';

  return (
    <div className="space-y-6">
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
          {/* Hidden canvas used for PNG export */}
          <div className="hidden">
            <QRCodeCanvas
              id={canvasId}
              value={url}
              size={size}
              bgColor={colors.bg}
              fgColor={colors.fg}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Visible SVG preview */}
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

          <div className="w-full space-y-1 text-center">
            <p className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {RESTAURANT_NAME}
            </p>
            <p className="break-all text-xs text-surface-400">{url}</p>
          </div>

          <QRActions
            canvasId={canvasId}
            filename={`qr-menu-${RESTAURANT_ID}.png`}
            url={url}
          />
        </Card>

        {/* Customization + Print */}
        <div className="space-y-4">
          <Customizer bg={bg} setBg={setBg} size={size} setSize={setSize} />

          <Card padding="md">
            <p className="mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">
              Impression
            </p>
            <p className="mb-4 text-xs text-surface-500">
              Ouvre la fenêtre d&apos;impression de votre navigateur. Le QR code sera centré sur
              la page.
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

// ─── Loyalty Tab ──────────────────────────────────────────────────────────────

function LoyaltyTab() {
  const [bg, setBg] = useState<QRBg>('white');
  const [size, setSize] = useState<QRSize>(256);
  const url = loyaltyUrl();
  const colors = BG_MAP[bg];
  const canvasId = 'qr-canvas-loyalty';

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-start gap-3">
          <Gift className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
          <div>
            <p className="font-medium text-surface-900 dark:text-surface-50">
              Programme de fidélité
            </p>
            <p className="mt-1 text-sm text-surface-500">
              Permettez à vos clients de s&apos;inscrire à votre programme de fidélité en scannant
              ce QR code. Ils accumuleront des points à chaque commande.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg" className="flex flex-col items-center gap-6">
          {/* Hidden canvas for PNG export */}
          <div className="hidden">
            <QRCodeCanvas
              id={canvasId}
              value={url}
              size={size}
              bgColor={colors.bg}
              fgColor={colors.fg}
              level="H"
              includeMargin={false}
            />
          </div>

          <div
            className="rounded-2xl p-6 shadow-md transition-all"
            style={{ backgroundColor: colors.bg }}
          >
            <QRCodeSVG
              value={url}
              size={size}
              bgColor={colors.bg}
              fgColor={colors.fg}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="w-full space-y-1 text-center">
            <p className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {RESTAURANT_NAME} — Fidélité
            </p>
            <p className="break-all text-xs text-surface-400">{url}</p>
          </div>

          <QRActions
            canvasId={canvasId}
            filename={`qr-loyalty-${RESTAURANT_ID}.png`}
            url={url}
          />
        </Card>

        <div className="space-y-4">
          <Customizer bg={bg} setBg={setBg} size={size} setSize={setSize} />

          {/* Loyalty info */}
          <Card padding="md">
            <p className="mb-3 text-sm font-medium text-surface-700 dark:text-surface-300">
              Avantages programme
            </p>
            <ul className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
              {[
                '1 point par euro dépensé',
                'Récompense dès 100 points',
                'Anniversaire : café offert',
                'Parrainage : 20 points bonus',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Tables Tab ───────────────────────────────────────────────────────────────

function TableQRCard({ tableNumber }: { tableNumber: number }) {
  const url = menuUrl(tableNumber);
  const canvasId = `qr-canvas-table-${tableNumber}`;
  const { copied, copy } = useCopyToast();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: tableNumber * 0.03 }}
    >
      <Card padding="sm" hover className="flex flex-col items-center gap-3">
        {/* Hidden canvas for PNG */}
        <div className="hidden">
          <QRCodeCanvas
            id={canvasId}
            value={url}
            size={256}
            bgColor="#ffffff"
            fgColor="#18181b"
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="rounded-xl bg-white p-3 shadow-sm">
          <QRCodeSVG
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
        <p className="w-full truncate text-center text-xs text-surface-400">{url}</p>

        <div className="flex w-full gap-1.5">
          <button
            onClick={() => downloadQRPNG(canvasId, `qr-table-${tableNumber}.png`)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-2 py-1.5 text-xs font-medium text-surface-600 transition-all hover:bg-surface-100 active:scale-95 dark:border-surface-700 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600"
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </button>
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-2 py-1.5 text-xs font-medium text-surface-600 transition-all hover:bg-surface-100 active:scale-95 dark:border-surface-700 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600 print:hidden"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimer
          </button>
          <button
            onClick={() => copy(url)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-2 py-1.5 text-xs font-medium text-surface-600 transition-all hover:bg-surface-100 active:scale-95 dark:border-surface-700 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? 'Copié' : 'Lien'}
          </button>
        </div>
      </Card>
    </motion.div>
  );
}

function TablesTab() {
  const [toast, setToast] = useState(false);
  const tableNums = Array.from({ length: TABLE_COUNT }, (_, i) => i + 1);

  function handleDownloadAll() {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
    tableNums.forEach((n, idx) => {
      setTimeout(() => {
        downloadQRPNG(`qr-canvas-table-${n}`, `qr-table-${n}.png`);
      }, idx * 200);
    });
  }

  return (
    <div className="space-y-6">
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
            Télécharger tous (PNG)
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {tableNums.map((n) => (
          <TableQRCard key={n} tableNumber={n} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'menu',    label: 'Menu en ligne',  icon: Globe },
  { key: 'tables',  label: 'Tables',         icon: TableProperties },
  { key: 'loyalty', label: 'Fidélité',       icon: Gift },
];

export default function QRCodesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('menu');

  return (
    <>
      {/* Print styles — centres the visible QR element */}
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
                Générez et gérez vos QR codes pour le menu, les tables et la fidélité
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex w-fit gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1 dark:border-surface-700 dark:bg-surface-800/50">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
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
          {activeTab === 'menu'    && <MenuTab />}
          {activeTab === 'tables'  && <TablesTab />}
          {activeTab === 'loyalty' && <LoyaltyTab />}
        </motion.div>
      </div>
    </>
  );
}
