/**
 * MTN ENTERPRISE HUB - COMMERCIAL PRICING REPOSITORY
 * Route: /pricing
 * 
 * Manages:
 * 1. Standard Repository Pricing (Official approved tariffs & units)
 * 2. Customer-Specific Pricing (Negotiated contracts, discounts, approval reasons)
 * 3. Price History & Change Versioning (Never overwrite historical prices)
 */

import React, { useState } from 'react';
import {
  History,
  Tag,
  Building2,
  Download,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import { formatCurrencyGHS } from '../utils/formatters';
import type { StandardPriceItem, CustomerSpecificPrice, PriceHistoryRecord } from '../types';

const INITIAL_STANDARD_PRICES: StandardPriceItem[] = [
  {
    id: 'PRC-STD-001',
    productId: 'PROD-FIXED-DIA',
    productName: 'Dedicated Internet Access (DIA)',
    category: 'Fixed',
    standardPriceGHS: 85,
    setupFeeGHS: 1500,
    billingFrequency: 'Monthly Recurring (MRC)',
    unitType: 'Per Mbps Symmetrical (Min 10 Mbps)',
    effectiveDate: '2025-01-01',
    version: 'v2.4',
    status: 'Approved',
  },
  {
    id: 'PRC-STD-002',
    productId: 'PROD-MOB-CORPPOST',
    productName: 'Corporate Postpaid / CUG Voice & Data',
    category: 'Mobile',
    standardPriceGHS: 110,
    setupFeeGHS: 20,
    billingFrequency: 'Monthly Postpaid',
    unitType: 'Per Corporate SIM / Month',
    effectiveDate: '2025-01-01',
    version: 'v1.8',
    status: 'Approved',
  },
  {
    id: 'PRC-STD-003',
    productId: 'PROD-CONV-SDWAN',
    productName: 'SD WAN Managed Branch Overlay',
    category: 'Converged',
    standardPriceGHS: 3500,
    setupFeeGHS: 1500,
    billingFrequency: 'Monthly Recurring (MRC)',
    unitType: 'Per Branch Site / Month',
    effectiveDate: '2025-03-01',
    version: 'v1.2',
    status: 'Approved',
  },
  {
    id: 'PRC-STD-004',
    productId: 'PROD-DIG-BULKSMS',
    productName: 'Bulk SMS Gateway (A2P)',
    category: 'Digital',
    standardPriceGHS: 0.038,
    setupFeeGHS: 500,
    billingFrequency: 'Pay-per-use / Tiered volume',
    unitType: 'Per SMS message hit',
    effectiveDate: '2025-01-01',
    version: 'v3.0',
    status: 'Approved',
  },
  {
    id: 'PRC-STD-005',
    productId: 'PROD-CONV-HPBX',
    productName: 'Hosted PBX Cloud Extensions',
    category: 'Converged',
    standardPriceGHS: 95,
    setupFeeGHS: 500,
    billingFrequency: 'Monthly Recurring (MRC)',
    unitType: 'Per Extension / User',
    effectiveDate: '2025-02-01',
    version: 'v2.0',
    status: 'Approved',
  },
];

const INITIAL_CUSTOMER_PRICES: CustomerSpecificPrice[] = [
  {
    id: 'CSP-2025-001',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    productId: 'PROD-FIXED-DIA',
    productName: 'Dedicated Internet 100Mbps',
    standardPriceGHS: 8500,
    customerPriceGHS: 7200,
    discountPercent: 15.3,
    pricingReason: 'Strategic Tier 1 Banking Account / 3-Year Master Service Agreement',
    contractRef: 'MTN-CTR-2025-081',
    effectiveDate: '2025-01-15',
    expiryDate: '2028-01-14',
    approvalStatus: 'Approved',
    approvedBy: 'Kwame Asante (Chief Enterprise Officer)',
  },
  {
    id: 'CSP-2025-002',
    customerId: 'CUST-002',
    customerName: 'Newmont Ghana Gold Ltd',
    productId: 'PROD-CONV-SDWAN',
    productName: 'SD WAN 4 Mining Sites',
    standardPriceGHS: 14000,
    customerPriceGHS: 12600,
    discountPercent: 10.0,
    pricingReason: 'Multi-site mining operation with bundled LEO satellite backup',
    contractRef: 'MTN-CTR-2025-219',
    effectiveDate: '2025-06-01',
    expiryDate: '2028-05-31',
    approvalStatus: 'Approved',
    approvedBy: 'Afua Asantewaa (Head of Products)',
  },
];

const INITIAL_PRICE_HISTORY: PriceHistoryRecord[] = [
  {
    id: 'HIST-001',
    productName: 'Dedicated Internet Access (DIA)',
    customerName: 'Standard Chartered Bank Ghana PLC',
    oldPriceGHS: 9200,
    newPriceGHS: 7200,
    changedBy: 'Kwame Mensah (KAM)',
    reason: 'Contract renewal discount for 36-month term',
    changeDate: '2025-01-15',
  },
  {
    id: 'HIST-002',
    productName: 'Bulk SMS Gateway (A2P)',
    customerName: 'Enterprise Insurance Ghana',
    oldPriceGHS: 0.045,
    newPriceGHS: 0.038,
    changedBy: 'Afua Asantewaa (Product Lead)',
    reason: 'Annual volume tier adjustment (>1M annual hits)',
    changeDate: '2025-04-10',
  },
];

export const PricingPage: React.FC = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'standard' | 'customer' | 'history'>('standard');
  const [standardPrices, _setStandardPrices] = useState<StandardPriceItem[]>(INITIAL_STANDARD_PRICES);
  const [customerPrices, _setCustomerPrices] = useState<CustomerSpecificPrice[]>(INITIAL_CUSTOMER_PRICES);
  const [priceHistory, _setPriceHistory] = useState<PriceHistoryRecord[]>(INITIAL_PRICE_HISTORY);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Commercial Pricing & Rate Repository"
        subtitle="Approved official standard repository price books, customer-specific negotiated tariffs, and audit price versioning"
        breadcrumbs={[{ label: 'Commercial' }, { label: 'Pricing' }]}
        actions={
          <div className="flex items-center gap-2">
            <PermissionGate action="export">
              <button
                onClick={() => showToast('info', 'Export Started', 'Pricing catalogue exported.')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                <Download className="w-4 h-4" /><span>Export Price Book</span>
              </button>
            </PermissionGate>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('standard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'standard' ? 'bg-slate-900 text-mtn-yellow shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Standard Price Book ({standardPrices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'customer' ? 'bg-slate-900 text-mtn-yellow shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Customer-Specific Pricing ({customerPrices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history' ? 'bg-slate-900 text-mtn-yellow shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Price Version History ({priceHistory.length})</span>
        </button>
      </div>

      {/* ── TAB 1: STANDARD REPOSITORY PRICING ── */}
      {activeTab === 'standard' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Official MTN Ghana approved enterprise tariffs</span>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Commercial Committee Approved
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Service Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Standard Rate</th>
                  <th className="py-3 px-4">Unit Description</th>
                  <th className="py-3 px-4">Setup Fee</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {standardPrices.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{p.productName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{p.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 font-heading text-sm">
                      {formatCurrencyGHS(p.standardPriceGHS)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{p.unitType}</td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{formatCurrencyGHS(p.setupFeeGHS)}</td>
                    <td className="py-3 px-4 text-slate-500">{p.effectiveDate}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.version}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: CUSTOMER SPECIFIC PRICING ── */}
      {activeTab === 'customer' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Negotiated contractual enterprise rates</span>
            <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Contract Enforced
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Service Product</th>
                  <th className="py-3 px-4">Standard Rate</th>
                  <th className="py-3 px-4">Negotiated Rate</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Approved By</th>
                  <th className="py-3 px-4">Contract Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerPrices.map((cp) => (
                  <tr key={cp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{cp.customerName}</td>
                    <td className="py-3 px-4 text-slate-700">{cp.productName}</td>
                    <td className="py-3 px-4 text-slate-400 line-through">{formatCurrencyGHS(cp.standardPriceGHS)}</td>
                    <td className="py-3 px-4 font-black text-amber-950 font-heading text-sm">
                      {formatCurrencyGHS(cp.customerPriceGHS)}/mo
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {cp.discountPercent}% OFF
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{cp.approvedBy}</td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-semibold">{cp.contractRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: PRICE VERSION HISTORY ── */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-700">Immutable audit log of historical rate adjustments</span>
          </div>
          <div className="divide-y divide-slate-100">
            {priceHistory.map((h) => (
              <div key={h.id} className="p-4 flex items-start justify-between gap-4 text-xs hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{h.productName}</span>
                    {h.customerName && <span className="text-slate-500 font-semibold">• {h.customerName}</span>}
                  </div>
                  <p className="text-slate-600">{h.reason}</p>
                  <p className="text-[11px] text-slate-400">Changed by <strong>{h.changedBy}</strong> on {h.changeDate}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 line-through">{formatCurrencyGHS(h.oldPriceGHS)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-black text-slate-900 font-heading text-sm">{formatCurrencyGHS(h.newPriceGHS)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
