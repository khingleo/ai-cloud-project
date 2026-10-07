/**
 * MTN ENTERPRISE HUB - PRESALES QUEUE (CRUD & FREE-TEXT COMPANY)
 * 
 * Route: /presales
 * Manages Technology Engagement Forms (TEF) and feasibility studies across solutions engineering teams.
 * Features:
 * - Create new TEF assessment with free-text manual company entry
 * - Edit Presales Request modal
 * - Delete Presales Request confirmation modal
 * - Status filtering, full DataTable search, and direct link to detailed scoping form
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Clock,
  ArrowRight,
  PlusCircle,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import type { PresalesRequest, PresalesStatus } from '../types';
import { formatDate } from '../utils/formatters';

export const PresalesPage: React.FC = () => {
  const {
    presales,
    addPresalesRequest,
    updatePresales,
    deletePresalesRequest,
    customers,
    products,
    getOrCreateCustomerByName,
  } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPresale, setEditingPresale] = useState<PresalesRequest | null>(null);
  const [presaleToDelete, setPresaleToDelete] = useState<PresalesRequest | null>(null);

  // Form states for Create & Edit
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [opportunityTitle, setOpportunityTitle] = useState('');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [assignedTeam, setAssignedTeam] = useState('Enterprise IP/MPLS Architecture');
  const [leadEngineer, setLeadEngineer] = useState('Ing. Justin Kwabena (Presales Specialist)');
  const [dueDate, setDueDate] = useState('2026-10-25');
  const [status, setStatus] = useState<PresalesStatus>('Assessment');
  const [customerRequirements, setCustomerRequirements] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');

  const filteredPresales = presales.filter((p) => {
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    return true;
  });

  const openAddModal = () => {
    setCustomerNameInput(customers[0]?.name || '');
    setOpportunityTitle('');
    setProductId(products[0]?.id || '');
    setAssignedTeam('Enterprise IP/MPLS Architecture');
    setLeadEngineer('Ing. Justin Kwabena (Presales Specialist)');
    setDueDate('2026-10-25');
    setStatus('Assessment');
    setCustomerRequirements('');
    setProposedSolution('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: PresalesRequest) => {
    setEditingPresale(p);
    setCustomerNameInput(p.customerName);
    setOpportunityTitle(p.opportunityTitle);
    setProductId(p.productId || products[0]?.id || '');
    setAssignedTeam(p.assignedTeam);
    setLeadEngineer(p.leadEngineer);
    setDueDate(p.dueDate);
    setStatus(p.status);
    setCustomerRequirements(p.customerRequirements);
    setProposedSolution(p.proposedSolution);
  };

  const handleCreatePresale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNameInput.trim()) {
      showToast('error', 'Validation Error', 'Customer company name is required.');
      return;
    }

    const selProd = products.find((pr) => pr.id === productId) || products[0];
    const customer = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');

    const newPresale = addPresalesRequest({
      opportunityId: `OPP-DIR-${Date.now().toString().slice(-4)}`,
      opportunityTitle: opportunityTitle.trim() || `${customer.name} — ${selProd?.name || 'Technical Feasibility'}`,
      customerId: customer.id,
      customerName: customer.name,
      productId: selProd?.id || 'PROD-001',
      productName: selProd?.name || 'Enterprise Connectivity',
      assignedTeam,
      leadEngineer,
      status,
      dueDate,
      customerRequirements: customerRequirements.trim() || 'Feasibility and optical route survey required.',
      proposedSolution: proposedSolution.trim() || `Deployment design for ${selProd?.name}.`,
      technicalRequirements: [
        'Dedicated Fiber / Microwave clearance',
        'Customer Premises Equipment (CPE) staging',
        'IP Subnetting and VLAN assignment',
      ],
      dependencies: ['Building entry approval', 'AC Power availability'],
      risks: ['Last mile right-of-way permit'],
      implementationNotes: 'Initiated from central presales repository.',
    });

    showToast('success', 'Presales TEF Created', `Assessment dispatched to ${assignedTeam}.`);
    setIsAddModalOpen(false);
    navigate(`/presales/${newPresale.id}`);
  };

  const handleUpdatePresale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPresale) return;
    if (!customerNameInput.trim()) {
      showToast('error', 'Validation Error', 'Customer company name is required.');
      return;
    }

    const selProd = products.find((pr) => pr.id === productId) || products[0];
    const customer = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');

    updatePresales(editingPresale.id, {
      opportunityTitle: opportunityTitle.trim() || editingPresale.opportunityTitle,
      customerId: customer.id,
      customerName: customer.name,
      productId: selProd?.id || editingPresale.productId,
      productName: selProd?.name || editingPresale.productName,
      assignedTeam,
      leadEngineer,
      status,
      dueDate,
      customerRequirements: customerRequirements.trim(),
      proposedSolution: proposedSolution.trim(),
    });

    showToast('success', 'Presales Updated', `Assessment details updated for ${customer.name}.`);
    setEditingPresale(null);
  };

  const handleDeleteConfirm = () => {
    if (!presaleToDelete) return;
    deletePresalesRequest(presaleToDelete.id);
    showToast('info', 'Assessment Deleted', `Presales record #${presaleToDelete.id} removed.`);
    setPresaleToDelete(null);
  };

  const columns: Column<PresalesRequest>[] = [
    {
      header: 'Presales Request & Deal',
      accessor: (p) => (
        <div>
          <span className="font-bold text-slate-900 text-sm hover:text-amber-900 transition-colors">
            {p.opportunityTitle}
          </span>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" /> {p.customerName}
          </p>
        </div>
      ),
    },
    {
      header: 'Product',
      accessor: (p) => <span className="font-semibold text-slate-800 text-xs">{p.productName}</span>,
    },
    {
      header: 'Assigned Architecture Team',
      accessor: (p) => (
        <div>
          <p className="font-medium text-slate-900 text-xs">{p.assignedTeam}</p>
          <p className="text-[11px] text-slate-500">Lead: {p.leadEngineer}</p>
        </div>
      ),
    },
    {
      header: 'Due Date',
      accessor: (p) => (
        <span className="text-xs text-slate-700 font-semibold flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatDate(p.dueDate)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (p) => <StatusBadge status={p.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <PermissionGate action="edit">
            <button
              onClick={() => openEditModal(p)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit Assessment"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <PermissionGate action="delete">
            <button
              onClick={() => setPresaleToDelete(p)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete Request"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <button
            onClick={() => navigate(`/presales/${p.id}`)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
          >
            <span>Scoping</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Presales & Technical Scoping"
        subtitle="Technology Engagement Forms (TEF), feasibility studies, network topology design, and optical budgets"
        breadcrumbs={[{ label: 'Presales' }]}
        actions={
          <PermissionGate action="add">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New TEF Request</span>
            </button>
          </PermissionGate>
        }
      />

      {/* Datalist for suggestions */}
      <datalist id="presales-customer-suggestions">
        {customers.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
          >
            <option value="ALL">All Statuses ({presales.length})</option>
            <option value="Pending">Pending</option>
            <option value="Assessment">Assessment</option>
            <option value="Technical Review">Technical Review</option>
            <option value="Completed">Completed</option>
            <option value="Returned">Returned</option>
          </select>
        </div>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          Showing <strong>{filteredPresales.length}</strong> technical assessments
        </span>
      </div>

      {/* Presales Requests Table */}
      <DataTable
        columns={columns}
        data={filteredPresales}
        searchPlaceholder="Search assessments by customer or deal title..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return (
            item.customerName.toLowerCase().includes(q) ||
            item.opportunityTitle.toLowerCase().includes(q) ||
            item.productName.toLowerCase().includes(q) ||
            item.leadEngineer.toLowerCase().includes(q)
          );
        }}
        onRowClick={(p) => navigate(`/presales/${p.id}`)}
      />

      {/* CREATE PRE-SALES MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Initiate Presales Engagement Form (TEF)"
        subtitle="Request engineering feasibility and solution architecture scoping"
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePresale} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company / Customer * (Type Any)</label>
              <input
                type="text"
                required
                list="presales-customer-suggestions"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                placeholder="Type any enterprise customer..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project / Opportunity Title</label>
              <input
                type="text"
                value={opportunityTitle}
                onChange={(e) => setOpportunityTitle(e.target.value)}
                placeholder="e.g. Headquarters Optical Fiber Ring"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Solution *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category}] {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Engineering Team *</label>
              <select
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Enterprise IP/MPLS Architecture">Enterprise IP/MPLS Architecture</option>
                <option value="Fixed Core & Metro Fiber Engineering">Fixed Core & Metro Fiber Engineering</option>
                <option value="Satellite & IoT Solutions">Satellite & IoT Solutions</option>
                <option value="Cloud & Cyber Security Engineering">Cloud & Cyber Security Engineering</option>
                <option value="Unified Communications & Voice">Unified Communications & Voice</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lead Presales Specialist</label>
              <input
                type="text"
                value={leadEngineer}
                onChange={(e) => setLeadEngineer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Assessment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Requirements & Parameters</label>
            <textarea
              rows={2}
              value={customerRequirements}
              onChange={(e) => setCustomerRequirements(e.target.value)}
              placeholder="Specify required bandwidth, branch sites, redundancy, and SLA tier..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs transition-all"
            >
              Dispatch TEF
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={!!editingPresale}
        onClose={() => setEditingPresale(null)}
        title="Edit Presales Assessment"
        subtitle={`Update TEF record #${editingPresale?.id}`}
        maxWidth="lg"
      >
        {editingPresale && (
          <form onSubmit={handleUpdatePresale} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  list="presales-customer-suggestions"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Opportunity Title</label>
                <input
                  type="text"
                  value={opportunityTitle}
                  onChange={(e) => setOpportunityTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PresalesStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Pending">Pending</option>
                  <option value="Assessment">Assessment</option>
                  <option value="Technical Review">Technical Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Team</label>
                <select
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Enterprise IP/MPLS Architecture">Enterprise IP/MPLS Architecture</option>
                  <option value="Fixed Core & Metro Fiber Engineering">Fixed Core & Metro Fiber Engineering</option>
                  <option value="Satellite & IoT Solutions">Satellite & IoT Solutions</option>
                  <option value="Cloud & Cyber Security Engineering">Cloud & Cyber Security Engineering</option>
                  <option value="Unified Communications & Voice">Unified Communications & Voice</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lead Engineer</label>
                <input
                  type="text"
                  value={leadEngineer}
                  onChange={(e) => setLeadEngineer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Requirements</label>
              <textarea
                rows={2}
                value={customerRequirements}
                onChange={(e) => setCustomerRequirements(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Proposed Solution</label>
              <textarea
                rows={2}
                value={proposedSolution}
                onChange={(e) => setProposedSolution(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPresale(null)}
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
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={!!presaleToDelete}
        onClose={() => setPresaleToDelete(null)}
        title="Delete Presales Request"
        maxWidth="sm"
      >
        {presaleToDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs">
                Are you sure you want to delete technical assessment #{presaleToDelete.id} ({presaleToDelete.opportunityTitle})?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPresaleToDelete(null)}
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
        )}
      </Modal>
    </div>
  );
};
