'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Search, Filter, Download, RefreshCw,
  User, Edit2, Trash2, Plus, Eye, LogIn, LogOut,
  AlertTriangle, CheckCircle, Info, ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: string;
  ip: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  createdAt: Date;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const ACTIONS = [
  { action: 'USER_LOGIN',          resource: 'auth',        severity: 'info'    as const, detail: 'Connexion réussie' },
  { action: 'ORDER_CREATED',       resource: 'order',       severity: 'success' as const, detail: 'Nouvelle commande créée' },
  { action: 'ORDER_STATUS_UPDATE', resource: 'order',       severity: 'info'    as const, detail: 'Statut → En livraison' },
  { action: 'MENU_ITEM_DELETED',   resource: 'menu_item',   severity: 'warning' as const, detail: 'Article supprimé du menu' },
  { action: 'STAFF_ROLE_CHANGE',   resource: 'staff',       severity: 'warning' as const, detail: 'Rôle modifié → Manager' },
  { action: 'PAYMENT_REFUND',      resource: 'payment',     severity: 'warning' as const, detail: 'Remboursement initié 42.50€' },
  { action: 'SETTINGS_UPDATE',     resource: 'restaurant',  severity: 'info'    as const, detail: 'Horaires modifiés' },
  { action: 'USER_LOGOUT',         resource: 'auth',        severity: 'info'    as const, detail: 'Déconnexion' },
  { action: 'STOCK_LOW_OVERRIDE',  resource: 'inventory',   severity: 'danger'  as const, detail: 'Seuil stock ignoré manuellement' },
  { action: 'COUPON_CREATED',      resource: 'coupon',      severity: 'success' as const, detail: 'Code SUMMER25 créé' },
  { action: 'CUSTOMER_DELETED',    resource: 'user',        severity: 'danger'  as const, detail: 'Compte client supprimé' },
  { action: 'EXPORT_DATA',         resource: 'analytics',   severity: 'warning' as const, detail: 'Export CSV commandes' },
];

const USERS = [
  { id: 'u1', name: 'Admin Dupont',    role: 'admin',   ip: '192.168.1.1' },
  { id: 'u2', name: 'Marie Leroy',     role: 'owner',   ip: '10.0.0.5' },
  { id: 'u3', name: 'Jean Martin',     role: 'staff',   ip: '10.0.0.8' },
  { id: 'u4', name: 'Sophie Blanc',    role: 'owner',   ip: '192.168.1.12' },
];

function genLogs(): AuditEntry[] {
  const logs: AuditEntry[] = [];
  const now = Date.now();
  for (let i = 0; i < 80; i++) {
    const action = ACTIONS[i % ACTIONS.length];
    const user = USERS[i % USERS.length];
    logs.push({
      id: `log-${i}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: action.action,
      resource: action.resource,
      resourceId: `${action.resource.toUpperCase()}-${1000 + i}`,
      detail: action.detail,
      ip: user.ip,
      severity: action.severity,
      createdAt: new Date(now - i * 4 * 60 * 1000),
    });
  }
  return logs;
}

const ALL_LOGS = genLogs();

// ── Config ────────────────────────────────────────────────────────────────────

const SEV_CONFIG = {
  info:    { label: 'Info',      variant: 'info'    as const, icon: Info,          dot: 'bg-blue-500' },
  success: { label: 'Succès',    variant: 'success' as const, icon: CheckCircle,   dot: 'bg-green-500' },
  warning: { label: 'Attention', variant: 'warning' as const, icon: AlertTriangle, dot: 'bg-amber-500' },
  danger:  { label: 'Critique',  variant: 'danger'  as const, icon: AlertTriangle, dot: 'bg-red-500' },
};

const ACTION_ICON: Record<string, React.ElementType> = {
  USER_LOGIN:  LogIn,
  USER_LOGOUT: LogOut,
  ORDER_CREATED: Plus,
  ORDER_STATUS_UPDATE: Edit2,
  MENU_ITEM_DELETED: Trash2,
  STAFF_ROLE_CHANGE: User,
  PAYMENT_REFUND: AlertTriangle,
  CUSTOMER_DELETED: Trash2,
  EXPORT_DATA: Download,
};

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `Il y a ${diff}s`;
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('fr-FR');
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState<AuditEntry['severity'] | 'all'>('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const resources = ['all', ...Array.from(new Set(ALL_LOGS.map(l => l.resource)))];

  const filtered = useMemo(() => {
    return ALL_LOGS.filter(l => {
      if (sevFilter !== 'all' && l.severity !== sevFilter) return false;
      if (resourceFilter !== 'all' && l.resource !== resourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.action.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.resource.toLowerCase().includes(q) ||
          l.detail?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, sevFilter, resourceFilter]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const counts = {
    total: ALL_LOGS.length,
    danger: ALL_LOGS.filter(l => l.severity === 'danger').length,
    warning: ALL_LOGS.filter(l => l.severity === 'warning').length,
    today: ALL_LOGS.filter(l => l.createdAt > new Date(Date.now() - 86400000)).length,
  };

  async function exportCSV() {
    const rows = [
      ['ID', 'Date', 'Utilisateur', 'Rôle', 'Action', 'Ressource', 'Détail', 'IP', 'Sévérité'],
      ...filtered.map(l => [
        l.id, l.createdAt.toISOString(), l.userName, l.userRole,
        l.action, l.resource, l.detail ?? '', l.ip, l.severity,
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-500" />
            Journal d&apos;audit
          </h1>
          <p className="mt-1 text-sm text-gray-500">Traçabilité de toutes les actions sensibles</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Entrées total',    value: counts.total,   bg: 'bg-gray-50',   text: 'text-gray-900' },
          { label: "Aujourd'hui",      value: counts.today,   bg: 'bg-blue-50',   text: 'text-blue-900' },
          { label: 'Alertes critiques',value: counts.danger,  bg: 'bg-red-50',    text: 'text-red-900' },
          { label: 'Avertissements',   value: counts.warning, bg: 'bg-amber-50',  text: 'text-amber-900' },
        ].map(s => (
          <Card key={s.label} padding="md" className={s.bg}>
            <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher action, utilisateur..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
          {(['all', 'info', 'success', 'warning', 'danger'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setSevFilter(s); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                sevFilter === s ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s === 'all' ? 'Tous' : SEV_CONFIG[s].label}
            </button>
          ))}
        </div>

        <select
          value={resourceFilter}
          onChange={e => { setResourceFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          {resources.map(r => <option key={r} value={r}>{r === 'all' ? 'Toutes ressources' : r}</option>)}
        </select>
      </div>

      {/* Log table */}
      <Card padding="none">
        <div className="divide-y divide-gray-100">
          {paginated.length === 0 && (
            <div className="py-12 text-center text-gray-400">Aucun résultat</div>
          )}
          {paginated.map(log => {
            const sev = SEV_CONFIG[log.severity];
            const ActionIcon = ACTION_ICON[log.action] ?? Eye;
            const isOpen = expanded === log.id;
            return (
              <motion.div key={log.id} layout className="group">
                <button
                  className="flex w-full items-center gap-4 px-6 py-3.5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                >
                  {/* Severity dot */}
                  <div className={`h-2 w-2 flex-shrink-0 rounded-full ${sev.dot}`} />

                  {/* Action icon */}
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <ActionIcon className="h-4 w-4 text-gray-600" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <Badge variant={sev.variant} size="sm">{sev.label}</Badge>
                      <span className="text-xs text-gray-400 font-mono">{log.resource}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600 truncate">{log.detail}</p>
                  </div>

                  {/* User */}
                  <div className="hidden text-right sm:block flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">{log.userName}</p>
                    <p className="text-xs text-gray-400">{log.userRole}</p>
                  </div>

                  {/* Time */}
                  <div className="hidden text-right sm:block flex-shrink-0 w-24">
                    <p className="text-xs text-gray-500">{relativeTime(log.createdAt)}</p>
                  </div>

                  <ChevronDown className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-100 bg-gray-50 px-6 py-4"
                  >
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs font-medium text-gray-400">ID entrée</dt>
                        <dd className="font-mono text-gray-900">{log.id}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-400">Ressource ID</dt>
                        <dd className="font-mono text-gray-900">{log.resourceId ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-400">Adresse IP</dt>
                        <dd className="font-mono text-gray-900">{log.ip}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-400">Timestamp</dt>
                        <dd className="text-gray-900">{log.createdAt.toLocaleString('fr-FR')}</dd>
                      </div>
                    </dl>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-sm text-gray-500">{filtered.length} entrées · page {page}/{totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
