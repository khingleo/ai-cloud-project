/**
 * MTN ENTERPRISE HUB - APPROVALS WORKFLOW DESK
 * 
 * Route: /approvals
 * Implements the 6-tier MTN Ghana enterprise approval hierarchy (Excel Sheet 2):
 * Sales Operations -> Credit Control -> Quality Assurance -> CENO -> DCLM -> Service Delivery
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import type { EnterpriseApproval, ApprovalStageName } from '../types';
import { formatCurrencyGHS, formatDate } from '../utils/formatters';

const APPROVAL_TIERS: ApprovalStageName[] = [
  'Sales Operations',
  'Credit Control',
  'Quality Assurance',
  'CENO',
  'DCLM',
  'Service Delivery',
];

export const ApprovalsPage: React.FC = () => {
  const { approvals, signApprovalStep } = useAppState();
  const { showToast } = useToast();

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeApproval, setActiveApproval] = useState<EnterpriseApproval | null>(null);
  const [signRemarks, setSignRemarks] = useState('');

  const filteredApprovals = approvals.filter((a) => {
    if (selectedStatus !== 'ALL' && a.status !== selectedStatus) return false;
    return true;
  });

  const handleDecision = (decision: 'Approved' | 'Rejected' | 'Returned') => {
    if (!activeApproval) return;

    signApprovalStep(
      activeApproval.id,
      activeApproval.currentStage,
      decision,
      signRemarks || `Decision ${decision} recorded on governance portal.`
    );

    showToast(
      decision === 'Approved' ? 'success' : decision === 'Rejected' ? 'error' : 'warning',
      `Stage ${decision}`,
      `${activeApproval.currentStage} step has been ${decision.toLowerCase()}.`
    );

    setActiveApproval(null);
    setSignRemarks('');
  };

  const columns: Column<EnterpriseApproval>[] = [
    {
      header: 'Approval Record & Deal',
      accessor: (a) => (
        <div>
          <span className="font-bold text-slate-900 text-sm hover:text-mtn-yellow-800 transition-colors">
            {a.opportunityTitle}
          </span>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" /> {a.customerName}
          </p>
        </div>
      ),
    },
    {
      header: 'Product Solution',
      accessor: (a) => <span className="font-semibold text-slate-800 text-xs">{a.productName}</span>,
    },
    {
      header: 'Contract Value',
      accessor: (a) => (
        <span className="font-extrabold text-slate-900 text-xs">{formatCurrencyGHS(a.totalValueGHS)}</span>
      ),
    },
    {
      header: 'Current Sign-Off Tier',
      accessor: (a) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
          📍 {a.currentStage}
        </span>
      ),
    },
    {
      header: 'Overall Status',
      accessor: (a) => <StatusBadge status={a.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (a) => (
        <button
          onClick={() => setActiveApproval(a)}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
        >
          Review Desk <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Enterprise Approval Workflow Desk"
        subtitle="Multi-tier governance sign-off chain ensuring credit vetting, QA standards, CENO authorization, and DCLM billing setup"
        breadcrumbs={[{ label: 'Approvals' }]}
      />

      {/* Visual 6-Stage Governance Hierarchy Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-mtn-yellow" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              MTN Ghana 6-Tier Enterprise Sign-Off Hierarchy
            </h3>
          </div>
          <span className="text-xs text-slate-400">Sequential Governance</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {APPROVAL_TIERS.map((tier, idx) => (
            <div
              key={tier}
              className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col items-center justify-center relative"
            >
              <span className="w-5 h-5 rounded-full bg-mtn-yellow text-black font-extrabold text-[10px] flex items-center justify-center mb-1.5 shadow-xs">
                {idx + 1}
              </span>
              <p className="text-xs font-bold text-white leading-tight">{tier}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {tier === 'Sales Operations'
                  ? 'Docs & Adobe Sign'
                  : tier === 'Credit Control'
                  ? 'Credit Rating'
                  : tier === 'Quality Assurance'
                  ? 'Technical QA'
                  : tier === 'CENO'
                  ? 'Executive Chief'
                  : tier === 'DCLM'
                  ? 'Billing Account'
                  : 'Field Handover'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Approvals ({approvals.length})</option>
            <option value="Pending">Pending Decision</option>
            <option value="Approved">Fully Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Returned">Returned for Review</option>
          </select>
        </div>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          Showing <strong>{filteredApprovals.length}</strong> governance files
        </span>
      </div>

      {/* Approvals Table */}
      <DataTable
        columns={columns}
        data={filteredApprovals}
        searchPlaceholder="Search approvals by deal, customer, or product..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return (
            item.opportunityTitle.toLowerCase().includes(q) ||
            item.customerName.toLowerCase().includes(q) ||
            item.currentStage.toLowerCase().includes(q)
          );
        }}
        onRowClick={(a) => setActiveApproval(a)}
      />

      {/* Approval Sign-Off Action Modal */}
      {activeApproval && (
        <Modal
          isOpen={true}
          onClose={() => setActiveApproval(null)}
          title={`Approval Desk — ${activeApproval.opportunityTitle}`}
          subtitle={`Current Governance Stage: ${activeApproval.currentStage}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Summary details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
                <p className="font-bold text-slate-900 mt-0.5">{activeApproval.customerName}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Product</span>
                <p className="font-bold text-slate-900 mt-0.5">{activeApproval.productName}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Contract Value</span>
                <p className="font-extrabold text-slate-900 mt-0.5">{formatCurrencyGHS(activeApproval.totalValueGHS)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted By</span>
                <p className="font-bold text-slate-900 mt-0.5">{activeApproval.submittedBy}</p>
              </div>
            </div>

            {/* 6-Stage Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Sequential Audit Sign-Off Stepper
              </h4>
              <div className="space-y-3 border border-slate-200 rounded-2xl p-4 bg-white">
                {activeApproval.stages.map((st, i) => (
                  <div key={st.stageName} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        st.status === 'Approved'
                          ? 'bg-emerald-500 text-white'
                          : st.status === 'Pending'
                          ? 'bg-mtn-yellow text-black ring-2 ring-mtn-yellow/50'
                          : st.status === 'Rejected'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {st.status === 'Approved' ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-900 text-xs">{st.stageName} ({st.role})</p>
                        <StatusBadge status={st.status} size="sm" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Approver: <strong>{st.approverName}</strong> {st.signedAt && `• Signed: ${formatDate(st.signedAt)}`}
                      </p>
                      {st.comments && (
                        <p className="text-xs bg-slate-50 p-2 rounded-lg mt-1 text-slate-700 italic border border-slate-100">
                          “{st.comments}”
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign-Off Remarks Input */}
            {activeApproval.status === 'Pending' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Audit Remarks & Comments ({activeApproval.currentStage})
                </label>
                <textarea
                  rows={2}
                  value={signRemarks}
                  onChange={(e) => setSignRemarks(e.target.value)}
                  placeholder="Enter governance notes, credit limit findings, or approval justification..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveApproval(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>

              {activeApproval.status === 'Pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDecision('Returned')}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300"
                  >
                    Return for Revision
                  </button>
                  <button
                    onClick={() => handleDecision('Rejected')}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-300"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleDecision('Approved')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Authorize & Approve ✓
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
