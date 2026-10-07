/**
 * MTN ENTERPRISE HUB - OPPORTUNITY DETAIL & LIFECYCLE WORKFLOW (CRUD & FULL ACTIONS)
 * 
 * Route: /opportunities/:id
 * Connects the entire enterprise journey:
 * Customer -> Lead -> Opportunity -> Presales -> Documents -> Approvals -> Service Delivery -> Active Service
 * Features Edit Opportunity modal and Delete Opportunity with pipeline return.
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Wrench,
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  Edit2,
  Trash2,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { WorkflowTracker, type EnterpriseWorkflowStep } from '../components/common/WorkflowTracker';
import { Modal } from '../components/common/Modal';
import type { OpportunityStage, PriorityLevel } from '../types';
import { formatCurrencyGHS, formatDate, getPriorityColor } from '../utils/formatters';

const PIPELINE_STAGES: OpportunityStage[] = [
  'New',
  'Qualification',
  'Discovery',
  'Presales',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    opportunities,
    updateOpportunity,
    deleteOpportunity,
    updateOpportunityStage,
    customers,
    products,
    presales,
    documents,
    approvals,
    serviceDeliveries,
    addPresalesRequest,
    getOrCreateCustomerByName,
  } = useAppState();
  const { showToast } = useToast();

  const [isTeModalOpen, setIsTeModalOpen] = useState(false);
  const [tefCustomerReq, setTefCustomerReq] = useState('');
  const [tefTeam, setTefTeam] = useState('Enterprise IP/MPLS Architecture');

  // Edit / Delete states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Edit form states
  const [editTitle, setEditTitle] = useState('');
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editProductId, setEditProductId] = useState('');
  const [editStage, setEditStage] = useState<OpportunityStage>('Qualification');
  const [editValueGHS, setEditValueGHS] = useState(0);
  const [editPriority, setEditPriority] = useState<PriorityLevel>('High');
  const [editExpectedCloseDate, setEditExpectedCloseDate] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const opportunity = opportunities.find((o) => o.id === id);

  if (!opportunity) {
    return (
      <div className="py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Opportunity Not Found</h3>
        <p className="text-sm text-slate-500">The requested deal ID does not exist in the pipeline.</p>
        <button
          onClick={() => navigate('/opportunities')}
          className="px-4 py-2 bg-mtn-yellow font-bold text-xs rounded-xl shadow-xs"
        >
          Return to Pipeline
        </button>
      </div>
    );
  }

  // Linked entities
  const linkedCustomer = customers.find((c) => c.id === opportunity.customerId || c.name.toLowerCase() === opportunity.customerName.toLowerCase());
  const linkedPresales = presales.find((p) => p.opportunityId === opportunity.id || p.id === opportunity.presalesId);
  const linkedApproval = approvals.find((a) => a.opportunityId === opportunity.id || a.id === opportunity.approvalId);
  const linkedDelivery = serviceDeliveries.find((d) => d.opportunityId === opportunity.id || d.id === opportunity.serviceDeliveryId);
  const linkedDocs = documents.filter((d) => d.opportunityId === opportunity.id || d.customerId === opportunity.customerId);

  // Map opportunity stage to workflow tracker step
  const getWorkflowStep = (): EnterpriseWorkflowStep => {
    if (linkedDelivery && linkedDelivery.status === 'Completed') return 'activeService';
    if (linkedDelivery) return 'delivery';
    if (linkedApproval) return 'approval';
    if (linkedDocs.length > 0 && opportunity.stage === 'Proposal') return 'documents';
    if (linkedPresales) return 'presales';
    if (opportunity.stage === 'Won') return 'approval';
    return 'opportunity';
  };

  const openEditModal = () => {
    setEditTitle(opportunity.title);
    setEditCustomerName(opportunity.customerName);
    setEditProductId(opportunity.productId || products[0]?.id || '');
    setEditStage(opportunity.stage);
    setEditValueGHS(opportunity.valueGHS);
    setEditPriority(opportunity.priority);
    setEditExpectedCloseDate(opportunity.expectedCloseDate);
    setEditDescription(opportunity.description || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomerName.trim()) {
      showToast('error', 'Validation Error', 'Customer name is required.');
      return;
    }

    const selProd = products.find((p) => p.id === editProductId) || products[0];
    const customer = getOrCreateCustomerByName(editCustomerName.trim(), 'Large Enterprise', 'General Corporate');

    updateOpportunity(opportunity.id, {
      title: editTitle.trim() || `${customer.name} — ${selProd?.name}`,
      customerId: customer.id,
      customerName: customer.name,
      productId: selProd?.id || opportunity.productId,
      productName: selProd?.name || opportunity.productName,
      category: selProd?.category || opportunity.category,
      stage: editStage,
      valueGHS: Number(editValueGHS),
      mrcGHS: Math.round(Number(editValueGHS) * 0.08),
      otcGHS: Math.round(Number(editValueGHS) * 0.2),
      expectedCloseDate: editExpectedCloseDate,
      priority: editPriority,
      probability: editStage === 'Won' ? 100 : editStage === 'Lost' ? 0 : opportunity.probability,
      status: editStage === 'Won' ? 'Won' : editStage === 'Lost' ? 'Lost' : 'Open',
      description: editDescription.trim(),
    });

    showToast('success', 'Opportunity Updated', 'Deal changes successfully saved.');
    setIsEditModalOpen(false);
  };

  const handleDeleteOpportunityConfirm = () => {
    deleteOpportunity(opportunity.id);
    showToast('info', 'Opportunity Deleted', `Deal "${opportunity.title}" removed.`);
    setIsDeleteModalOpen(false);
    navigate('/opportunities');
  };

  const handleStageChange = (newStage: OpportunityStage) => {
    updateOpportunityStage(opportunity.id, newStage);
    showToast('info', 'Stage Updated', `Opportunity is now in ${newStage} stage.`);
  };

  const handleCreateTEF = (e: React.FormEvent) => {
    e.preventDefault();
    const newPre = addPresalesRequest({
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      customerId: opportunity.customerId,
      customerName: opportunity.customerName,
      productId: opportunity.productId,
      productName: opportunity.productName,
      assignedTeam: tefTeam,
      leadEngineer: 'Ing. Justin Kwabena (Presales Specialist)',
      status: 'Assessment',
      dueDate: '2026-10-15',
      customerRequirements: tefCustomerReq || 'Full technical feasibility, route survey, and optical budget required.',
      proposedSolution: `Custom enterprise deployment for ${opportunity.productName}.`,
      technicalRequirements: [
        'Bandwidth sizing & QoS policy',
        'Last-mile route clearance',
        'Hardware staging and IP subnetting',
      ],
      dependencies: ['Site survey clearance', 'Power UPS availability'],
      risks: ['Last-mile civil works permit'],
      implementationNotes: 'Initial engagement created from opportunity workflow.',
    });

    showToast('success', 'Presales TEF Form Created', 'Technical assessment dispatched to Solutions Architecture.');
    setIsTeModalOpen(false);
    navigate(`/presales/${newPre.id}`);
  };

  const pColor = getPriorityColor(opportunity.priority);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={opportunity.title}
        subtitle={`Opportunity ID: ${opportunity.id} • Customer: ${opportunity.customerName}`}
        breadcrumbs={[
          { label: 'Opportunities', path: '/opportunities' },
          { label: opportunity.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/opportunities')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Edit Deal</span>
            </button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {opportunity.stage !== 'Won' && (
              <button
                onClick={() => handleStageChange('Won')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Won</span>
              </button>
            )}
          </div>
        }
      />

      {/* Datalist for autocomplete suggestions */}
      <datalist id="opp-detail-customer-suggestions">
        {customers.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

      {/* Visual 9-Step Lifecycle Workflow Tracker */}
      <WorkflowTracker currentStep={getWorkflowStep()} />

      {/* Main Opportunity Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Value & Scope Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Contract Value</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mt-0.5">
                  {formatCurrencyGHS(opportunity.valueGHS)}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Recurring (MRC)</span>
                  <span className="text-sm font-bold text-slate-800">{formatCurrencyGHS(opportunity.mrcGHS)} / mo</span>
                </div>
                <div className="text-right pl-3 border-l border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">One-Time Setup (OTC)</span>
                  <span className="text-sm font-bold text-slate-800">{formatCurrencyGHS(opportunity.otcGHS)}</span>
                </div>
              </div>
            </div>

            {/* Stage Selector Pill Bar */}
            <div className="mt-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Pipeline Stage Progression:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PIPELINE_STAGES.map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStageChange(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      opportunity.stage === st
                        ? 'bg-slate-900 text-mtn-yellow shadow-xs scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Scope & Commercial Summary</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {opportunity.description || 'Enterprise solution tailored for high-availability interconnect.'}
              </p>
            </div>
          </div>

          {/* Integrated Workflow Nodes Links (Presales, Approvals, Delivery) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Connected Operational Stages
            </h3>

            {/* 1. Presales / TEF Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold shrink-0 border border-amber-200">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Technical Presales & TEF Assessment</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {linkedPresales
                        ? `TEF record #${linkedPresales.id} assigned to ${linkedPresales.leadEngineer}`
                        : 'No technical assessment requested yet for this opportunity.'}
                    </p>
                  </div>
                </div>

                {linkedPresales ? (
                  <Link
                    to={`/presales/${linkedPresales.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <span>View TEF</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => setIsTeModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <span>Request Presales TEF</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. Approvals Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0 border border-purple-200">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Governance & Approval Matrix</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {linkedApproval
                        ? `Multi-step signoff #${linkedApproval.id} (${linkedApproval.status})`
                        : 'Required when deal is Won to authorize CAPEX/OPEX and commercial discounting.'}
                    </p>
                  </div>
                </div>

                {linkedApproval && (
                  <Link
                    to={`/approvals/${linkedApproval.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <span>View Matrix</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* 3. Service Delivery Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-200">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Service Delivery & Last-Mile Deployment</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {linkedDelivery
                        ? `Delivery project #${linkedDelivery.id} — ${linkedDelivery.status} (${linkedDelivery.progress}% progress)`
                        : 'Initiated after final approval signoff for physical rollout and router staging.'}
                    </p>
                  </div>
                </div>

                {linkedDelivery && (
                  <Link
                    to={`/service-delivery/${linkedDelivery.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <span>View Delivery</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          {/* Customer Profile Link Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Profile</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-mtn-yellow/20 flex items-center justify-center text-slate-900 font-extrabold border border-mtn-yellow/30">
                <Building2 className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h5 className="text-sm font-bold text-slate-900">{opportunity.customerName}</h5>
                <p className="text-xs text-slate-500">{linkedCustomer?.industry || 'Enterprise Client'}</p>
              </div>
            </div>

            {linkedCustomer && (
              <Link
                to={`/customers/${linkedCustomer.id}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-colors"
              >
                <span>Open 360° Customer Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Deal Metadata */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs border border-slate-800 space-y-3 text-xs">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-mtn-yellow">Deal Metadata</h4>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Owner:</span>
              <strong className="text-white">{opportunity.owner}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Close:</span>
              <strong className="text-white">{formatDate(opportunity.expectedCloseDate)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Probability:</span>
              <strong className="text-emerald-400">{opportunity.probability}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Priority:</span>
              <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${pColor.bg} ${pColor.text}`}>
                {opportunity.priority}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Opportunity Deal"
        subtitle={`Update parameters for deal ID ${opportunity.id}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateOpportunity} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deal Title *</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer / Company *</label>
              <input
                type="text"
                required
                list="opp-detail-customer-suggestions"
                value={editCustomerName}
                onChange={(e) => setEditCustomerName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Solution</label>
              <select
                value={editProductId}
                onChange={(e) => setEditProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stage</label>
              <select
                value={editStage}
                onChange={(e) => setEditStage(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                {PIPELINE_STAGES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Critical">🔴 Critical</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">⚪ Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Value (GHS)</label>
              <input
                type="number"
                required
                min={1000}
                step={5000}
                value={editValueGHS}
                onChange={(e) => setEditValueGHS(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Close Date</label>
            <input
              type="date"
              value={editExpectedCloseDate}
              onChange={(e) => setEditExpectedCloseDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Opportunity Deal"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs">
              Are you sure you want to delete this deal (<strong>{opportunity.title}</strong>)? All linked stages will lose the reference.
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
              onClick={handleDeleteOpportunityConfirm}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Presales TEF Modal */}
      <Modal
        isOpen={isTeModalOpen}
        onClose={() => setIsTeModalOpen(false)}
        title="Initiate Technology Engagement Form (TEF)"
        subtitle="Request solution design and feasibility report from Solutions Architecture"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTEF} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Opportunity Title</label>
            <input
              type="text"
              disabled
              value={opportunity.title}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Presales Team *</label>
            <select
              value={tefTeam}
              onChange={(e) => setTefTeam(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            >
              <option value="Enterprise IP/MPLS Architecture">Enterprise IP/MPLS Architecture</option>
              <option value="Fixed Core & Metro Fiber Engineering">Fixed Core & Metro Fiber Engineering</option>
              <option value="Satellite & IoT Solutions">Satellite & IoT Solutions</option>
              <option value="Cloud & Cyber Security Engineering">Cloud & Cyber Security Engineering</option>
              <option value="Unified Communications & Voice">Unified Communications & Voice</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Requirements & Parameters *</label>
            <textarea
              rows={3}
              required
              value={tefCustomerReq}
              onChange={(e) => setTefCustomerReq(e.target.value)}
              placeholder="Specify required bandwidth, branch locations, redundancy type, and CPE requirements..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsTeModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs"
            >
              Dispatch to Presales
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
