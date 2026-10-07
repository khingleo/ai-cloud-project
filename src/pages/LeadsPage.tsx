/**
 * MTN ENTERPRISE HUB - LEADS MANAGEMENT PAGE (CRUD & MANUAL ENTRY)
 * 
 * Route: /leads
 * Captures inbound leads from CEX, Virtual Sales, and KAMs.
 * Features:
 * - Free-text manual Company Name entry (any company can be typed directly)
 * - Full CRUD: Add Lead, Edit Lead modal, Delete Lead with confirmation
 * - 1-Click qualification & conversion to Sales Opportunity
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Flame,
  Edit2,
  Trash2,
  ArrowRightCircle,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import type { Lead, LeadQualification, LeadSource, LeadStatus } from '../types';
import { formatCurrencyGHS } from '../utils/formatters';

export const LeadsPage: React.FC = () => {
  const { leads, addLead, updateLead, deleteLead, convertLeadToOpportunity, products, customers, getOrCreateCustomerByName } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Form states for Create / Edit
  const [leadName, setLeadName] = useState('');
  const [company, setCompany] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>('CEX');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [segment, setSegment] = useState<'Large Enterprise' | 'SME' | 'Public Sector' | 'Multinational'>('Large Enterprise');
  const [qualification, setQualification] = useState<LeadQualification>('Hot');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [estimatedValueGHS, setEstimatedValueGHS] = useState(150000);
  const [notes, setNotes] = useState('');

  const filteredLeads = leads.filter((l) => {
    if (selectedStatus !== 'ALL' && l.status !== selectedStatus) return false;
    return true;
  });

  const openAddModal = () => {
    setLeadName('');
    setCompany('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setSource('CEX');
    setProductId(products[0]?.id || '');
    setSegment('Large Enterprise');
    setQualification('Hot');
    setStatus('New');
    setEstimatedValueGHS(150000);
    setNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setLeadName(lead.leadName);
    setCompany(lead.company);
    setContactPerson(lead.contactPerson);
    setEmail(lead.email || '');
    setPhone(lead.phone);
    setSource(lead.source);
    setProductId(lead.productId || products[0]?.id || '');
    setSegment(lead.segment as any || 'Large Enterprise');
    setQualification(lead.qualification);
    setStatus(lead.status);
    setEstimatedValueGHS(lead.estimatedValueGHS);
    setNotes(lead.notes || '');
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      showToast('error', 'Validation Error', 'Please specify a company name.');
      return;
    }

    const selProd = products.find((p) => p.id === productId) || products[0];

    // Ensure company is recognized or auto-registered in customer base
    getOrCreateCustomerByName(company.trim(), segment, 'Other');

    addLead({
      leadName: leadName.trim() || `${company.trim()} — ${selProd?.name || 'Enterprise Solution'}`,
      company: company.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      source,
      productInterest: selProd?.name || 'Enterprise Connectivity',
      productId: selProd?.id,
      segment,
      owner: 'Kwame Mensah',
      qualification,
      status: 'New',
      estimatedValueGHS: Number(estimatedValueGHS),
      notes: notes.trim(),
    });

    showToast('success', 'Lead Created', `New enterprise lead registered for ${company.trim()}.`);
    setIsAddModalOpen(false);
  };

  const handleUpdateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    if (!company.trim()) {
      showToast('error', 'Validation Error', 'Please specify a company name.');
      return;
    }

    const selProd = products.find((p) => p.id === productId) || products[0];

    // Auto-sync customer register
    getOrCreateCustomerByName(company.trim(), segment, 'Other');

    updateLead(editingLead.id, {
      leadName: leadName.trim() || `${company.trim()} — ${selProd?.name || 'Enterprise Solution'}`,
      company: company.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      source,
      productInterest: selProd?.name || editingLead.productInterest,
      productId: selProd?.id || editingLead.productId,
      segment,
      qualification,
      status,
      estimatedValueGHS: Number(estimatedValueGHS),
      notes: notes.trim(),
    });

    showToast('success', 'Lead Updated', `Changes to lead "${company.trim()}" saved.`);
    setEditingLead(null);
  };

  const handleDeleteLeadConfirm = () => {
    if (!leadToDelete) return;
    deleteLead(leadToDelete.id);
    showToast('info', 'Lead Deleted', `Lead for "${leadToDelete.company}" removed.`);
    setLeadToDelete(null);
  };

  const handleConvert = (leadId: string, companyName: string) => {
    const newOpp = convertLeadToOpportunity(leadId);
    if (newOpp) {
      showToast('success', 'Lead Converted', `${companyName} successfully converted to an active Opportunity.`);
      navigate(`/opportunities/${newOpp.id}`);
    }
  };

  const columns: Column<Lead>[] = [
    {
      header: 'Lead & Company',
      accessor: (l) => (
        <div>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900 text-sm">{l.company}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-5">{l.leadName}</p>
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessor: (l) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{l.contactPerson}</p>
          <p className="text-slate-500">{l.phone}</p>
          {l.email && <p className="text-slate-400 text-[11px]">{l.email}</p>}
        </div>
      ),
    },
    {
      header: 'Product Interest',
      accessor: (l) => (
        <span className="font-medium text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded-md">
          {l.productInterest}
        </span>
      ),
    },
    {
      header: 'Source',
      accessor: (l) => <span className="text-xs font-semibold text-slate-600">{l.source}</span>,
    },
    {
      header: 'Qualification',
      accessor: (l) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            l.qualification === 'Hot'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : l.qualification === 'Warm'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Flame className="w-3 h-3" />
          {l.qualification}
        </span>
      ),
    },
    {
      header: 'Est. Value',
      accessor: (l) => (
        <span className="font-bold text-slate-900 text-xs">{formatCurrencyGHS(l.estimatedValueGHS)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (l) => <StatusBadge status={l.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (l) => (
        <div className="flex items-center justify-end gap-1.5">
          {l.status !== 'Converted' ? (
            <button
              onClick={() => handleConvert(l.id, l.company)}
              title="Convert to Opportunity"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors"
            >
              <ArrowRightCircle className="w-3.5 h-3.5" />
              <span>Convert</span>
            </button>
          ) : (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Converted ✓
            </span>
          )}
          <PermissionGate action="edit">
            <button
              onClick={() => openEditModal(l)}
              title="Edit Lead"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <PermissionGate action="delete">
            <button
              onClick={() => setLeadToDelete(l)}
              title="Delete Lead"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Enterprise Leads"
        subtitle="Manage inbound prospects, qualify opportunities, and convert leads into the sales workflow"
        breadcrumbs={[{ label: 'Leads' }]}
        actions={
          <PermissionGate action="add">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Lead</span>
            </button>
          </PermissionGate>
        }
      />

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Filter Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
          >
            <option value="ALL">All Statuses ({leads.length})</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
            <option value="Unqualified">Unqualified</option>
          </select>
        </div>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          Showing <strong>{filteredLeads.length}</strong> enterprise leads
        </span>
      </div>

      {/* Leads Table */}
      <DataTable
        columns={columns}
        data={filteredLeads}
        searchPlaceholder="Search leads by company, contact person, or product..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return (
            item.company.toLowerCase().includes(q) ||
            item.contactPerson.toLowerCase().includes(q) ||
            item.productInterest.toLowerCase().includes(q)
          );
        }}
      />

      {/* Datalist for automatic suggestions while keeping manual entry free */}
      <datalist id="leads-company-suggestions">
        {customers.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

      {/* CREATE LEAD MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Enterprise Lead"
        subtitle="Capture prospective client interest with manual company entry or suggestions"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Name * (Type Any)</label>
              <input
                type="text"
                required
                list="leads-company-suggestions"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Type any company name..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Enter any enterprise name manually</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lead Project Title</label>
              <input
                type="text"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="e.g. Headquarters Dedicated Internet"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Person *</label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Ing. Samuel Darko"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 24 000 9988"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer Segment</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Large Enterprise">Large Enterprise</option>
                <option value="SME">SME</option>
                <option value="Public Sector">Public Sector</option>
                <option value="Multinational">Multinational</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lead Source *</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="CEX">CEX / Customer Experience</option>
                <option value="Virtual Sales">Virtual Sales</option>
                <option value="Sales Agent">Sales Agent</option>
                <option value="KAM Sourced">KAM Sourced</option>
                <option value="Direct Inbound">Direct Inbound</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Solution *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Qualification *</label>
              <select
                value={qualification}
                onChange={(e) => setQualification(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Hot">🔥 Hot</option>
                <option value="Warm">⚡ Warm</option>
                <option value="Cold">❄️ Cold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Value (GHS) *</label>
              <input
                type="number"
                min={1000}
                step={5000}
                value={estimatedValueGHS}
                onChange={(e) => setEstimatedValueGHS(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Qualification Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key requirements, client pain points, or expected delivery timeline..."
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
              Save Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT LEAD MODAL */}
      <Modal
        isOpen={!!editingLead}
        onClose={() => setEditingLead(null)}
        title="Edit Enterprise Lead"
        subtitle={`Update details for ${editingLead?.company}`}
        maxWidth="lg"
      >
        {editingLead && (
          <form onSubmit={handleUpdateLead} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  list="leads-company-suggestions"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lead Title</label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Converted">Converted</option>
                  <option value="Unqualified">Unqualified</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lead Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="CEX">CEX / Customer Experience</option>
                  <option value="Virtual Sales">Virtual Sales</option>
                  <option value="Sales Agent">Sales Agent</option>
                  <option value="KAM Sourced">KAM Sourced</option>
                  <option value="Direct Inbound">Direct Inbound</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Segment</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Large Enterprise">Large Enterprise</option>
                  <option value="SME">SME</option>
                  <option value="Public Sector">Public Sector</option>
                  <option value="Multinational">Multinational</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Solution</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Qualification</label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Hot">🔥 Hot</option>
                  <option value="Warm">⚡ Warm</option>
                  <option value="Cold">❄️ Cold</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Value (GHS)</label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={estimatedValueGHS}
                  onChange={(e) => setEstimatedValueGHS(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Qualification Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs transition-all"
              >
                Update Lead
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        title="Delete Enterprise Lead"
        maxWidth="sm"
      >
        {leadToDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs">
                Are you sure you want to delete the lead for <strong>{leadToDelete.company}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteLeadConfirm}
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
