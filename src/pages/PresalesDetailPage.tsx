/**
 * MTN ENTERPRISE HUB - TECHNICAL ASSESSMENT & TFR SIGN-OFF (CRUD)
 * 
 * Route: /presales/:id
 * Captures Customer Requirements, Proposed Architecture, Dependencies, Risks,
 * and enables submission for internal multi-tier approval.
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Save,
  Send,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import type { PresalesStatus } from '../types';
import { formatDate } from '../utils/formatters';

export const PresalesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { presales, updatePresales, deletePresalesRequest, submitPresalesAssessment, updateOpportunityStage } = useAppState();
  const { showToast } = useToast();

  const presale = presales.find((p) => p.id === id);

  // All hooks must be called unconditionally before any early return
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerReq, setCustomerReq] = useState(presale?.customerRequirements ?? '');
  const [proposedSolution, setProposedSolution] = useState(presale?.proposedSolution ?? '');
  const [implNotes, setImplNotes] = useState(presale?.implementationNotes ?? '');
  const [status, setStatus] = useState<PresalesStatus>(presale?.status ?? 'Pending');

  if (!presale) {
    return (
      <div className="py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Presales Record Not Found</h3>
        <button
          onClick={() => navigate('/presales')}
          className="px-4 py-2 bg-mtn-yellow font-bold text-xs rounded-xl"
        >
          Return to Presales Queue
        </button>
      </div>
    );
  }

  const handleSave = () => {
    updatePresales(presale.id, {
      customerRequirements: customerReq,
      proposedSolution,
      implementationNotes: implNotes,
      status,
    });
    showToast('info', 'Assessment Saved', 'Technical scoping details updated in local state.');
  };

  const handleSubmitForApproval = () => {
    submitPresalesAssessment(presale.id, {
      customerRequirements: customerReq,
      proposedSolution,
      implementationNotes: implNotes,
      status: 'Completed',
    });

    if (presale.opportunityId) {
      updateOpportunityStage(presale.opportunityId, 'Proposal');
    }

    showToast('success', 'Submitted for Proposal & Approval', 'TFR feasibility report signed off and sent to KAM for customer proposal.');
    navigate(`/opportunities/${presale.opportunityId}`);
  };

  const handleDeleteConfirm = () => {
    deletePresalesRequest(presale.id);
    showToast('info', 'Assessment Deleted', `Presales record #${presale.id} removed.`);
    setIsDeleteModalOpen(false);
    navigate('/presales');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={`Technical Assessment — ${presale.opportunityTitle}`}
        subtitle={`Request ID: ${presale.id} • Customer: ${presale.customerName} • Product: ${presale.productName}`}
        breadcrumbs={[
          { label: 'Presales', path: '/presales' },
          { label: presale.opportunityTitle },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/presales')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
            <button
              onClick={handleSubmitForApproval}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-black text-xs font-bold rounded-xl shadow-mtn-glow transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Submit for Approval
            </button>
          </div>
        }
      />

      {/* Overview Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={status} size="md" />
              <span className="text-xs font-semibold text-slate-500">
                Assigned Team: <strong className="text-slate-900">{presale.assignedTeam}</strong>
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 font-heading">{presale.opportunityTitle}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong>{presale.customerName}</strong> • Lead Engineer: <strong>{presale.leadEngineer}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Due Date</span>
              <span className="text-xs font-bold text-slate-800">{formatDate(presale.dueDate)}</span>
            </div>
            <div className="text-right pl-3 border-l border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created</span>
              <span className="text-xs font-bold text-slate-800">{formatDate(presale.createdAt)}</span>
            </div>
            <div className="pl-3 border-l border-slate-200">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PresalesStatus)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="Pending">Pending</option>
                <option value="Assessment">Assessment</option>
                <option value="Technical Review">Technical Review</option>
                <option value="Completed">Completed</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Assessment Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Customer Requirements */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Customer Functional & Network Requirements
            </h3>
            <textarea
              rows={4}
              value={customerReq}
              onChange={(e) => setCustomerReq(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50 leading-relaxed font-sans"
            />
          </div>

          {/* Section 2: Proposed Solution Architecture */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              2. Proposed Solution Architecture & Topology
            </h3>
            <textarea
              rows={4}
              value={proposedSolution}
              onChange={(e) => setProposedSolution(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50 leading-relaxed font-sans"
            />
          </div>

          {/* Section 3: Technical Specifications & Bill of Materials */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3. Technical Requirements & Circuit Specifications
            </h3>
            <div className="space-y-2">
              {presale.technicalRequirements.map((req, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Implementation Notes for Field Team */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              4. Implementation & Provisioning Notes (For Service Delivery)
            </h3>
            <textarea
              rows={3}
              value={implNotes}
              onChange={(e) => setImplNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Right Sidebar: Dependencies, Risks, Documents */}
        <div className="space-y-6">
          {/* Dependencies Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              External Dependencies
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              {presale.dependencies.map((dep, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                  🔗 {dep}
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Identified Risks & Mitigations
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              {presale.risks.map((risk, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                  ⚠️ {risk}
                </div>
              ))}
            </div>
          </div>

          {/* Attached Feasibility Documents */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Generated TFR Artifacts
            </h4>
            <div className="space-y-2">
              {presale.tfrDocumentName && (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-amber-900 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">{presale.tfrDocumentName}</span>
                  </div>
                  <button
                    onClick={() => showToast('info', 'Download Started', `Downloading ${presale.tfrDocumentName}...`)}
                    className="p-1 text-slate-500 hover:text-slate-900"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
              {presale.solutionDesignSignOffUrl && (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 truncate">{presale.solutionDesignSignOffUrl}</span>
                  </div>
                  <button
                    onClick={() => showToast('info', 'Download Started', `Downloading ${presale.solutionDesignSignOffUrl}...`)}
                    className="p-1 text-slate-500 hover:text-slate-900"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit CTA Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 text-center shadow-xs">
            <p className="text-xs text-slate-300">
              When technical scoping is complete, submit to KAM for commercial proposal and credit vetting.
            </p>
            <button
              onClick={handleSubmitForApproval}
              className="mt-3 w-full py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-black font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Sign Off & Submit TFR
            </button>
          </div>
        </div>
      </div>

      {/* DELETE MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Presales Assessment"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs">
              Are you sure you want to delete technical assessment #{presale.id} ({presale.opportunityTitle})?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
