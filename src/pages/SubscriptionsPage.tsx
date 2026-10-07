/**
 * MTN ENTERPRISE HUB - SERVICE SUBSCRIPTIONS MANAGEMENT
 * Route: /subscriptions
 * 
 * Unified Enterprise Subscription repository with category filters:
 * - All Subscriptions
 * - Fixed Connectivity
 * - Mobile & CUG
 * - Converged Solutions
 * - Digital Services
 * 
 * Features:
 * - Common subscription structure with category-specific technical fields
 * - Add/Edit subscription with customer linkage and live SLA & pricing details
 * - Status filters, search by circuit/SIM/customer, and branded PDF export
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  Download,
  ExternalLink,
  Wifi,
  Smartphone,
  Cloud,
  Network,
  Eye,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import { formatCurrencyGHS } from '../utils/formatters';
import { exportBrandedTablePdf } from '../utils/exportBrandedPdf';
import type { ServiceSubscription } from '../types';

// Mock initial data seeded if empty
const INITIAL_SUBSCRIPTIONS: ServiceSubscription[] = [
  {
    id: 'SUB-FIX-001',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    serviceId: 'PROD-FIXED-DIA',
    serviceName: 'Dedicated Internet Access (DIA)',
    productName: 'Dedicated Internet 100Mbps',
    packageTitle: '100 Mbps Symmetrical CIR Fiber',
    category: 'Fixed',
    status: 'Active',
    startDate: '2025-01-15',
    endDate: '2027-01-14',
    renewalDate: '2026-12-15',
    quantity: 1,
    mrcPriceGHS: 8500,
    otcPriceGHS: 1500,
    currency: 'GHS',
    billingFrequency: 'Monthly Postpaid',
    accountManager: 'Kwame Mensah',
    circuitId: 'MTN-CKT-ACC-0192',
    ipAllocation: '154.160.10.32/29',
    bandwidthMbps: 100,
    location: 'Head Office, High Street, Accra',
    contractRef: 'MTN-CTR-2025-081',
    notes: 'Dual redundant fiber drop with automatic BGP failover',
    createdBy: 'Kwame Mensah',
    updatedAt: '2026-02-10',
  },
  {
    id: 'SUB-MOB-002',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    serviceId: 'PROD-MOB-CORPPOST',
    serviceName: 'Corporate Postpaid / CUG',
    productName: 'Executive CUG & Pooled Data',
    packageTitle: '250 SIMs with Unlimited On-net + 15GB Data',
    category: 'Mobile',
    status: 'Active',
    startDate: '2025-03-01',
    endDate: '2026-03-01',
    renewalDate: '2026-02-15',
    quantity: 250,
    mrcPriceGHS: 27500,
    otcPriceGHS: 2500,
    currency: 'GHS',
    billingFrequency: 'Monthly Postpaid',
    accountManager: 'Kwame Mensah',
    simCount: 250,
    location: 'Nationwide Staff',
    contractRef: 'MTN-CTR-2025-104',
    notes: 'Free CUG calls between staff members nationwide',
    createdBy: 'Kwame Mensah',
    updatedAt: '2026-01-20',
  },
  {
    id: 'SUB-CONV-003',
    customerId: 'CUST-002',
    customerName: 'Newmont Ghana Gold Ltd',
    serviceId: 'PROD-CONV-SDWAN',
    serviceName: 'SD WAN Enterprise Overlay',
    productName: 'Managed SD-WAN 4 Sites',
    packageTitle: '4 Mining Sites with LTE Failover',
    category: 'Converged',
    status: 'Active',
    startDate: '2025-06-01',
    endDate: '2028-05-31',
    renewalDate: '2028-04-30',
    quantity: 4,
    mrcPriceGHS: 14200,
    otcPriceGHS: 6000,
    currency: 'GHS',
    billingFrequency: 'Monthly Postpaid',
    accountManager: 'Afua Asantewaa',
    circuitId: 'MTN-SDW-AHA-001',
    bandwidthMbps: 50,
    location: 'Ahafo & Akyem Mine Sites',
    contractRef: 'MTN-CTR-2025-219',
    notes: 'Fortinet SD-WAN edge routers with satellite failover link',
    createdBy: 'Justin Kwabena',
    updatedAt: '2026-03-01',
  },
  {
    id: 'SUB-DIG-004',
    customerId: 'CUST-003',
    customerName: 'Enterprise Insurance Ghana',
    serviceId: 'PROD-DIG-BULKSMS',
    serviceName: 'Bulk SMS Gateway (Ngage)',
    productName: 'Transactional A2P SMS Tier 2',
    packageTitle: '100,000 Monthly SMS Tier with REST API',
    category: 'Digital',
    status: 'Active',
    startDate: '2025-04-10',
    endDate: '2026-04-09',
    renewalDate: '2026-03-25',
    quantity: 100000,
    mrcPriceGHS: 3800,
    otcPriceGHS: 500,
    currency: 'GHS',
    billingFrequency: 'Monthly Postpaid',
    accountManager: 'Justin Kwabena',
    location: 'Cloud / HTTPS REST API',
    contractRef: 'MTN-CTR-2025-331',
    notes: 'Sender ID: ENTERPRISE registered with NCA',
    createdBy: 'Afua Asantewaa',
    updatedAt: '2026-02-18',
  },
];

export const SubscriptionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || 'ALL';
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [subscriptions, _setSubscriptions] = useState<ServiceSubscription[]>(INITIAL_SUBSCRIPTIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewingSubscription, setViewingSubscription] = useState<ServiceSubscription | null>(null);

  // Filter list
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (selectedCategory !== 'ALL' && sub.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && sub.status !== selectedStatus) return false;
    return true;
  });

  const categoryCounts = {
    ALL: subscriptions.length,
    Fixed: subscriptions.filter((s) => s.category === 'Fixed').length,
    Mobile: subscriptions.filter((s) => s.category === 'Mobile').length,
    Converged: subscriptions.filter((s) => s.category === 'Converged').length,
    Digital: subscriptions.filter((s) => s.category === 'Digital').length,
  };

  const handleExportPdf = () => {
    const headers = ['Subscription ID', 'Customer', 'Product / Service', 'Package', 'Category', 'Status', 'MRC (GHS)', 'Billing Cycle', 'Account Manager', 'Start Date', 'End Date'];
    const rows = filteredSubscriptions.map((s) => [
      s.id, s.customerName, s.serviceName, s.packageTitle, s.category, s.status, s.mrcPriceGHS, s.billingFrequency, s.accountManager, s.startDate, s.endDate
    ]);
    exportBrandedTablePdf({
      title: 'Service Subscriptions',
      filename: `MTN_EBD_Subscriptions_${new Date().toISOString().split('T')[0]}.pdf`,
      headers,
      rows,
    });
    showToast('success', 'PDF Export Complete', 'Subscriptions downloaded as a branded PDF.');
  };

  const columns: Column<ServiceSubscription>[] = [
    {
      header: 'Subscription & Customer',
      accessor: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-mtn-yellow flex items-center justify-center shrink-0 font-bold text-xs">
            {s.category === 'Fixed' ? <Wifi className="w-4 h-4" /> : s.category === 'Mobile' ? <Smartphone className="w-4 h-4" /> : s.category === 'Digital' ? <Cloud className="w-4 h-4" /> : <Network className="w-4 h-4" />}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{s.packageTitle}</span>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{s.customerName}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">{s.id}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (s) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
          s.category === 'Fixed' ? 'bg-blue-50 text-blue-800 border-blue-200' :
          s.category === 'Mobile' ? 'bg-amber-50 text-amber-800 border-amber-200' :
          s.category === 'Digital' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          'bg-purple-50 text-purple-800 border-purple-200'
        }`}>
          {s.category}
        </span>
      ),
    },
    {
      header: 'Monthly Price',
      accessor: (s) => (
        <div>
          <span className="font-black text-slate-900 text-xs font-heading">{formatCurrencyGHS(s.mrcPriceGHS)}</span>
          <span className="text-[10px] text-slate-400 block">{s.billingFrequency}</span>
        </div>
      ),
    },
    {
      header: 'Technical Reference',
      accessor: (s) => (
        <div className="text-xs">
          <span className="font-mono text-[11px] text-slate-700 block">{s.circuitId || s.ipAllocation || `${s.simCount || 1} SIMs`}</span>
          <span className="text-[10px] text-slate-400 truncate max-w-[150px] block">{s.location}</span>
        </div>
      ),
    },
    {
      header: 'Account Manager',
      accessor: (s) => <span className="text-xs font-semibold text-slate-700">{s.accountManager}</span>,
    },
    {
      header: 'Status',
      accessor: (s) => <StatusBadge status={s.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (s) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setViewingSubscription(s)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Subscription"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate(`/customers/${s.customerId}`)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Customer 360"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Service Subscriptions Repository"
        subtitle="Centralized enterprise customer subscriptions across Fixed, Mobile, Converged, and Digital service categories"
        breadcrumbs={[{ label: 'Service Management' }, { label: 'Subscriptions' }]}
        actions={
          <div className="flex items-center gap-2">
            <PermissionGate action="export">
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                <Download className="w-4 h-4" /><span>Export PDF</span>
              </button>
            </PermissionGate>
            <PermissionGate action="add">
              <button
                onClick={() => navigate('/customers/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
              >
                <PlusCircle className="w-4 h-4" /><span>New Subscription</span>
              </button>
            </PermissionGate>
          </div>
        }
      />

      {/* Category Pills & Status Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['ALL', 'Fixed', 'Mobile', 'Converged', 'Digital'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-mtn-yellow shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>{cat === 'ALL' ? 'All Subscriptions' : cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${selectedCategory === cat ? 'bg-mtn-yellow text-black' : 'bg-slate-200 text-slate-700'}`}>
                {categoryCounts[cat]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending Provisioning">Pending Provisioning</option>
            <option value="Suspended">Suspended</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSubscriptions}
        searchPlaceholder="Search subscriptions by customer, circuit ID, product, or account manager..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return Boolean(
            item.customerName.toLowerCase().includes(q) ||
            item.packageTitle.toLowerCase().includes(q) ||
            item.serviceName.toLowerCase().includes(q) ||
            item.circuitId?.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            item.accountManager.toLowerCase().includes(q)
          );
        }}
        onRowClick={(sub) => setViewingSubscription(sub)}
      />

      {/* Slide-over Details Drawer */}
      {viewingSubscription && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setViewingSubscription(null)} />
          <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{viewingSubscription.id}</span>
                <h2 className="font-black text-slate-900 text-base">{viewingSubscription.packageTitle}</h2>
                <p className="text-xs text-slate-500">{viewingSubscription.customerName}</p>
              </div>
              <button onClick={() => setViewingSubscription(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <StatusBadge status={viewingSubscription.status} />
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {viewingSubscription.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {viewingSubscription.billingFrequency}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Monthly Rate</span>
                  <span className="text-xl font-black text-amber-950 font-heading">{formatCurrencyGHS(viewingSubscription.mrcPriceGHS)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Setup Fee (OTC)</span>
                  <span className="text-base font-bold text-slate-900 font-heading">{formatCurrencyGHS(viewingSubscription.otcPriceGHS)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Technical Specifications</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  {viewingSubscription.circuitId && <div className="flex justify-between"><span className="text-slate-500">Circuit ID:</span><span className="font-mono font-bold">{viewingSubscription.circuitId}</span></div>}
                  {viewingSubscription.ipAllocation && <div className="flex justify-between"><span className="text-slate-500">IP Subnet:</span><span className="font-mono font-bold">{viewingSubscription.ipAllocation}</span></div>}
                  {viewingSubscription.bandwidthMbps && <div className="flex justify-between"><span className="text-slate-500">Bandwidth:</span><span className="font-bold">{viewingSubscription.bandwidthMbps} Mbps Symmetrical</span></div>}
                  {viewingSubscription.simCount && <div className="flex justify-between"><span className="text-slate-500">SIM Fleet:</span><span className="font-bold">{viewingSubscription.simCount} Active SIMs</span></div>}
                  <div className="flex justify-between"><span className="text-slate-500">Installation Site:</span><span className="font-medium text-slate-800">{viewingSubscription.location}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Contract Reference:</span><span className="font-mono font-semibold text-blue-600">{viewingSubscription.contractRef}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Dates & Account Ownership</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Activation Date:</span><span>{viewingSubscription.startDate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Contract End Date:</span><span>{viewingSubscription.endDate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Next Renewal:</span><span className="font-bold text-amber-700">{viewingSubscription.renewalDate}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Account Manager:</span><span className="font-bold text-slate-900">{viewingSubscription.accountManager}</span></div>
                </div>
              </div>

              {viewingSubscription.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Engineering Notes</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">{viewingSubscription.notes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex gap-2 mt-auto">
              <button
                onClick={() => navigate(`/customers/${viewingSubscription.customerId}`)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Customer 360° Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
