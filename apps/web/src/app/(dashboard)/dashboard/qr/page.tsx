'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, QrCode, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';

type Mode = 'restaurant' | 'table';

const QR_OPTIONS: QRCode.QRCodeToDataURLOptions = {
  width: 300,
  margin: 2,
  color: { dark: '#18181b', light: '#ffffff' },
};

function useQrDataUrl(url: string) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!url) return;
    setError('');
    QRCode.toDataURL(url, QR_OPTIONS)
      .then(setDataUrl)
      .catch(() => setError('Erreur de génération'));
  }, [url]);

  return { dataUrl, error };
}

interface TableQrCardProps {
  restaurantId: string;
  tableNum: number;
}

function TableQrCard({ restaurantId, tableNum }: TableQrCardProps) {
  const url = `https://foodstack.app/menu/${restaurantId}?table=${tableNum}`;
  const { dataUrl } = useQrDataUrl(url);

  const handleDownload = useCallback(() => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-table-${tableNum}.png`;
    link.click();
  }, [dataUrl, tableNum]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <p className="text-sm font-semibold text-surface-700 dark:text-zinc-200">Table {tableNum}</p>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR Table ${tableNum}`}
          className="h-32 w-32 rounded-lg"
        />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-surface-100 dark:bg-zinc-700">
          <QrCode className="h-8 w-8 text-surface-300 dark:text-zinc-500" />
        </div>
      )}
      <button
        onClick={handleDownload}
        disabled={!dataUrl}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-40 dark:text-brand-400 dark:hover:bg-brand-900/30"
      >
        <Download className="h-3.5 w-3.5" />
        Télécharger
      </button>
    </div>
  );
}

export default function QrPage() {
  const user = useAuthStore((s) => s.user);
  const restaurantId = user?.restaurantIds?.[0] ?? 'demo-restaurant';

  const [mode, setMode] = useState<Mode>('restaurant');
  const [tableNum, setTableNum] = useState(1);
  const [showBulk, setShowBulk] = useState(false);

  const previewUrl =
    mode === 'restaurant'
      ? `https://foodstack.app/menu/${restaurantId}`
      : `https://foodstack.app/menu/${restaurantId}?table=${tableNum}`;

  const { dataUrl, error } = useQrDataUrl(previewUrl);

  const handleDownload = useCallback(() => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download =
      mode === 'restaurant' ? 'qr-restaurant.png' : `qr-table-${tableNum}.png`;
    link.click();
  }, [dataUrl, mode, tableNum]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print styles — hide everything except the QR image */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #qr-print-zone,
          #qr-print-zone * { visibility: visible !important; }
          #qr-print-zone {
            position: fixed;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>

      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-50">
              QR Codes
            </h1>
            <p className="mt-1 text-sm text-surface-500 dark:text-zinc-400">
              Générez et téléchargez vos QR codes de menu
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowBulk((v) => !v)}
          >
            {showBulk ? 'Générateur' : 'Génération en masse'}
          </Button>
        </div>

        {showBulk ? (
          /* ── Bulk view ── */
          <div>
            <p className="mb-5 text-sm text-surface-500 dark:text-zinc-400">
              QR codes pour toutes les tables (1 – 20)
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <TableQrCard key={n} restaurantId={restaurantId} tableNum={n} />
              ))}
            </div>
          </div>
        ) : (
          /* ── Generator view ── */
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Left panel — options */}
            <div className="w-full space-y-6 lg:w-72">
              <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <h2 className="mb-4 text-sm font-semibold text-surface-700 dark:text-zinc-200">
                  Type de QR code
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setMode('restaurant')}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      mode === 'restaurant'
                        ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <QrCode className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Menu restaurant</p>
                      <p className="text-xs text-surface-400 dark:text-zinc-400">
                        Lien général du menu
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setMode('table')}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      mode === 'table'
                        ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Table2 className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">QR par table</p>
                      <p className="text-xs text-surface-400 dark:text-zinc-400">
                        Lien avec numéro de table
                      </p>
                    </div>
                  </button>
                </div>

                {mode === 'table' && (
                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-semibold text-surface-700 dark:text-zinc-200">
                      Numéro de table
                    </label>
                    <select
                      value={tableNum}
                      onChange={(e) => setTableNum(Number(e.target.value))}
                      className="h-11 w-full rounded-xl border border-surface-200 bg-white px-3 text-sm text-surface-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          Table {n}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* URL preview */}
              <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <h2 className="mb-2 text-sm font-semibold text-surface-700 dark:text-zinc-200">
                  URL encodée
                </h2>
                <p className="break-all rounded-lg bg-surface-50 px-3 py-2 font-mono text-xs text-surface-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {previewUrl}
                </p>
              </div>
            </div>

            {/* Right panel — QR preview */}
            <div className="flex flex-1 flex-col items-center justify-start">
              <div className="w-full max-w-sm rounded-2xl border border-surface-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <h2 className="mb-6 text-center text-sm font-semibold text-surface-700 dark:text-zinc-200">
                  Aperçu
                </h2>

                {/* QR image — this zone is shown during print */}
                <div
                  id="qr-print-zone"
                  className="flex flex-col items-center gap-3"
                >
                  {error ? (
                    <div className="flex h-64 w-64 items-center justify-center rounded-2xl bg-surface-100 dark:bg-zinc-700">
                      <p className="text-sm text-red-500">{error}</p>
                    </div>
                  ) : dataUrl ? (
                    <img
                      src={dataUrl}
                      alt="QR Code"
                      className="h-64 w-64 rounded-2xl"
                    />
                  ) : (
                    <div className="flex h-64 w-64 animate-pulse items-center justify-center rounded-2xl bg-surface-100 dark:bg-zinc-700">
                      <QrCode className="h-12 w-12 text-surface-300 dark:text-zinc-500" />
                    </div>
                  )}
                  <p className="text-xs text-surface-400 dark:text-zinc-500">
                    {mode === 'table' ? `Table ${tableNum}` : 'Menu général'}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-3">
                  <Button
                    variant="primary"
                    fullWidth
                    icon={<Download className="h-4 w-4" />}
                    onClick={handleDownload}
                    disabled={!dataUrl}
                  >
                    Télécharger
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    icon={<Printer className="h-4 w-4" />}
                    onClick={handlePrint}
                    disabled={!dataUrl}
                  >
                    Imprimer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
