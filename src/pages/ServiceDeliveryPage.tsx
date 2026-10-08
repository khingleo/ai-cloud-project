/**
 * MTN ENTERPRISE HUB - SERVICE DELIVERY & FIELD PROVISIONING (CRUD)
 * 
 * Route: /service-delivery
 * Manages post-approval civil works, fiber blowing, circuit provisioning, and customer UAT handovers.
 * Features:
 * - Create new delivery project with manual free-text company entry
 * - Edit Service Delivery project modal
 * - Delete Service Delivery project confirmation modal
 * - Quick Progress slider modal
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
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
import { ProgressBar } from '../components/common/ProgressBar';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import type { ServiceDelivery, DeliveryStatus, ProductCategory } from '../types';
import { formatDate } from '../utils/formatters';

export const ServiceDeliveryPage: React.FC = () => {
  const {
    serviceDeliveries,
    addServiceDelivery,
    updateServiceDelivery,
    deleteServiceDelivery,
    updateDeliveryProgress,
    opportunities,
    approvals,
    updateOpportunity,
    customers,
    products,
    getOrCreateCustomerByName,
  } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [activeDeliveryForSlider, setActiveDeliveryForSlider] = useState<ServiceDelivery | null>(null);
  const [newProgress, setNewProgress] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<ServiceDelivery | null>(null);
  const [deliveryToDelete, setDeliveryToDelete] = useState<ServiceDelivery | null>(null);

  // Form states
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [opportunityTitle, setOpportunityTitle] = useState('');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [deliveryTeam, setDeliveryTeam] = useState('Fixed Metro Fiber Engineering');
  const [projectManager, setProjectManager] = useState('Ing. Samuel Darko (Senior Field Architect)');
  const [status, setStatus] = useState<DeliveryStatus>('In Progress');
  const [progressVal, setProgressVal] = useState(25);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [expectedCompletion, setExpectedCompletion] = useState('2026-11-15');

  const filteredDeliveries = serviceDeliveries.filter((d) => {
    if (selectedStatus !== 'ALL' && d.status !== selectedStatus) return false;
    return true;
  });

  const handleOpenSlider = (delivery: ServiceDelivery) => {
    setActiveDeliveryForSlider(delivery);
    setNewProgress(delivery.progress);
  };

  const handleSaveProgress = () => {
    if (!activeDeliveryForSlider) return;
    updateDeliveryProgress(activeDeliveryForSlider.id, newProgress);
    showToast('success', 'Progress Updated', `${activeDeliveryForSlider.customerName} project is now at ${newProgress}%.`);
    setActiveDeliveryForSlider(null);
  };

  const openAddModal = () => {
    setCustomerNameInput(customers[0]?.name || '');
    setOpportunityTitle('');
    setProductId(products[0]?.id || '');
    setDeliveryTeam('Fixed Metro Fiber Engineering');
    setProjectManager('Ing. Samuel Darko (Senior Field Architect)');
    setStatus('In Progress');
    setProgressVal(10);
    setStartDate('2026-10-01');
    setExpectedCompletion('2026-11-15');
    setIsAddModalOpen(true);
  };

  const openEditModal = (d: ServiceDelivery) => {
    setEditingDelivery(d);
    setCustomerNameInput(d.customerName);
    setOpportunityTitle(d.opportunityTitle);
    setProductId(d.productId || products[0]?.id || '');
    setDeliveryTeam(d.deliveryTeam);
    setProjectManager(d.projectManager);
    setStatus(d.status);
    setProgressVal(d.progress);
    setStartDate(d.startDate);
    setExpectedCompletion(d.expectedCompletion);
  };

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNameInput.trim()) {
      showToast('error', 'Validation Error', 'Customer company name is required.');
      return;
    }

    const matchingOpportunity = opportunities.find((opportunity) =>
      opportunity.title.trim().toLowerCase() === opportunityTitle.trim().toLowerCase() &&
      opportunity.customerName.trim().toLowerCase() === customerNameInput.trim().toLowerCase()
    );
    if (matchingOpportunity) {
      const approval = approvals.find((item) => item.opportunityId === matchingOpportunity.id);
      if (matchingOpportunity.status !== 'Won' || approval?.status !== 'Approved') {
        showToast('error', 'Approval Required', 'The linked opportunity must be won and fully approved before delivery can begin.');
        return;
      }
      if (matchingOpportunity.serviceDeliveryId || serviceDeliveries.some((delivery) => delivery.opportunityId === matchingOpportunity.id)) {
        showToast('error', 'Delivery Already Exists', 'A delivery project is already linked to this opportunity.');
        return;
      }
    }

    const selProd = products.find((pr) => pr.id === productId) || products[0];
    const customer = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');

    const delivery = addServiceDelivery({
      opportunityId: matchingOpportunity?.id || `OPP-DEL-${Date.now().toString().slice(-4)}`,
      opportunityTitle: opportunityTitle.trim() || `${customer.name} — ${selProd?.name}`,
      customerId: customer.id,
      customerName: customer.name,
      productId: selProd?.id || 'PROD-001',
      productName: selProd?.name || 'Dedicated Internet',
      category: (selProd?.category || 'Fixed') as ProductCategory,
      deliveryTeam,
      projectManager,
      status,
      progress: Number(progressVal),
      startDate,
      expectedCompletion,
      milestones: [
        { title: 'Last-Mile Route & Civil Works Clearance', status: 'Completed', date: startDate },
        { title: 'Optical Fiber Splicing & Patching', status: 'In Progress', date: startDate },
        { title: 'CPE Staging, BGP Routing & Subnetting', status: 'Pending', date: expectedCompletion },
        { title: 'Customer UAT & Technical Sign-Off', status: 'Pending', date: expectedCompletion },
      ],
      siteLocation: 'Greater Accra Hub, Ring Road Central',
      notes: 'Provisioned from Service Delivery workspace.',
    });
    if (matchingOpportunity) {
      updateOpportunity(matchingOpportunity.id, { serviceDeliveryId: delivery.id });
    }

    showToast('success', 'Project Registered', `Service delivery initiated for ${customer.name}.`);
    setIsAddModalOpen(false);
  };

  const handleUpdateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelivery) return;
    if (!customerNameInput.trim()) {
      showToast('error', 'Validation Error', 'Customer company name is required.');
      return;
    }

    const selProd = products.find((pr) => pr.id === productId) || products[0];
    const customer = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');

    updateServiceDelivery(editingDelivery.id, {
      opportunityTitle: opportunityTitle.trim() || editingDelivery.opportunityTitle,
      customerId: customer.id,
      customerName: customer.name,
      productId: selProd?.id || editingDelivery.productId,
      productName: selProd?.name || editingDelivery.productName,
      category: (selProd?.category || editingDelivery.category) as ProductCategory,
      deliveryTeam,
      projectManager,
      status,
      progress: Number(progressVal),
      startDate,
      expectedCompletion,
    });

    showToast('success', 'Project Updated', `Delivery details for ${customer.name} saved.`);
    setEditingDelivery(null);
  };

  const handleDeleteConfirm = () => {
    if (!deliveryToDelete) return;
    deleteServiceDelivery(deliveryToDelete.id);
    showToast('info', 'Project Deleted', `Delivery project #${deliveryToDelete.id} removed.`);
    setDeliveryToDelete(null);
  };

  const columns: Column<ServiceDelivery>[] = [
    {
      header: 'Customer & Project',
      accessor: (d) => (
        <div>
          <span className="font-bold text-slate-900 text-sm hover:text-amber-900 transition-colors">
            {d.customerName}
          </span>
          <p className="text-xs text-slate-500 mt-0.5">{d.opportunityTitle}</p>
        </div>
      ),
    },
    {
      header: 'Solution Product',
      accessor: (d) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{d.productName}</p>
          <span className="text-[10px] text-slate-400 font-bold uppercase">{d.category}</span>
        </div>
      ),
    },
    {
      header: 'Field Engineering Team',
      accessor: (d) => (
        <div>
          <p className="font-medium text-slate-900 text-xs">{d.deliveryTeam}</p>
          <p className="text-[11px] text-slate-500">Lead: {d.projectManager}</p>
        </div>
      ),
    },
    {
      header: 'Timeline',
      accessor: (d) => (
        <div className="text-xs text-slate-600">
          <p>Start: {formatDate(d.startDate)}</p>
          <p className="font-bold text-slate-800">Target: {formatDate(d.expectedCompletion)}</p>
        </div>
      ),
    },
    {
      header: 'Progress',
      className: 'w-44',
      accessor: (d) => (
        <div className="w-full">
          <ProgressBar progress={d.progress} size="md" showLabel={true} />
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (d) => <StatusBadge status={d.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (d) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenSlider(d)}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1 shadow-xs"
            title="Adjust Progress %"
          >
            <Sliders className="w-3.5 h-3.5 text-mtn-yellow" />
            <span>Progress</span>
          </button>
          <PermissionGate action="edit">
            <button
              onClick={() => openEditModal(d)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit Project"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <PermissionGate action="delete">
            <button
              onClick={() => setDeliveryToDelete(d)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete Project"
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
        title="Service Delivery & Field Provisioning"
        subtitle="Track active optical fiber trenching, wireless CPE rigging, BGP circuit configuration, and customer UAT handovers"
        breadcrumbs={[{ label: 'Service Delivery' }]}
        actions={
          <PermissionGate action="add">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Delivery Project</span>
            </button>
          </PermissionGate>
        }
      />

      {/* Datalist for suggestions */}
      <datalist id="delivery-customer-suggestions">
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
            <option value="ALL">All Delivery Statuses ({serviceDeliveries.length})</option>
            <option value="Not Started">Not Started</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Testing">Testing</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          Showing <strong>{filteredDeliveries.length}</strong> active rollout projects
        </span>
      </div>

      {/* Deliveries Table */}
      <DataTable
        columns={columns}
        data={filteredDeliveries}
        searchPlaceholder="Search delivery projects by customer or project title..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return (
            item.customerName.toLowerCase().includes(q) ||
            item.opportunityTitle.toLowerCase().includes(q) ||
            item.productName.toLowerCase().includes(q) ||
            item.deliveryTeam.toLowerCase().includes(q)
          );
        }}
        onRowClick={(d) => navigate(`/service-delivery/${d.id}`)}
      />

      {/* PROGRESS SLIDER MODAL */}
      <Modal
        isOpen={!!activeDeliveryForSlider}
        onClose={() => setActiveDeliveryForSlider(null)}
        title="Update Rollout Progress"
        subtitle={`Adjust completion percentage for ${activeDeliveryForSlider?.customerName}`}
        maxWidth="md"
      >
        {activeDeliveryForSlider && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider block mb-1">
                Current Completion Percentage
              </span>
              <span className="text-4xl font-extrabold text-slate-900 font-heading">
                {newProgress}%
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>0% Site Survey</span>
                <span>50% Fiber Blown</span>
                <span>100% Handover Complete</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={newProgress}
                onChange={(e) => setNewProgress(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-mtn-yellow"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveDeliveryForSlider(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProgress}
                className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs"
              >
                Update Progress
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE DELIVERY MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Service Delivery Project"
        subtitle="Provision field rollout with manual enterprise customer entry"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDelivery} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer / Company * (Type Any)</label>
              <input
                type="text"
                required
                list="delivery-customer-suggestions"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                placeholder="Type any company name..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Name</label>
              <input
                type="text"
                value={opportunityTitle}
                onChange={(e) => setOpportunityTitle(e.target.value)}
                placeholder="e.g. Branch Interconnect Deployment"
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Field Engineering Team</label>
              <input
                type="text"
                value={deliveryTeam}
                onChange={(e) => setDeliveryTeam(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeliveryStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Not Started">Not Started</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Testing">Testing</option>
                <option value="Completed">Completed</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Progress %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={progressVal}
                onChange={(e) => setProgressVal(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Manager</label>
              <input
                type="text"
                value={projectManager}
                onChange={(e) => setProjectManager(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Completion</label>
              <input
                type="date"
                value={expectedCompletion}
                onChange={(e) => setExpectedCompletion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
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
              Create Project
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT DELIVERY MODAL */}
      <Modal
        isOpen={!!editingDelivery}
        onClose={() => setEditingDelivery(null)}
        title="Edit Service Delivery Project"
        subtitle={`Update rollout #${editingDelivery?.id}`}
        maxWidth="lg"
      >
        {editingDelivery && (
          <form onSubmit={handleUpdateDelivery} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer / Company *</label>
                <input
                  type="text"
                  required
                  list="delivery-customer-suggestions"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Name</label>
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
                  onChange={(e) => setStatus(e.target.value as DeliveryStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Testing">Testing</option>
                  <option value="Completed">Completed</option>
                  <option value="Delayed">Delayed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Progress %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progressVal}
                  onChange={(e) => setProgressVal(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Manager</label>
                <input
                  type="text"
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Completion</label>
                <input
                  type="date"
                  value={expectedCompletion}
                  onChange={(e) => setExpectedCompletion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDelivery(null)}
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
        isOpen={!!deliveryToDelete}
        onClose={() => setDeliveryToDelete(null)}
        title="Delete Delivery Project"
        maxWidth="sm"
      >
        {deliveryToDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs">
                Are you sure you want to delete delivery project #{deliveryToDelete.id} for <strong>{deliveryToDelete.customerName}</strong>?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeliveryToDelete(null)}
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
