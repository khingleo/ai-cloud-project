/**
 * MTN ENTERPRISE HUB — NETWORK OPERATIONS CENTER
 * Route: /network
 *
 * UNIFIED technical hub consolidating everything previously spread across pages:
 *   • Network Configuration (topology, medium, CPE, health)
 *   • Circuit Connectivity Inventory (circuit IDs, customers, mediums)
 *   • IPAM — IP & Subnet Management (blocks, masks, gateways, VLANs)
 *
 * New features vs the previous version:
 *   • Tabbed layout (Overview | Circuits | IPAM Subnets | Manual Entry)
 *   • Manual Add / Edit / Delete of network configs (persists via AppStateContext)
 *   • Manual Add Circuits-only & Manual Add IP-block-only forms
 *   • Real-time aggregations (IP utilization, latency dashboard, medium breakdown)
 *   • Subnet calculator utilities and ping/whois links
 *   • Better CRUD than previous hard-coded seed state
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Download,
  ExternalLink,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Network,
  Server,
  Boxes,
  Keyboard,
  Layers,
  Wifi,
  Activity,
  Gauge,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MapPin,
  Terminal,
  ChevronRight,
  Copy,
  Calculator,
  Globe,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAppState } from '../context/AppStateContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatCard } from '../components/common/StatCard';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import { Modal } from '../components/common/Modal';
import { exportBrandedTablePdf } from '../utils/exportBrandedPdf';
import type { NetworkConfiguration, ProductCategory, Customer } from '../types';

// ================================================================
// Option lists used by manual entry dropdowns
// ================================================================
const CONNECTION_MEDIUMS: NetworkConfiguration['connectionType'][] = [
  'Direct Dedicated Fiber',
  'GPON Fiber',
  'Microwave Radio',
  'Satellite / Starlink',
  '4G/5G LTE',
  'Cloud Cross-Connect',
];

const CONNECTIVITY_TYPES: NetworkConfiguration['connectivityType'][] = [
  'Point-to-Point',
  'MPLS VPN',
  'Direct Internet (DIA)',
  'SD-WAN Overlay',
  'SIP Trunk',
];

const STATUS_OPTIONS: NetworkConfiguration['networkStatus'][] = [
  'Operational',
  'Degraded',
  'Configuring',
  'Maintenance',
  'Offline',
];

// ================================================================
// Tab keys & helpers
// ================================================================
type TabKey = 'overview' | 'circuits' | 'ipam' | 'manual';
type EntryMode = 'full' | 'circuit' | 'ipam';

const NET_TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }>; hint: string }[] = [
  { key: 'overview',  label: 'Overview',         icon: Network,      hint: 'Unified dashboard' },
  { key: 'circuits',  label: 'Circuits',         icon: Layers,       hint: 'Circuit inventory & connectivity' },
  { key: 'ipam',      label: 'IPAM & Subnets',   icon: Boxes,        hint: 'IP, gateway, VLAN addressing plan' },
  { key: 'manual',    label: 'Manual Entry',     icon: Keyboard,     hint: 'Manually add circuits, configs & IP blocks' },
];

// ================================================================
// Main Component
// ================================================================
export const NetworkConfigPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const {
    networkConfigs,
    addNetworkConfig,
    updateNetworkConfig,
    deleteNetworkConfig,
    customers,
    products,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // ── Global filters (shared across tabs) ──
  const [selectedConnection, setSelectedConnection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // ── Viewing / editing / adding modals ──
  const [viewingConfig, setViewingConfig] = useState<NetworkConfiguration | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<NetworkConfiguration | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NetworkConfiguration | null>(null);

  // ── Manual form mode ──
  type EntryMode = 'full' | 'circuit' | 'ipam';
  const [entryMode, setEntryMode] = useState<EntryMode>('full');

  const filteredConfigs = useMemo(
    () =>
      networkConfigs.filter((c) => {
        if (selectedConnection !== 'ALL' && c.connectionType !== selectedConnection) return false;
        if (selectedStatus !== 'ALL' && c.networkStatus !== selectedStatus) return false;
        return true;
      }),
    [networkConfigs, selectedConnection, selectedStatus]
  );

  // ── Aggregates used in overview & quick stats ──
  const aggregates = useMemo(() => {
    const total = networkConfigs.length;
    const operational = networkConfigs.filter((c) => c.networkStatus === 'Operational').length;
    const degraded = networkConfigs.filter((c) => c.networkStatus === 'Degraded' || c.networkStatus === 'Offline').length;
    const avgLatency = total
      ? Math.round((networkConfigs.reduce((s, c) => s + (c.latencyMs || 0), 0) / total) * 10) / 10
      : 0;
    const totalLoss = total
      ? Math.round(networkConfigs.reduce((s, c) => s + (c.packetLossPercent || 0), 0) * 1000) / 1000
      : 0;
    const totalIps = networkConfigs.reduce((sum, c) => {
      const prefixMatch = /\/(\d+)$/.exec(c.ipAddress || '');
      const prefix = prefixMatch ? Number(prefixMatch[1]) : 32;
      return sum + Math.max(1, Math.pow(2, 32 - prefix));
    }, 0);
    const mediumBreakdown = CONNECTION_MEDIUMS.map((m) => ({
      name: m,
      value: networkConfigs.filter((n) => n.connectionType === m).length,
    })).filter((i) => i.value > 0);
    return { total, operational, degraded, avgLatency, totalLoss, totalIps, mediumBreakdown };
  }, [networkConfigs]);

  const handleExportPdf = () => {
    const headers = [
      'Circuit ID', 'Customer', 'Service', 'Medium', 'Bandwidth', 'IP Subnet',
      'Subnet Mask', 'Gateway', 'VLAN', 'CPE Router', 'Status', 'Latency',
    ];
    const rows = filteredConfigs.map((c) => [
      c.id,
      c.customerName,
      c.serviceName,
      c.connectionType,
      c.bandwidth,
      c.ipAddress,
      c.subnetMask,
      c.gatewayIp,
      c.vlanId || '—',
      c.routerCPE,
      c.networkStatus,
      `${c.latencyMs} ms`,
    ]);
    exportBrandedTablePdf({
      title: 'Network Operations Center — Technical Inventory',
      filename: `MTN_Network_NOC_${new Date().toISOString().split('T')[0]}.pdf`,
      headers,
      rows,
    });
    showToast('success', 'PDF Export Complete', 'Network repository exported with branding.');
  };

  // =============================================================
  // Columns — Overview table (full composite)
  // =============================================================
  const overviewColumns: Column<NetworkConfiguration>[] = [
    {
      header: 'Circuit / Customer',
      accessor: (c) => (
        <div className="flex items-center gap-3 min-w-[220px]">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-mtn-yellow flex items-center justify-center shrink-0 shadow-inner">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-slate-900 block">{c.id}</span>
            <span className="text-xs text-slate-500 font-semibold">{c.customerName}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Connectivity',
      accessor: (c) => (
        <div>
          <span className="text-xs font-bold text-slate-800 block">{c.connectionType}</span>
          <span className="text-[11px] text-slate-500">{c.connectivityType}</span>
        </div>
      ),
    },
    {
      header: 'IP / Subnet',
      accessor: (c) => (
        <div className="font-mono text-[11px]">
          <span className="font-bold text-blue-700 block">{c.ipAddress}</span>
          <span className="text-slate-500">GW {c.gatewayIp} • VLAN {c.vlanId || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Bandwidth / CPE',
      accessor: (c) => (
        <div>
          <span className="text-xs font-bold text-slate-800 block">{c.bandwidth}</span>
          <span className="text-[11px] text-slate-500 truncate max-w-[180px] block" title={c.routerCPE}>
            {c.routerCPE}
          </span>
        </div>
      ),
    },
    {
      header: 'Health',
      accessor: (c) => (
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              c.networkStatus === 'Operational'
                ? 'bg-emerald-500 animate-pulse'
                : c.networkStatus === 'Degraded'
                ? 'bg-orange-500 animate-pulse'
                : c.networkStatus === 'Offline'
                ? 'bg-rose-600'
                : 'bg-slate-400'
            }`}
          />
          <div>
            <span className="text-xs font-bold text-slate-700">{c.latencyMs} ms</span>
            <span className="text-[10px] text-slate-400 ml-1">({c.packetLossPercent}% loss)</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (c) => <StatusBadge status={c.networkStatus} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewingConfig(c)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Technical Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setEditingConfig(c)}
            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit Configuration"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setConfirmDelete(c)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Configuration"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // =============================================================
  // Columns — Circuits table (focused view)
  // =============================================================
  const circuitColumns: Column<NetworkConfiguration>[] = [
    {
      header: 'Circuit ID',
      accessor: (c) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900/5 text-slate-700">
            <Layers className="w-3.5 h-3.5" />
          </span>
          <span className="font-mono font-bold text-slate-900">{c.id}</span>
        </div>
      ),
    },
    { header: 'Customer',       accessor: (c) => <span className="font-semibold text-slate-800">{c.customerName}</span> },
    { header: 'Service Name',   accessor: (c) => <span className="text-xs text-slate-700">{c.serviceName}</span> },
    {
      header: 'Medium / Type',
      accessor: (c) => (
        <div>
          <span className="text-xs font-bold text-slate-800 block">{c.connectionType}</span>
          <span className="text-[11px] text-slate-500">{c.connectivityType}</span>
        </div>
      ),
    },
    { header: 'Bandwidth',      accessor: (c) => <span className="text-xs font-semibold">{c.bandwidth}</span> },
    {
      header: 'Installation',
      accessor: (c) => (
        <div className="text-[11px] max-w-[220px] min-w-[160px]">
          <span className="text-slate-700 block truncate" title={c.installationLocation}>
            <MapPin className="w-3 h-3 inline mr-1 text-slate-400" />
            {c.installationLocation}
          </span>
          <span className="text-slate-400">GPS: {c.gpsCoordinates || '—'}</span>
        </div>
      ),
    },
    { header: 'Status', accessor: (c) => <StatusBadge status={c.networkStatus} size="sm" /> },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewingConfig(c)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate(`/customers/${c.customerId}`)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Customer 360"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // =============================================================
  // Columns — IPAM table (addressing-only view)
  // =============================================================
  const ipamColumns: Column<NetworkConfiguration>[] = [
    {
      header: 'Circuit / Customer',
      accessor: (c) => (
        <div className="min-w-[200px]">
          <span className="font-mono font-bold text-slate-900 block">{c.id}</span>
          <span className="text-[11px] text-slate-500">{c.customerName}</span>
        </div>
      ),
    },
    {
      header: 'IP Block (CIDR)',
      accessor: (c) => (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2 py-1 font-mono text-xs font-bold text-blue-800">
          <Globe className="w-3.5 h-3.5 text-blue-700" />
          {c.ipAddress}
        </span>
      ),
    },
    { header: 'Subnet Mask',  accessor: (c) => <span className="font-mono text-xs text-slate-700">{c.subnetMask || '—'}</span> },
    { header: 'Gateway IP',   accessor: (c) => <span className="font-mono text-xs font-semibold text-slate-800">{c.gatewayIp || '—'}</span> },
    {
      header: 'VLAN',
      accessor: (c) => (
        <span className={c.vlanId ? 'inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700' : 'text-slate-400 text-xs'}>
          {c.vlanId ? `VLAN ${c.vlanId}` : 'Untagged'}
        </span>
      ),
    },
    {
      header: 'Utilization',
      accessor: (c) => {
        const prefixMatch = /\/(\d+)$/.exec(c.ipAddress || '');
        const prefix = prefixMatch ? Number(prefixMatch[1]) : 32;
        const total = Math.max(2, Math.pow(2, Math.max(0, 32 - prefix)));
        const usable = total - 2;
        const used = Math.min(usable, Math.ceil(usable * 0.35 + (c.latencyMs % 20)));
        const pct = Math.round((used / usable) * 100);
        return (
          <div className="min-w-[140px]">
            <div className="flex justify-between text-[10px] mb-1 font-semibold">
              <span className="text-slate-500">{used} / {usable} usable IPs</span>
              <span className="text-slate-700">{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Diagnostics',
      className: 'text-right',
      accessor: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <a
            href={`https://ping.pe/${(c.gatewayIp || c.ipAddress).split('/')[0]}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Ping & trace gateway IP"
          >
            <Activity className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(c.ipAddress || '');
              showToast('info', 'Copied', `IP block ${c.ipAddress} copied to clipboard.`);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Copy CIDR"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewingConfig(c)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // =============================================================
  // Filter bar (shared)
  // =============================================================
  const filterSlot = (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selectedConnection}
        onChange={(e) => setSelectedConnection(e.target.value)}
        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
      >
        <option value="ALL">All Media</option>
        {CONNECTION_MEDIUMS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
      >
        <option value="ALL">All Statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );

  const countPill = (label: string) => (
    <span className="ml-auto text-xs text-slate-400 font-medium">
      Showing <strong className="text-slate-700">{filteredConfigs.length}</strong> {label}
    </span>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Page Header ── */}
      <PageHeader
        title="Network Operations Center"
        subtitle="Unified technical hub: circuit inventory, connectivity, CPE hardware, IP / subnet addressing, and health telemetry — with manual entry when on-site engineers provision circuits."
        breadcrumbs={[{ label: 'Technical' }, { label: 'Network Operations' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEntryMode('full'); setIsAddOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Configuration
            </button>
            <PermissionGate action="export">
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
            </PermissionGate>
          </div>
        }
      />

      {/* ── Summary Stat Cards ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Provisioned Circuits"
          value={aggregates.total}
          description="In the technical repository"
          icon={Server}
          onClick={() => setActiveTab('circuits')}
        />
        <StatCard
          title="Operational"
          value={`${aggregates.operational}/${aggregates.total}`}
          description="NOC health / NOC-monitored"
          trend={{ value: aggregates.degraded === 0 ? '0 incidents' : `${aggregates.degraded} degraded`, isPositive: aggregates.degraded === 0 }}
          icon={CheckCircle2}
        />
        <StatCard
          title="Avg. RTT Latency"
          value={`${aggregates.avgLatency} ms`}
          description="Mean RTT across all live circuits"
          icon={Gauge}
          trend={{ value: aggregates.avgLatency < 20 ? 'Within SLA' : 'SLA Warning', isPositive: aggregates.avgLatency < 20 }}
        />
        <StatCard
          title="Managed IP Space"
          value={aggregates.totalIps.toLocaleString()}
          description={`${networkConfigs.length} CIDR blocks in IPAM`}
          icon={Boxes}
        />
      </section>

      {/* ── Tab switcher ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-2 flex flex-wrap gap-1">
        {NET_TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 min-w-[140px] flex items-center justify-start gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-mtn-yellow' : 'text-slate-500'}`} />
              <div className="text-left">
                <div>{t.label}</div>
                <div className={`text-[10px] font-medium ${active ? 'text-slate-300' : 'text-slate-400'}`}>{t.hint}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <>
          {/* Medium / status strip */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">Unified Network Configuration Inventory</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click any row to open the full technical drawer.</p>
                </div>
                {countPill('records')}
              </div>
              <DataTable
                columns={overviewColumns}
                data={filteredConfigs}
                pageSize={6}
                searchPlaceholder="Search by Circuit ID, customer, IP, router model, or medium..."
                searchFilter={(item, q) => {
                  const ql = q.toLowerCase();
                  return (
                    item.id.toLowerCase().includes(ql) ||
                    item.customerName.toLowerCase().includes(ql) ||
                    item.ipAddress.toLowerCase().includes(ql) ||
                    item.routerCPE.toLowerCase().includes(ql) ||
                    item.connectionType.toLowerCase().includes(ql)
                  );
                }}
                filterSlot={filterSlot}
                onRowClick={(cfg) => setViewingConfig(cfg)}
                emptyTitle="No network configurations yet"
                emptyDescription="Click 'Add Configuration' or jump to the Manual Entry tab to register the first circuit."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 font-heading mb-1 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-amber-700" /> Medium Breakdown
              </h3>
              <p className="text-xs text-slate-500 mb-3">Distribution of provisioned access mediums</p>
              {aggregates.mediumBreakdown.length === 0 ? (
                <div className="text-center text-xs text-slate-500 p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Wifi className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                  No circuits registered yet.
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {aggregates.mediumBreakdown.map((m) => {
                    const pct = aggregates.total ? Math.round((m.value / aggregates.total) * 100) : 0;
                    return (
                      <li key={m.name}>
                        <div className="flex justify-between text-[11px] font-semibold mb-1">
                          <span className="text-slate-700">{m.name}</span>
                          <span className="text-slate-900">{m.value} • {pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-mtn-yellow to-amber-500" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-5 rounded-xl bg-slate-900 text-white p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-mtn-yellow" /> NOC Live Status
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Packet Loss Avg</span>
                  <span className={aggregates.totalLoss > 0.1 ? 'text-orange-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {aggregates.totalLoss.toFixed(3)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Health</span>
                  <span className={aggregates.degraded === 0 ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 font-bold flex items-center gap-1'}>
                    {aggregates.degraded === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    {aggregates.degraded === 0 ? 'All circuits healthy' : `${aggregates.degraded} needs attention`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── CIRCUITS TAB ── */}
      {activeTab === 'circuits' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-700" /> Circuit Inventory & Connectivity
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Centralized Circuit IDs, customer binding, access mediums, installation locations, and CPE commissioning status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEntryMode('circuit'); setIsAddOpen(true); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Manual Circuit Entry
              </button>
            </div>
          </div>
          <DataTable
            columns={circuitColumns}
            data={filteredConfigs}
            pageSize={8}
            searchPlaceholder="Search by circuit ID, customer, bandwidth, site..."
            searchFilter={(item, q) => {
              const ql = q.toLowerCase();
              return (
                item.id.toLowerCase().includes(ql) ||
                item.customerName.toLowerCase().includes(ql) ||
                item.serviceName.toLowerCase().includes(ql) ||
                (item.installationLocation || '').toLowerCase().includes(ql) ||
                item.bandwidth.toLowerCase().includes(ql)
              );
            }}
            filterSlot={filterSlot}
            onRowClick={(cfg) => setViewingConfig(cfg)}
          />
        </div>
      )}

      {/* ── IPAM & SUBNETS TAB ── */}
      {activeTab === 'ipam' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-amber-700" /> IPAM — IP Addressing Plan & Subnet Manager
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Every assigned CIDR block with masks, gateway IPs, VLANs, and per-block IP utilization estimates.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEntryMode('ipam'); setIsAddOpen(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Manual IP Block Entry
                </button>
                <a
                  href="https://www.calculator.net/ip-subnet-calculator.html"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5" /> Subnet Calculator
                </a>
              </div>
            </div>
            <DataTable
              columns={ipamColumns}
              data={filteredConfigs}
              pageSize={8}
              searchPlaceholder="Search CIDR, gateway, VLAN, circuit ID, customer..."
              searchFilter={(item, q) => {
                const ql = q.toLowerCase();
                return (
                  item.ipAddress.toLowerCase().includes(ql) ||
                  (item.gatewayIp || '').toLowerCase().includes(ql) ||
                  (item.subnetMask || '').toLowerCase().includes(ql) ||
                  String(item.vlanId || '').includes(q) ||
                  item.customerName.toLowerCase().includes(ql) ||
                  item.id.toLowerCase().includes(ql)
                );
              }}
              filterSlot={filterSlot}
              onRowClick={(cfg) => setViewingConfig(cfg)}
            />
          </div>
        </div>
      )}

      {/* ── MANUAL ENTRY TAB ── */}
      {activeTab === 'manual' && (
        <ManualEntryHub
          entryMode={entryMode}
          setEntryMode={setEntryMode}
          onOpenFull={() => { setEntryMode('full'); setIsAddOpen(true); }}
          onOpenCircuit={() => { setEntryMode('circuit'); setIsAddOpen(true); }}
          onOpenIpam={() => { setEntryMode('ipam'); setIsAddOpen(true); }}
          latestConfigs={networkConfigs.slice(-5).reverse()}
          onViewConfig={setViewingConfig}
          onEditConfig={setEditingConfig}
        />
      )}

      {/* ============================================================= */}
      {/* Modals                                                         */}
      {/* ============================================================= */}

      {/* 1) View Technical Drawer (slide-over, keeps UX from the old page) */}
      {viewingConfig && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setViewingConfig(null)} />
          <div className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between z-10 gap-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{viewingConfig.id}</span>
                <h2 className="font-black text-slate-900 text-base">{viewingConfig.serviceName}</h2>
                <p className="text-xs text-slate-500 font-semibold">{viewingConfig.customerName}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setViewingConfig(null); setEditingConfig(viewingConfig); }}
                  className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                  title="Edit this config"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewingConfig(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors">
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={viewingConfig.networkStatus} />
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {viewingConfig.connectionType}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {viewingConfig.connectivityType}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  {viewingConfig.bandwidth}
                </span>
              </div>

              {/* IP & Routing */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-700" /> IP Addressing & Routing Details
                </h4>
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between gap-3"><span className="text-slate-400 shrink-0">Public IP Block (CIDR):</span><span className="text-mtn-yellow font-bold">{viewingConfig.ipAddress}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400 shrink-0">Subnet Mask:</span><span>{viewingConfig.subnetMask || '—'}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400 shrink-0">Gateway IP:</span><span>{viewingConfig.gatewayIp || '—'}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400 shrink-0">VLAN Tag:</span><span>{viewingConfig.vlanId || 'Untagged / Native'}</span></div>
                </div>
              </section>

              {/* Circuit & Connectivity */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-700" /> Circuit & Connectivity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Circuit ID / Service</p>
                    <p className="font-mono font-bold text-slate-900">{viewingConfig.id}</p>
                    <p className="text-slate-600">{viewingConfig.serviceName}</p>
                    <p className="text-[10px] text-slate-500">Related service ID: {viewingConfig.serviceId}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Service ID (Product Catalogue)</p>
                    <p className="font-mono font-bold text-slate-900">{viewingConfig.serviceId}</p>
                    <p className="text-[11px] text-slate-600">{viewingConfig.accessTechnology || 'Access technology not recorded.'}</p>
                  </div>
                </div>
              </section>

              {/* Hardware & Access Tech */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-amber-700" /> CPE Equipment & Physical Path
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between gap-3"><span className="text-slate-500 shrink-0">Demarcation / CPE:</span><span className="font-bold text-slate-900 text-right">{viewingConfig.routerCPE}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-500 shrink-0">Access Backbone:</span><span className="text-slate-700 text-right">{viewingConfig.accessTechnology || '—'}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-500 shrink-0">Installation Site:</span><span className="text-slate-800 text-right">{viewingConfig.installationLocation}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-500 shrink-0">GhanaPost GPS:</span><span className="font-mono font-bold text-slate-800 text-right">{viewingConfig.gpsCoordinates || '—'}</span></div>
                </div>
              </section>

              {/* Telemetry */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-700" /> Live Telemetry & Diagnostics
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Latency (RTT)</span>
                    <span className="text-xl font-black text-slate-900 font-heading">{viewingConfig.latencyMs} ms</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Packet Loss</span>
                    <span className={`text-xl font-black font-heading ${viewingConfig.packetLossPercent > 0.1 ? 'text-orange-600' : 'text-emerald-600'}`}>
                      {viewingConfig.packetLossPercent}%
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Last Tested</span>
                    <span className="text-xs font-bold text-slate-900">{viewingConfig.lastTestedAt || '—'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <a
                      href={`https://ping.pe/${(viewingConfig.gatewayIp || viewingConfig.ipAddress).split('/')[0]}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 h-full w-full text-xs font-bold text-blue-700 hover:text-blue-800"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Ping Gateway
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </section>

              {/* Notes + doc link */}
              {viewingConfig.technicalNotes && (
                <section>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Engineering Notes</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">{viewingConfig.technicalNotes}</p>
                </section>
              )}
              {viewingConfig.relatedDocName && (
                <section>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Related Technical Document</h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
                    📄 {viewingConfig.relatedDocName}
                  </p>
                </section>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex flex-wrap gap-2 mt-auto">
              <button
                onClick={() => { setViewingConfig(null); setEditingConfig(viewingConfig); }}
                className="flex-1 py-2.5 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Configuration
              </button>
              <button
                onClick={() => navigate(`/customers/${viewingConfig.customerId}`)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Customer 360° Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2) Add / Edit Modal — supports full, circuit, and ipam modes */}
      <NetworkConfigFormModal
        isOpen={isAddOpen || !!editingConfig}
        onClose={() => { setIsAddOpen(false); setEditingConfig(null); }}
        mode={editingConfig ? 'full' : entryMode}
        initial={editingConfig || undefined}
        customers={customers}
        products={products}
        onSubmit={(payload, modeLabel) => {
          if (editingConfig) {
            updateNetworkConfig(editingConfig.id, payload);
            showToast('success', 'Configuration Updated', `${payload.id || editingConfig.id} saved to the repository.`);
          } else {
            const created = addNetworkConfig(payload as any);
            showToast('success', `${modeLabel} Added`, `${created.id} registered in the Network Operations hub.`);
          }
          setIsAddOpen(false);
          setEditingConfig(null);
        }}
      />

      {/* 3) Delete Confirmation Modal */}
      {confirmDelete && (
        <Modal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          title="Delete Network Configuration"
          subtitle={`This permanently removes circuit ${confirmDelete.id} from the technical repository.`}
          maxWidth="md"
          actions={
            <>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = confirmDelete.id;
                  const name = confirmDelete.customerName;
                  deleteNetworkConfig(id);
                  setConfirmDelete(null);
                  setViewingConfig(null);
                  showToast('info', 'Configuration Deleted', `${id} (${name}) removed from NOC.`);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Permanently Delete
              </button>
            </>
          }
        >
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-900">
              <XCircle className="w-5 h-5" />
              <span className="text-sm font-bold">Delete {confirmDelete.id}?</span>
            </div>
            <p className="text-xs text-rose-800/80">
              Customer: <strong>{confirmDelete.customerName}</strong><br />
              IP block: <span className="font-mono">{confirmDelete.ipAddress}</span><br />
              Service: {confirmDelete.serviceName}
            </p>
            <p className="text-xs text-slate-600 pt-2 border-t border-rose-200/60">
              This will also remove the IPAM & circuit record links. This operation is auditable via the Audit Trail module.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ================================================================
// Manual Entry Hub (content for the "Manual Entry" tab)
// ================================================================
interface ManualEntryHubProps {
  entryMode: EntryMode;
  setEntryMode: (m: EntryMode) => void;
  onOpenFull: () => void;
  onOpenCircuit: () => void;
  onOpenIpam: () => void;
  latestConfigs: NetworkConfiguration[];
  onViewConfig: (c: NetworkConfiguration) => void;
  onEditConfig: (c: NetworkConfiguration) => void;
}

const ManualEntryHub: React.FC<ManualEntryHubProps> = ({
  entryMode, setEntryMode,
  onOpenFull, onOpenCircuit, onOpenIpam,
  latestConfigs, onViewConfig, onEditConfig,
}) => {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-amber-700" /> Manual Entry Workbench
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          When on-site engineers commission a new link, or when IP blocks are assigned outside of a provisioning ticket,
          use the forms below to manually capture the technical record. You can enter a <strong>full configuration</strong>,
          a <strong>circuit-only record</strong> (for physical inventory), or an <strong>IPAM block</strong> (addressing only).
        </p>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Full config card */}
          <button
            onClick={onOpenFull}
            onMouseEnter={() => setEntryMode('full')}
            className={`group rounded-2xl border text-left p-5 transition-all space-y-3 ${
              entryMode === 'full'
                ? 'border-mtn-yellow bg-amber-50/40 shadow-sm ring-2 ring-mtn-yellow/30'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-mtn-yellow flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Full Network Configuration</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Complete record: customer, service, connectivity, CPE, IP/subnet, VLAN, gateway, telemetry.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommended for NOC</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-mtn-yellow group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>

          {/* Circuit only */}
          <button
            onClick={onOpenCircuit}
            onMouseEnter={() => setEntryMode('circuit')}
            className={`group rounded-2xl border text-left p-5 transition-all space-y-3 ${
              entryMode === 'circuit'
                ? 'border-mtn-yellow bg-amber-50/40 shadow-sm ring-2 ring-mtn-yellow/30'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Circuit Inventory Entry</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Register physical circuit IDs, media, endpoints, CPE, and installation site — without IP details.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Field Engineer</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>

          {/* IPAM only */}
          <button
            onClick={onOpenIpam}
            onMouseEnter={() => setEntryMode('ipam')}
            className={`group rounded-2xl border text-left p-5 transition-all space-y-3 ${
              entryMode === 'ipam'
                ? 'border-mtn-yellow bg-amber-50/40 shadow-sm ring-2 ring-mtn-yellow/30'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">IP Block / Subnet Assignment</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Register a CIDR allocation with subnet mask, gateway, and VLAN tagging for an existing circuit.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">IP Admin / NREN</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
            </div>
          </button>
        </div>
      </div>

      {/* Recent manual entries */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 font-heading">Recently Added Configurations</h4>
          <span className="text-[11px] text-slate-400 font-medium">Showing latest {latestConfigs.length} records</span>
        </div>
        {latestConfigs.length === 0 ? (
          <div className="text-center p-6 text-xs text-slate-500 rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <RefreshCw className="mx-auto h-8 w-8 text-slate-300 mb-1" />
            No entries yet — use the cards above to add the first configuration.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {latestConfigs.map((c) => (
              <li key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-900/5 text-slate-700 flex items-center justify-center shrink-0">
                    <Network className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-slate-900 truncate">{c.id}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {c.customerName} • {c.connectionType} • <span className="font-mono">{c.ipAddress}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={c.networkStatus} size="sm" />
                  <button
                    onClick={() => onViewConfig(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEditConfig(c)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ================================================================
// Network Config Form Modal — used by Add and Edit
// ================================================================
interface NetFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: EntryMode;
  initial?: NetworkConfiguration;
  customers: Customer[];
  products: { id: string; name: string; category: ProductCategory }[];
  onSubmit: (payload: Partial<NetworkConfiguration>, modeLabel: string) => void;
}

const NetworkConfigFormModal: React.FC<NetFormProps> = ({ isOpen, onClose, mode, initial, customers, products, onSubmit }) => {
  const { showToast } = useToast();

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const randHex = () => Math.floor(1000 + Math.random() * 9000).toString();

  // ── Form fields ──
  const [fId, setFId] = useState<string>(initial?.id || `NET-CKT-${randHex()}`);
  const [fCustomerId, setFCustomerId] = useState(initial?.customerId || customers[0]?.id || '');
  const [fServiceId, setFServiceId] = useState(initial?.serviceId || products[0]?.id || '');
  const [fServiceName, setFServiceName] = useState(initial?.serviceName || products[0]?.name || '');
  const [fConnection, setFConnection] = useState<NetworkConfiguration['connectionType']>(
    initial?.connectionType || 'Direct Dedicated Fiber'
  );
  const [fConnectivity, setFConnectivity] = useState<NetworkConfiguration['connectivityType']>(
    initial?.connectivityType || 'Direct Internet (DIA)'
  );
  const [fBandwidth, setFBandwidth] = useState(initial?.bandwidth || '100 Mbps Symmetrical');
  const [fCPE, setFCPE] = useState(initial?.routerCPE || 'Cisco Catalyst 8300 Series Edge Router');
  const [fAccessTech, setFAccessTech] = useState(initial?.accessTechnology || 'DWDM / Cisco Carrier Ethernet');
  const [fLocation, setFLocation] = useState(initial?.installationLocation || 'Airport City, Accra');
  const [fGPS, setFGPS] = useState(initial?.gpsCoordinates || 'GA-000-0000');

  const [fCIDR, setFCIDR] = useState(initial?.ipAddress || `154.160.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}/29`);
  const [fMask, setFMask] = useState(initial?.subnetMask || '255.255.255.248');
  const [fGateway, setFGateway] = useState(initial?.gatewayIp || (fCIDR.replace(/\/\d+$/, '').replace(/\.\d+$/, '.1')));
  const [fVlan, setFVlan] = useState<string>(initial?.vlanId ? String(initial.vlanId) : '');

  const [fStatus, setFStatus] = useState<NetworkConfiguration['networkStatus']>(initial?.networkStatus || 'Operational');
  const [fLatency, setFLatency] = useState(String(initial?.latencyMs ?? 5));
  const [fLoss, setFLoss] = useState(String(initial?.packetLossPercent ?? 0));
  const [fLastTested, setFLastTested] = useState(initial?.lastTestedAt || `${todayIso} 08:00 GMT`);
  const [fNotes, setFNotes] = useState(initial?.technicalNotes || '');
  const [fDoc, setFDoc] = useState(initial?.relatedDocName || '');

  React.useEffect(() => {
    if (!isOpen) return;
    setFId(initial?.id || `NET-CKT-${randHex()}`);
    setFCustomerId(initial?.customerId || customers[0]?.id || '');
    setFServiceId(initial?.serviceId || products[0]?.id || '');
    setFServiceName(initial?.serviceName || products[0]?.name || '');
    setFConnection(initial?.connectionType || 'Direct Dedicated Fiber');
    setFConnectivity(initial?.connectivityType || 'Direct Internet (DIA)');
    setFBandwidth(initial?.bandwidth || '100 Mbps Symmetrical');
    setFCPE(initial?.routerCPE || 'Cisco Catalyst 8300 Series Edge Router');
    setFAccessTech(initial?.accessTechnology || 'DWDM / Cisco Carrier Ethernet');
    setFLocation(initial?.installationLocation || 'Airport City, Accra');
    setFGPS(initial?.gpsCoordinates || 'GA-000-0000');
    setFCIDR(initial?.ipAddress || `154.160.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}/29`);
    setFMask(initial?.subnetMask || '255.255.255.248');
    setFGateway(initial?.gatewayIp || (initial ? '' : '154.160.0.1'));
    setFVlan(initial?.vlanId ? String(initial.vlanId) : '');
    setFStatus(initial?.networkStatus || 'Operational');
    setFLatency(String(initial?.latencyMs ?? 5));
    setFLoss(String(initial?.packetLossPercent ?? 0));
    setFLastTested(initial?.lastTestedAt || `${todayIso} 08:00 GMT`);
    setFNotes(initial?.technicalNotes || '');
    setFDoc(initial?.relatedDocName || '');
  }, [isOpen, initial, customers, products]);

  const selCustomer = customers.find((c) => c.id === fCustomerId);
  const selProduct = products.find((p) => p.id === fServiceId);

  const modeTitle =
    mode === 'full' ? (initial ? 'Edit Full Network Configuration' : 'Register Full Network Configuration')
    : mode === 'circuit' ? 'Manual Circuit Inventory Entry'
    : 'Manual IP Block / Subnet Assignment';

  const modeSubtitle =
    mode === 'full'
      ? (initial ? 'Update every technical field for this network configuration.' : 'Full end-to-end record: customer, service, circuit, CPE, IP, VLAN, telemetry.')
      : mode === 'circuit'
      ? 'Capture physical circuit info without IP addressing details.'
      : 'Register a new CIDR assignment, gateway, mask, and VLAN tag.';

  const modeLabel =
    mode === 'full' ? 'Configuration' : mode === 'circuit' ? 'Circuit' : 'IP Block';

  const inputCls = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50';
  const selectCls = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50';
  const labelCls = 'block text-[10px] font-bold text-slate-700 uppercase mb-1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fId.trim()) { showToast('error', 'Validation Error', 'Circuit ID is required.'); return; }
    if (!selCustomer) { showToast('error', 'Validation Error', 'A customer is required.'); return; }

    const payload: Partial<NetworkConfiguration> = {
      id: fId.trim(),
      customerId: selCustomer.id,
      customerName: selCustomer.name,
      serviceId: fServiceId.trim() || (selProduct?.id ?? ''),
      serviceName: fServiceName.trim() || (selProduct?.name ?? 'Unnamed Service'),
      connectionType: fConnection,
      connectivityType: fConnectivity,
      bandwidth: fBandwidth.trim(),
      routerCPE: fCPE.trim(),
      accessTechnology: fAccessTech.trim(),
      installationLocation: fLocation.trim(),
      gpsCoordinates: fGPS.trim(),
      ipAddress: fCIDR.trim(),
      subnetMask: fMask.trim(),
      gatewayIp: fGateway.trim(),
      vlanId: fVlan.trim() ? Number(fVlan) : undefined,
      networkStatus: fStatus,
      latencyMs: Number(fLatency) || 0,
      packetLossPercent: Number(fLoss) || 0,
      lastTestedAt: fLastTested.trim(),
      technicalNotes: fNotes.trim(),
      relatedDocName: fDoc.trim() || undefined,
      // ── Compatibility aliases so every page / search index reads the record:
      circuitId: fId.trim(),
      ipSubnet: fCIDR.trim(),
      vlan: fVlan.trim() || undefined,
      cpeRouterModel: fCPE.trim(),
      lastPingLatency: `${Number(fLatency) || 0}ms`,
    };

    onSubmit(payload, modeLabel);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modeTitle}
      subtitle={modeSubtitle}
      maxWidth="3xl"
      actions={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            form="netconfig-form"
            type="submit"
            className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" /> {initial ? 'Save Changes' : `Add ${modeLabel}`}
          </button>
        </>
      }
    >
      <form id="netconfig-form" onSubmit={handleSubmit} className="space-y-5">
        {/* 1) Identity & Customer binding (always shown) */}
        <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
            <Network className="w-4 h-4 text-amber-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">1. Identity & Customer</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Circuit ID *</label>
              <input required value={fId} onChange={(e) => setFId(e.target.value)}
                placeholder="e.g. NET-CKT-8821" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Customer *</label>
              <select required value={fCustomerId} onChange={(e) => setFCustomerId(e.target.value)} className={selectCls}>
                <option value="" disabled>Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.segment})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Product / Service ID</label>
              <select value={fServiceId} onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value);
                setFServiceId(e.target.value);
                if (p) setFServiceName(p.name);
              }} className={selectCls}>
                <option value="">— Manual service name —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>[{p.category}] {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Service Name</label>
              <input value={fServiceName} onChange={(e) => setFServiceName(e.target.value)}
                placeholder="e.g. Dedicated Internet 100Mbps" className={inputCls} />
            </div>
          </div>
        </section>

        {/* 2) Circuit / Connectivity — skip for IPAM-only */}
        {mode !== 'ipam' && (
          <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
              <Layers className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">2. Circuit & Connectivity</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Access Medium *</label>
                <select value={fConnection} onChange={(e) => setFConnection(e.target.value as any)} className={selectCls}>
                  {CONNECTION_MEDIUMS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Topology Type *</label>
                <select value={fConnectivity} onChange={(e) => setFConnectivity(e.target.value as any)} className={selectCls}>
                  {CONNECTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Bandwidth / Capacity</label>
                <input value={fBandwidth} onChange={(e) => setFBandwidth(e.target.value)}
                  placeholder="e.g. 100 Mbps Symmetrical (1:1 CIR)" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CPE Router (Demarc)</label>
                <input value={fCPE} onChange={(e) => setFCPE(e.target.value)}
                  placeholder="e.g. Cisco Catalyst 8300-2N2S-6T" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Access Backbone / Tech</label>
                <input value={fAccessTech} onChange={(e) => setFAccessTech(e.target.value)}
                  placeholder="e.g. DWDM Metro Ring / Huawei GPON OLT" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Installation Location</label>
                <input value={fLocation} onChange={(e) => setFLocation(e.target.value)}
                  placeholder="e.g. Server Room 2, High Street, Accra" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>GhanaPost GPS</label>
                <input value={fGPS} onChange={(e) => setFGPS(e.target.value)}
                  placeholder="e.g. GA-182-9021" className={inputCls} />
              </div>
            </div>
          </section>
        )}

        {/* 3) IPAM & Subnet — skip for circuit-only */}
        {mode !== 'circuit' && (
          <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
              <Boxes className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">3. IP Addressing, Subnet & VLAN</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>IP Block (CIDR) *</label>
                <input required value={fCIDR} onChange={(e) => setFCIDR(e.target.value)}
                  placeholder="e.g. 154.160.10.32/29" className={inputCls + ' font-mono'} />
              </div>
              <div>
                <label className={labelCls}>Subnet Mask</label>
                <input value={fMask} onChange={(e) => setFMask(e.target.value)}
                  placeholder="e.g. 255.255.255.248" className={inputCls + ' font-mono'} />
              </div>
              <div>
                <label className={labelCls}>Gateway IP</label>
                <input value={fGateway} onChange={(e) => setFGateway(e.target.value)}
                  placeholder="e.g. 154.160.10.33" className={inputCls + ' font-mono'} />
              </div>
              <div>
                <label className={labelCls}>VLAN ID (leave blank for untagged)</label>
                <input value={fVlan} onChange={(e) => setFVlan(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 1042" maxLength={4} className={inputCls + ' font-mono'} />
              </div>
            </div>
          </section>
        )}

        {/* 4) Health, Status & Notes (skip only when IPAM) */}
        {mode !== 'ipam' && (
          <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
              <Activity className="w-4 h-4 text-amber-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">4. Status, Telemetry & Documentation</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Operational Status</label>
                <select value={fStatus} onChange={(e) => setFStatus(e.target.value as any)} className={selectCls}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Latency (ms)</label>
                <input value={fLatency} onChange={(e) => setFLatency(e.target.value.replace(/[^0-9.]/g, ''))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Packet Loss (%)</label>
                <input value={fLoss} onChange={(e) => setFLoss(e.target.value.replace(/[^0-9.]/g, ''))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Tested At</label>
                <input value={fLastTested} onChange={(e) => setFLastTested(e.target.value)}
                  placeholder="2026-10-06 08:00 GMT" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Engineering Notes</label>
                <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={3}
                  placeholder="Path protection, peering details, commissioning notes..."
                  className={inputCls + ' leading-relaxed'} />
              </div>
              <div>
                <label className={labelCls}>Related Document Name</label>
                <input value={fDoc} onChange={(e) => setFDoc(e.target.value)}
                  placeholder="e.g. TFR_Solution_Design_Customer_v2.pdf" className={inputCls} />
              </div>
            </div>
          </section>
        )}
      </form>
    </Modal>
  );
};
