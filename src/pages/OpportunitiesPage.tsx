/**
 * MTN ENTERPRISE HUB - OPPORTUNITIES PIPELINE PAGE (CRUD & FREE-TEXT COMPANY)
 * 
 * Route: /opportunities
 * Features:
 * - Interactive Kanban & Table Views across 8 pipeline stages
 * - Manual free-text company entry with auto-customer resolution
 * - Full CRUD: Create Opportunity, Edit Opportunity modal, Delete Opportunity with confirmation
 * - 1-Click stage progression and automated enterprise workflow link
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  LayoutGrid,
  List,
  Building2,
  ChevronRight,
  ArrowRight,
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
import type { Opportunity, OpportunityStage, PriorityLevel } from '../types';
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

export const OpportunitiesPage: React.FC = () => {
  const {
    opportunities,
    updateOpportunityStage,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    customers,
    products,
    getOrCreateCustomerByName,
  } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [oppToDelete, setOppToDelete] = useState<Opportunity | null>(null);

  // Form states for Create & Edit
  const [title, setTitle] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [stage, setStage] = useState<OpportunityStage>('Qualification');
  const [valueGHS, setValueGHS] = useState(250000);
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [expectedCloseDate, setExpectedCloseDate] = useState('2026-11-30');
  const [description, setDescription] = useState('');

  const filteredOpportunities = opportunities.filter((o) => {
    if (selectedStage !== 'ALL' && o.stage !== selectedStage) return false;
    return true;
  });

  const openAddModal = () => {
    setTitle('');
    setCustomerNameInput(customers[0]?.name || '');
    setProductId(products[0]?.id || '');
    setStage('Qualification');
    setValueGHS(250000);
    setPriority('High');
    setExpectedCloseDate('2026-11-30');
    setDescription('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (opp: Opportunity) => {
    setEditingOpp(opp);
    setTitle(opp.title);
    setCustomerNameInput(opp.customerName);
    setProductId(opp.productId || products[0]?.id || '');
    setStage(opp.stage);
    setValueGHS(opp.valueGHS);
    setPriority(opp.priority);
    setExpectedCloseDate(opp.expectedCloseDate);
    setDescription(opp.description || '');
  };

  const handleCreateOpp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNameInput.trim()) {
      showToast('error', 'Validation Error', 'Please specify a customer company name.');
      return;
    }

    const selProd = products.find((p) => p.id === productId) || products[0];
    const customer = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');

    const newOpp = addOpportunity({
      title: title.trim() || `${customer.name} — ${selProd?.name || 'Enterprise Solution'}`,
      customerId: customer.id,
      customerName: customer.name,
      productId: selProd?.id || 'PROD-001',
      productName: selProd?.name || 'Dedicated Internet',
      category: selProd?.category || 'Fixed',
      stage,
      valueGHS: Number(valueGHS),
      mrcGHS: Math.round(Number(valueGHS) * 0.08),
      otcGHS: Math.round(Number(valueGHS) * 0.2),
      owner: 'Kwame Mensah',
      expectedCloseDate,
      priority,
      probability: stage === 'Won' ? 100 : stage === 'Lost' ? 0 : 50,
      status: stage === 'Won' ? 'Won' : stage === 'Lost' ? 'Lost' : 'Open',
      presalesRequired: true,
      description: description.trim(),
    });

    showToast('success', 'Opportunity Created', `Deal registered for ${customer.name}.`);
    setIsAddModalOpen(false);
    navigate(`/opportunities/${newOpp.id}`);
  };

  const handleUpdateOpp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpp) return;
    if (!customerNameInput.trim()) {
      showToast('error', 'Validation Error', 'Please enter a customer company name.');
      return;
    }

    const selProd = products.find((p) => p.id === productId) || products[0];
    const customer = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');

    updateOpportunity(editingOpp.id, {
      title: title.trim() || `${customer.name} — ${selProd?.name || 'Enterprise Solution'}`,
      customerId: customer.id,
      customerName: customer.name,
      productId: selProd?.id || editingOpp.productId,
      productName: selProd?.name || editingOpp.productName,
      category: selProd?.category || editingOpp.category,
      stage,
      valueGHS: Number(valueGHS),
      mrcGHS: Math.round(Number(valueGHS) * 0.08),
      otcGHS: Math.round(Number(valueGHS) * 0.2),
      expectedCloseDate,
      priority,
      probability: stage === 'Won' ? 100 : stage === 'Lost' ? 0 : editingOpp.probability,
      status: stage === 'Won' ? 'Won' : stage === 'Lost' ? 'Lost' : 'Open',
      description: description.trim(),
    });

    showToast('success', 'Opportunity Updated', `Deal details updated for ${customer.name}.`);
    setEditingOpp(null);
  };

  const handleDeleteOppConfirm = () => {
    if (!oppToDelete) return;
    deleteOpportunity(oppToDelete.id);
    showToast('info', 'Opportunity Deleted', `Deal "${oppToDelete.title}" removed from pipeline.`);
    setOppToDelete(null);
  };

  const handleStageAdvance = (e: React.MouseEvent, oppId: string, currentStage: OpportunityStage) => {
    e.stopPropagation();
    const currentIdx = PIPELINE_STAGES.indexOf(currentStage);
    if (currentIdx < PIPELINE_STAGES.length - 2) {
      const nextStage = PIPELINE_STAGES[currentIdx + 1];
      updateOpportunityStage(oppId, nextStage);
      showToast('info', 'Stage Advanced', `Opportunity moved to ${nextStage}.`);
    } else if (currentStage === 'Negotiation') {
      updateOpportunityStage(oppId, 'Won');
      showToast('success', 'Deal Won 🎉', `Opportunity closed won! Moved to Approval queue.`);
    }
  };

  const columns: Column<Opportunity>[] = [
    {
      header: 'Opportunity & Customer',
      accessor: (o) => (
        <div>
          <span className="font-bold text-slate-900 text-sm hover:text-amber-900 transition-colors">
            {o.title}
          </span>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" /> {o.customerName}
          </p>
        </div>
      ),
    },
    {
      header: 'Product / Solution',
      accessor: (o) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{o.productName}</p>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{o.category}</span>
        </div>
      ),
    },
    {
      header: 'Stage',
      accessor: (o) => <StatusBadge status={o.stage} size="sm" />,
    },
    {
      header: 'Deal Value',
      accessor: (o) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{formatCurrencyGHS(o.valueGHS)}</p>
          {o.mrcGHS && <p className="text-[10px] text-slate-400">MRC: {formatCurrencyGHS(o.mrcGHS)}/mo</p>}
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: (o) => {
        const pColor = getPriorityColor(o.priority);
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${pColor.bg} ${pColor.text}`}>
            {o.priority}
          </span>
        );
      },
    },
    {
      header: 'Expected Close',
      accessor: (o) => <span className="text-xs text-slate-600 font-medium">{formatDate(o.expectedCloseDate)}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (o) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {o.stage !== 'Won' && o.stage !== 'Lost' && (
            <button
              onClick={(e) => handleStageAdvance(e, o.id, o.stage)}
              className="px-2 py-1 bg-slate-100 hover:bg-mtn-yellow text-slate-800 hover:text-black font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
              title="Advance to next stage"
            >
              <span>Advance</span> <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <PermissionGate action="edit">
            <button
              onClick={() => openEditModal(o)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit Opportunity"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <PermissionGate action="delete">
            <button
              onClick={() => setOppToDelete(o)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete Opportunity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <button
            onClick={() => navigate(`/opportunities/${o.id}`)}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Opportunities Pipeline"
        subtitle="Track deals across the 8-stage enterprise sales lifecycle from lead qualification to closed won"
        breadcrumbs={[{ label: 'Opportunities' }]}
        actions={
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'kanban' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <PermissionGate action="add">
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Opportunity</span>
              </button>
            </PermissionGate>
          </div>
        }
      />

      {/* Datalist for autocomplete suggestions */}
      <datalist id="opp-customer-suggestions">
        {customers.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex items-start gap-4 min-w-[1300px]">
            {PIPELINE_STAGES.map((st) => {
              const stageDeals = opportunities.filter((o) => o.stage === st);
              const stageValue = stageDeals.reduce((sum, d) => sum + d.valueGHS, 0);

              return (
                <div
                  key={st}
                  className="w-72 shrink-0 bg-slate-100/70 rounded-2xl border border-slate-200/80 flex flex-col max-h-[75vh]"
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-slate-200/60 bg-white/70 rounded-t-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${st === 'Won' ? 'bg-emerald-500' : st === 'Lost' ? 'bg-rose-500' : 'bg-mtn-yellow'}`} />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {st}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                          {stageDeals.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {formatCurrencyGHS(stageValue)}
                      </p>
                    </div>
                  </div>

                  {/* Deals List in Column */}
                  <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                    {stageDeals.map((opp) => {
                      const pColor = getPriorityColor(opp.priority);
                      return (
                        <div
                          key={opp.id}
                          onClick={() => navigate(`/opportunities/${opp.id}`)}
                          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs hover:shadow-md hover:border-mtn-yellow/60 cursor-pointer transition-all duration-150 group"
                        >
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {opp.id}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${pColor.bg} ${pColor.text}`}>
                                {opp.priority}
                              </span>
                              <PermissionGate action="edit">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(opp);
                                  }}
                                  title="Edit Opportunity"
                                  className="p-0.5 text-slate-400 hover:text-slate-900 rounded"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </PermissionGate>
                              <PermissionGate action="delete">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOppToDelete(opp);
                                  }}
                                  title="Delete Opportunity"
                                  className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </PermissionGate>
                            </div>
                          </div>

                          <h5 className="text-xs font-bold text-slate-900 group-hover:text-amber-950 leading-snug line-clamp-2">
                            {opp.title}
                          </h5>

                          <p className="text-[11px] text-slate-500 mt-1 truncate">
                            {opp.customerName}
                          </p>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900">
                              {formatCurrencyGHS(opp.valueGHS)}
                            </span>

                            {opp.stage !== 'Won' && opp.stage !== 'Lost' && (
                              <button
                                onClick={(e) => handleStageAdvance(e, opp.id, opp.stage)}
                                className="text-[10px] font-bold text-amber-900 hover:text-black bg-amber-50 hover:bg-mtn-yellow px-2 py-0.5 rounded transition-colors"
                                title="Advance Stage"
                              >
                                Move →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {stageDeals.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-xs italic">
                        No deals in {st}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-slate-400">Filter Stage:</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            >
              <option value="ALL">All Stages ({opportunities.length})</option>
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s} ({opportunities.filter((o) => o.stage === s).length})
                </option>
              ))}
            </select>
          </div>

          <DataTable
            columns={columns}
            data={filteredOpportunities}
            searchPlaceholder="Search opportunities by deal title, customer, or product..."
            searchFilter={(item, query) => {
              const q = query.toLowerCase();
              return (
                item.title.toLowerCase().includes(q) ||
                item.customerName.toLowerCase().includes(q) ||
                item.productName.toLowerCase().includes(q)
              );
            }}
            onRowClick={(o) => navigate(`/opportunities/${o.id}`)}
          />
        </div>
      )}

      {/* CREATE OPPORTUNITY MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Enterprise Deal"
        subtitle="Initiate a sales opportunity in the MTN Ghana pipeline with manual company name entry"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOpp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Headquarters Dedicated Internet & SD-WAN"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer / Company * (Type Any)</label>
              <input
                type="text"
                required
                list="opp-customer-suggestions"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                placeholder="Type any company name..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Enter any enterprise or select suggested</span>
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Stage *</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Critical">🔴 Critical</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">⚪ Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Value (GHS) *</label>
              <input
                type="number"
                required
                min={5000}
                step={5000}
                value={valueGHS}
                onChange={(e) => setValueGHS(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Close Date</label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deal Description & Scope</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scope details and technical parameters..."
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
              Create Opportunity
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT OPPORTUNITY MODAL */}
      <Modal
        isOpen={!!editingOpp}
        onClose={() => setEditingOpp(null)}
        title="Edit Opportunity Deal"
        subtitle={`Update parameters for deal ID ${editingOpp?.id}`}
        maxWidth="lg"
      >
        {editingOpp && (
          <form onSubmit={handleUpdateOpp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deal Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer / Company *</label>
                <input
                  type="text"
                  required
                  list="opp-customer-suggestions"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Solution</label>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
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
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
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
                  value={valueGHS}
                  onChange={(e) => setValueGHS(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Close Date</label>
              <input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingOpp(null)}
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

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!oppToDelete}
        onClose={() => setOppToDelete(null)}
        title="Delete Opportunity Deal"
        maxWidth="sm"
      >
        {oppToDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs">
                Are you sure you want to delete deal <strong>"{oppToDelete.title}"</strong> for <strong>{oppToDelete.customerName}</strong>?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOppToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOppConfirm}
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
