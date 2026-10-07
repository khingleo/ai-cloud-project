/**
 * MTN ENTERPRISE HUB - BILLING & REVENUE MANAGEMENT
 * Route: /billing & /revenue
 * 
 * Manages:
 * 1. Billing Accounts (DCLM accounts, billing cycles, balances, payment status)
 * 2. Invoices & Payment tracking (Paid, Unpaid, Overdue)
 * 3. Revenue Analytics (MRR, ARR, Contract Value, Revenue by Customer & Category)
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  FileText,
  Download,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import { formatCurrencyGHS } from '../utils/formatters';
import type { BillingAccount, InvoiceRecord } from '../types';

const INITIAL_BILLING_ACCOUNTS: BillingAccount[] = [
  {
    id: 'DCLM-ACC-99214',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    billingCycle: 'Monthly (1st-30th)',
    currency: 'GHS',
    monthlyRecurringCharges: 36000,
    oneTimePendingCharges: 0,
    currentBalanceGHS: 0,
    status: 'Current',
    lastInvoiceDate: '2026-10-01',
    paymentStatus: 'Paid',
  },
  {
    id: 'DCLM-ACC-77412',
    customerId: 'CUST-002',
    customerName: 'Newmont Ghana Gold Ltd',
    billingCycle: 'Monthly (1st-30th)',
    currency: 'GHS',
    monthlyRecurringCharges: 14200,
    oneTimePendingCharges: 6000,
    currentBalanceGHS: 6000,
    status: 'Current',
    lastInvoiceDate: '2026-10-01',
    paymentStatus: 'Pending',
  },
  {
    id: 'DCLM-ACC-33109',
    customerId: 'CUST-003',
    customerName: 'Enterprise Insurance Ghana',
    billingCycle: 'Monthly (1st-30th)',
    currency: 'GHS',
    monthlyRecurringCharges: 3800,
    oneTimePendingCharges: 0,
    currentBalanceGHS: 3800,
    status: 'Overdue',
    lastInvoiceDate: '2026-09-01',
    paymentStatus: 'Overdue',
  },
];

const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: 'INV-2026-0812',
    billingAccountId: 'DCLM-ACC-99214',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    period: 'September 2026',
    amountGHS: 36000,
    taxGHS: 7200,
    totalGHS: 43200,
    dueDate: '2026-10-15',
    status: 'Paid',
    paidDate: '2026-10-04',
  },
  {
    id: 'INV-2026-0813',
    billingAccountId: 'DCLM-ACC-77412',
    customerId: 'CUST-002',
    customerName: 'Newmont Ghana Gold Ltd',
    period: 'September 2026',
    amountGHS: 20200,
    taxGHS: 4040,
    totalGHS: 24240,
    dueDate: '2026-10-20',
    status: 'Unpaid',
  },
  {
    id: 'INV-2026-0704',
    billingAccountId: 'DCLM-ACC-33109',
    customerId: 'CUST-003',
    customerName: 'Enterprise Insurance Ghana',
    period: 'August 2026',
    amountGHS: 3800,
    taxGHS: 760,
    totalGHS: 4560,
    dueDate: '2026-09-15',
    status: 'Overdue',
  },
];

export const BillingRevenuePage: React.FC = () => {
  const location = useLocation();
  const isRevenueView = location.pathname.includes('/revenue');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'accounts' | 'invoices' | 'revenue'>(
    isRevenueView ? 'revenue' : 'accounts'
  );
  const [billingAccounts, _setBillingAccounts] = useState<BillingAccount[]>(INITIAL_BILLING_ACCOUNTS);
  const [invoices, _setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);

  // Revenue metrics
  const totalMRR = billingAccounts.reduce((sum, b) => sum + b.monthlyRecurringCharges, 0);
  const totalARR = totalMRR * 12;
  const totalOutstanding = billingAccounts.reduce((sum, b) => sum + b.currentBalanceGHS, 0);

  const accountColumns: Column<BillingAccount>[] = [
    {
      header: 'Billing Account & Customer',
      accessor: (b) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-mtn-yellow flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-slate-900 block">{b.id}</span>
            <span className="text-xs text-slate-500 font-semibold">{b.customerName}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Monthly Charges',
      accessor: (b) => (
        <span className="font-black text-slate-900 font-heading text-xs">
          {formatCurrencyGHS(b.monthlyRecurringCharges)}/mo
        </span>
      ),
    },
    {
      header: 'Outstanding Balance',
      accessor: (b) => (
        <span className={`font-bold text-xs ${b.currentBalanceGHS > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
          {formatCurrencyGHS(b.currentBalanceGHS)}
        </span>
      ),
    },
    {
      header: 'Billing Cycle',
      accessor: (b) => <span className="text-xs text-slate-600">{b.billingCycle}</span>,
    },
    {
      header: 'Payment Status',
      accessor: (b) => <StatusBadge status={b.paymentStatus} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (b) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/customers/${b.customerId}`)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Customer Profile"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const invoiceColumns: Column<InvoiceRecord>[] = [
    {
      header: 'Invoice Reference',
      accessor: (i) => (
        <div>
          <span className="font-mono font-bold text-slate-900 block">{i.id}</span>
          <span className="text-xs text-slate-500">{i.customerName}</span>
        </div>
      ),
    },
    {
      header: 'Period',
      accessor: (i) => <span className="text-xs font-semibold text-slate-700">{i.period}</span>,
    },
    {
      header: 'Net Amount',
      accessor: (i) => <span className="text-xs text-slate-700 font-medium">{formatCurrencyGHS(i.amountGHS)}</span>,
    },
    {
      header: 'Total with Tax',
      accessor: (i) => (
        <span className="font-black text-slate-900 font-heading text-xs">
          {formatCurrencyGHS(i.totalGHS)}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessor: (i) => <span className="text-xs text-slate-500">{i.dueDate}</span>,
    },
    {
      header: 'Status',
      accessor: (i) => <StatusBadge status={i.status} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={isRevenueView ? 'Enterprise Revenue & Portfolio Analytics' : 'Billing & Invoicing Repository'}
        subtitle="Commercial reconciliation, monthly recurring revenues (MRR), DCLM account receivables, and payment tracking"
        breadcrumbs={[{ label: 'Commercial' }, { label: isRevenueView ? 'Revenue' : 'Billing' }]}
        actions={
          <div className="flex items-center gap-2">
            <PermissionGate action="export">
              <button
                onClick={() => showToast('info', 'Export Complete', 'Financial reports exported.')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                <Download className="w-4 h-4" /><span>Export Ledger</span>
              </button>
            </PermissionGate>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Monthly Recurring Revenue (MRR)</span>
          <span className="text-2xl font-black text-slate-900 font-heading mt-1 block">{formatCurrencyGHS(totalMRR)}</span>
          <span className="text-[11px] text-emerald-600 font-bold">Live contracted monthly run-rate</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Annualized Run-Rate (ARR)</span>
          <span className="text-2xl font-black text-amber-900 font-heading mt-1 block">{formatCurrencyGHS(totalARR)}</span>
          <span className="text-[11px] text-slate-500 font-medium">Projected annual gross baseline</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Receivables & Outstanding</span>
          <span className="text-2xl font-black text-rose-600 font-heading mt-1 block">{formatCurrencyGHS(totalOutstanding)}</span>
          <span className="text-[11px] text-rose-500 font-medium">Pending DCLM payment collection</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'accounts' ? 'bg-slate-900 text-mtn-yellow shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing Accounts ({billingAccounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'invoices' ? 'bg-slate-900 text-mtn-yellow shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices & Payments ({invoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'revenue' ? 'bg-slate-900 text-mtn-yellow shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Revenue Breakdown</span>
        </button>
      </div>

      {/* Tab 1: Billing Accounts */}
      {activeTab === 'accounts' && (
        <DataTable
          columns={accountColumns}
          data={billingAccounts}
          searchPlaceholder="Search DCLM accounts by customer name or account ID..."
          searchFilter={(item, query) => {
            const q = query.toLowerCase();
            return item.customerName.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
          }}
        />
      )}

      {/* Tab 2: Invoices */}
      {activeTab === 'invoices' && (
        <DataTable
          columns={invoiceColumns}
          data={invoices}
          searchPlaceholder="Search invoices by invoice ID or customer..."
          searchFilter={(item, query) => {
            const q = query.toLowerCase();
            return item.customerName.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
          }}
        />
      )}

      {/* Tab 3: Revenue Breakdown */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Monthly Revenue by Customer Account</h3>
            <div className="space-y-3">
              {billingAccounts.map((b) => {
                const percent = Math.round((b.monthlyRecurringCharges / totalMRR) * 100);
                return (
                  <div key={b.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-900">{b.customerName}</span>
                      <span className="text-slate-900 font-bold">{formatCurrencyGHS(b.monthlyRecurringCharges)} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-mtn-yellow rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-heading">Revenue Source Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Fixed Connectivity (DIA & Fiber)</span>
                  <span className="text-[11px] text-slate-500">Core enterprise WAN & Internet</span>
                </div>
                <span className="font-black text-slate-900 font-heading text-sm">62%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Mobile & CUG Pooled Data</span>
                  <span className="text-[11px] text-slate-500">Corporate SIM fleets & postpaid</span>
                </div>
                <span className="font-black text-slate-900 font-heading text-sm">24%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Converged & Digital Services</span>
                  <span className="text-[11px] text-slate-500">SD-WAN, Bulk SMS, Cloud, Hosted PBX</span>
                </div>
                <span className="font-black text-slate-900 font-heading text-sm">14%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
