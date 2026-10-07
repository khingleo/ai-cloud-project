/**
 * MTN ENTERPRISE HUB - DATA QUALITY CENTER
 * Route: /data-quality
 * 
 * Analyzes repository integrity:
 * - Missing customer TIN / Registration numbers
 * - Incomplete subscription specifications
 * - Missing network IP / Circuit configurations
 * - Expiring contracts & unlinked billing accounts
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import type { DataQualityIssue } from '../types';

const INITIAL_QUALITY_ISSUES: DataQualityIssue[] = [
  {
    id: 'DQI-001',
    module: 'Customer',
    title: 'Missing GhanaPost GPS Address',
    description: 'Corporate client registered with generic GPS GA-000-0000. Needs physical site verification.',
    recordId: 'CUST-002',
    recordName: 'Newmont Ghana Gold Ltd',
    severity: 'Warning',
    status: 'Open',
    detectedAt: '2026-10-06 06:00',
    resolutionPath: '/customers/CUST-002',
  },
  {
    id: 'DQI-002',
    module: 'Network',
    title: 'Unassigned Public IP Gateway Block',
    description: 'Circuit ID MTN-CKT-3312 is active on GPON but has incomplete secondary DNS assignment.',
    recordId: 'NET-CKT-3312',
    recordName: 'Enterprise Insurance Ghana',
    severity: 'Info',
    status: 'Open',
    detectedAt: '2026-10-05 14:20',
    resolutionPath: '/network',
  },
  {
    id: 'DQI-003',
    module: 'Billing',
    title: 'Overdue DCLM Invoice (>30 Days)',
    description: 'August 2026 invoice GHS 4,560 remains unpaid past credit terms.',
    recordId: 'DCLM-ACC-33109',
    recordName: 'Enterprise Insurance Ghana',
    severity: 'Critical',
    status: 'Open',
    detectedAt: '2026-10-04 09:00',
    resolutionPath: '/billing',
  },
  {
    id: 'DQI-004',
    module: 'Subscription',
    title: 'Upcoming Contract Expiration (60 Days)',
    description: 'Corporate Postpaid CUG contract renewal due on 2026-03-01.',
    recordId: 'SUB-MOB-002',
    recordName: 'Standard Chartered Bank Ghana PLC',
    severity: 'Warning',
    status: 'Open',
    detectedAt: '2026-10-06 00:00',
    resolutionPath: '/subscriptions',
  },
];

export const DataQualityPage: React.FC = () => {
  const [issues, setIssues] = useState<DataQualityIssue[]>(INITIAL_QUALITY_ISSUES);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const openCount = issues.filter((i) => i.status === 'Open').length;
  const criticalCount = issues.filter((i) => i.severity === 'Critical' && i.status === 'Open').length;
  const warningCount = issues.filter((i) => i.severity === 'Warning' && i.status === 'Open').length;

  const handleResolve = (id: string) => {
    setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'Resolved' } : i)));
    showToast('success', 'Issue Resolved', 'Data quality issue marked as resolved.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Data Quality Center"
        subtitle="Automated repository integrity auditing: identifying incomplete profiles, unassigned network circuits, and missing records"
        breadcrumbs={[{ label: 'Data Management' }, { label: 'Data Quality' }]}
        actions={
          <button
            onClick={() => showToast('info', 'Audit Complete', 'Repository integrity scanned: 4 issues detected.')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-mtn-yellow" />
            <span>Run Integrity Scan</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-rose-600 tracking-wider">Critical Issues</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <span className="text-3xl font-black text-rose-950 font-heading mt-2 block">{criticalCount}</span>
          <span className="text-xs text-rose-700 font-semibold">Requires immediate admin attention</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Warnings</span>
            <ShieldAlert className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-3xl font-black text-amber-950 font-heading mt-2 block">{warningCount}</span>
          <span className="text-xs text-amber-800 font-semibold">Incomplete metadata or approaching renewals</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Repository Health Score</span>
            <Sparkles className="w-5 h-5 text-mtn-yellow" />
          </div>
          <span className="text-3xl font-black text-slate-900 font-heading mt-2 block">94.8%</span>
          <span className="text-xs text-emerald-600 font-bold">Enterprise data compliance verified</span>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">Detected Issues Requiring Verification ({openCount})</span>
        </div>

        <div className="divide-y divide-slate-100">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                issue.status === 'Resolved' ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  issue.severity === 'Critical' ? 'bg-rose-100 text-rose-700' :
                  issue.severity === 'Warning' ? 'bg-amber-100 text-amber-800' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {issue.severity === 'Critical' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs">{issue.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      Module: {issue.module}
                    </span>
                    <span className="font-semibold text-slate-600 text-xs">• {issue.recordName}</span>
                  </div>
                  <p className="text-xs text-slate-600">{issue.description}</p>
                  <p className="text-[10px] text-slate-400">Detected: {issue.detectedAt} • ID: {issue.recordId}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {issue.status === 'Open' ? (
                  <>
                    <button
                      onClick={() => navigate(issue.resolutionPath)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <span>Fix Record</span>
                      <ArrowRight className="w-3.5 h-3.5 text-mtn-yellow" />
                    </button>
                    <button
                      onClick={() => handleResolve(issue.id)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
