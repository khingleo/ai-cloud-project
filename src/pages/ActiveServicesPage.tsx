/**
 * MTN ENTERPRISE HUB - ACTIVE SERVICES INVENTORY (CRUD & MANUAL ENTRY)
 * 
 * Route: /active-services
 * Central repository of live provisioned circuits and recurring revenue services.
 * Features:
 * - Provision new active service with manual company entry
 * - Edit active service modal (adjust MRC, Bandwidth, SLA Tier, Status)
 * - Decommission / Delete active service confirmation modal
 * - Category, Status, and Customer filters with live metrics bar
 */

import React, { useState } from 'react';
import {
  Building2,
  Clock,
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
import type { ActiveService, ServiceHealthStatus, ProductCategory } from '../types';
import { formatCurrencyGHS, formatDate, getCategoryBadge } from '../utils/formatters';

export const ActiveServicesPage: React.FC = () => {
  const {
    activeServices,
    addActiveService,
    updateActiveService,
    deleteActiveService,
    customers,
    currentUser,
    getOrCreateCustomerByName,
  } = useAppState();
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ActiveService | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ActiveService | null>(null);

  // Form states
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Fixed');
  const [mrcGHS, setMrcGHS] = useState(15000);
  const [bandwidthOrCapacity, setBandwidthOrCapacity] = useState('100 Mbps Dedicated');
  const [slaTier, setSlaTier] = useState<'Platinum (99.9%)' | 'Gold (99.5%)' | 'Silver (99.0%)'>('Platinum (99.9%)');
  const [status, setStatus] = useState<ServiceHealthStatus>('Active');
  const [dclmAccountId, setDclmAccountId] = useState('DCLM-GH-4001');
  const [activationDate, setActivationDate] = useState('2026-08-01');
  const [renewalDate, setRenewalDate] = useState('2027-08-01');

  const filteredServices = activeServices.filter((s) => {
    if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && s.status !== selectedStatus) return false;
    return true;
  });

  const totalMRC = filteredServices.reduce((sum, s) => sum + s.mrcGHS, 0);

  const openAddModal = () => {
    setCustomerNameInput(customers[0]?.name || '');
    setServiceName('');
    setCategory('Fixed');
    setMrcGHS(15000);
    setBandwidthOrCapacity('100 Mbps Dedicated Fiber');
    setSlaTier('Platinum (99.9%)');
    setStatus('Active');
    setDclmAccountId(`DCLM-GH-${Math.floor(1000 + Math.random() * 9000)}`);
    setActivationDate('2026-08-01');
    setRenewalDate('2027-08-01');
    setIsAddModalOpen(true);
  };

  const openEditModal = (s: ActiveService) => {
    setEditingService(s);
    setCustomerNameInput(s.customerName);
    setServiceName(s.serviceName);
    setCategory(s.category);
    setMrcGHS(s.mrcGHS);
    setBandwidthOrCapacity(s.bandwidthOrCapacity || '');
    setSlaTier(s.slaTier);
    setStatus(s.status);
    setDclmAccountId(s.dclmAccountId);
    setActivationDate(s.activationDate);
    setRenewalDate(s.renewalDate);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNameInput.trim()) {
      showToast('error', 'Validation Error', 'Customer company name is required.');
      return;
    }

    const customer = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');

    addActiveService({
      serviceName: serviceName.trim() || `${customer.name} — Dedicated Circuit`,
      customerId: customer.id,
      customerName: customer.name,
      serviceOwner: currentUser?.name || '',
      category,
      mrcGHS: Number(mrcGHS),
      activationDate,
      renewalDate,
      status,
      slaTier,
      bandwidthOrCapacity: bandwidthOrCapacity.trim(),
      dclmAccountId: dclmAccountId.trim(),
    });

    showToast('success', 'Service Provisioned', `Active circuit registered for ${customer.name}.`);
    setIsAddModalOpen(false);
  };

  const handleUpdateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!customerNameInput.trim()) {
      showToast('error', 'Validation Error', 'Customer company name is required.');
      return;
    }

    const customer = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');

    updateActiveService(editingService.id, {
      serviceName: serviceName.trim() || editingService.serviceName,
      customerId: customer.id,
      customerName: customer.name,
      category,
      mrcGHS: Number(mrcGHS),
      activationDate,
      renewalDate,
      status,
      slaTier,
      bandwidthOrCapacity: bandwidthOrCapacity.trim(),
      dclmAccountId: dclmAccountId.trim(),
    });

    showToast('success', 'Service Updated', `Saved parameters for ${customer.name}.`);
    setEditingService(null);
  };

  const handleDeleteConfirm = () => {
    if (!serviceToDelete) return;
    deleteActiveService(serviceToDelete.id);
    showToast('info', 'Service Decommissioned', `Active circuit #${serviceToDelete.id} removed.`);
    setServiceToDelete(null);
  };

  const columns: Column<ActiveService>[] = [
    {
      header: 'Service Name & Circuit',
      accessor: (s) => (
        <div>
          <span className="font-bold text-slate-900 text-sm hover:text-amber-900 transition-colors">
            {s.serviceName}
          </span>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
            ID: {s.dclmAccountId} {s.bandwidthOrCapacity && `• ${s.bandwidthOrCapacity}`}
          </p>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (s) => (
        <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {s.customerName}
        </span>
      ),
    },
    {
      header: 'Category',
      accessor: (s) => {
        const cBadge = getCategoryBadge(s.category);
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${cBadge.bg}`}>
            {s.category}
          </span>
        );
      },
    },
    {
      header: 'Monthly Revenue (MRC)',
      accessor: (s) => (
        <div>
          <p className="font-extrabold text-slate-900 text-xs">{formatCurrencyGHS(s.mrcGHS)} / mo</p>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
            {s.slaTier}
          </span>
        </div>
      ),
    },
    {
      header: 'Activation Date',
      accessor: (s) => <span className="text-xs text-slate-600 font-medium">{formatDate(s.activationDate)}</span>,
    },
    {
      header: 'Contract Renewal',
      accessor: (s) => (
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatDate(s.renewalDate)}
        </span>
      ),
    },
    {
      header: 'SLA Health',
      accessor: (s) => <StatusBadge status={s.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <PermissionGate action="edit">
            <button
              onClick={() => openEditModal(s)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit Service"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <PermissionGate action="delete">
            <button
              onClick={() => setServiceToDelete(s)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Decommission Service"
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
        title="Active Services Inventory"
        subtitle="Operational directory of all contracted corporate circuits, recurring revenue streams, and 24/7 SLA health"
        breadcrumbs={[{ label: 'Active Services' }]}
        actions={
          <PermissionGate action="add">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Provision Service</span>
            </button>
          </PermissionGate>
        }
      />

      {/* Datalist for suggestions */}
      <datalist id="active-customer-suggestions">
        {customers.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

      {/* Revenue & Circuit Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Recurring Revenue</span>
          <h3 className="text-2xl font-extrabold text-slate-900 font-heading mt-1">
            {formatCurrencyGHS(totalMRC)} <span className="text-xs font-normal text-slate-500">/ month</span>
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Monitored Circuits</span>
          <h3 className="text-2xl font-extrabold text-slate-900 font-heading mt-1">
            {activeServices.length} Active Services
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">SLA Performance Target</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 font-heading mt-1">
            99.95% Uptime
          </h3>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
          >
            <option value="ALL">All Categories</option>
            <option value="Fixed">Fixed</option>
            <option value="Converged">Converged</option>
            <option value="Digital">Digital</option>
            <option value="Mobile">Mobile</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">SLA Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
          >
            <option value="ALL">All Statuses ({activeServices.length})</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Degraded">Degraded</option>
            <option value="Under Maintenance">Under Maintenance</option>
          </select>
        </div>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          Showing <strong>{filteredServices.length}</strong> active circuits
        </span>
      </div>

      {/* Services Table */}
      <DataTable
        columns={columns}
        data={filteredServices}
        searchPlaceholder="Search active services by customer, circuit ID, or capacity..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return Boolean(
            item.serviceName.toLowerCase().includes(q) ||
            item.customerName.toLowerCase().includes(q) ||
            item.dclmAccountId.toLowerCase().includes(q) ||
            (item.bandwidthOrCapacity && item.bandwidthOrCapacity.toLowerCase().includes(q))
          );
        }}
      />

      {/* PROVISION ACTIVE SERVICE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Provision Active Corporate Service"
        subtitle="Register live corporate circuit with manual customer assignment"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateService} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer / Company * (Type Any)</label>
              <input
                type="text"
                required
                list="active-customer-suggestions"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                placeholder="Type any enterprise customer..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Circuit Name</label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Headquarters Dedicated Optical Link"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Fixed">Fixed</option>
                <option value="Converged">Converged</option>
                <option value="Digital">Digital</option>
                <option value="Mobile">Mobile</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Recurring (GHS) *</label>
              <input
                type="number"
                required
                min={500}
                step={500}
                value={mrcGHS}
                onChange={(e) => setMrcGHS(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bandwidth / Capacity</label>
              <input
                type="text"
                value={bandwidthOrCapacity}
                onChange={(e) => setBandwidthOrCapacity(e.target.value)}
                placeholder="e.g. 150 Mbps Dedicated"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SLA Tier</label>
              <select
                value={slaTier}
                onChange={(e) => setSlaTier(e.target.value as 'Platinum (99.9%)' | 'Gold (99.5%)' | 'Silver (99.0%)')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Platinum (99.9%)">Platinum (99.9%)</option>
                <option value="Gold (99.5%)">Gold (99.5%)</option>
                <option value="Silver (99.0%)">Silver (99.0%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">DCLM Circuit ID</label>
              <input
                type="text"
                value={dclmAccountId}
                onChange={(e) => setDclmAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceHealthStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Active">Active</option>
                <option value="Degraded">Degraded</option>
                <option value="Suspended">Suspended</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Activation Date</label>
              <input
                type="date"
                value={activationDate}
                onChange={(e) => setActivationDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Renewal Date</label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
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
              Provision Circuit
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        title="Edit Active Corporate Service"
        subtitle={`Update ${editingService?.serviceName}`}
        maxWidth="lg"
      >
        {editingService && (
          <form onSubmit={handleUpdateService} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer / Company *</label>
                <input
                  type="text"
                  required
                  list="active-customer-suggestions"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Circuit Name</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Fixed">Fixed</option>
                  <option value="Converged">Converged</option>
                  <option value="Digital">Digital</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monthly Recurring (GHS)</label>
                <input
                  type="number"
                  required
                  min={100}
                  step={500}
                  value={mrcGHS}
                  onChange={(e) => setMrcGHS(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bandwidth / Capacity</label>
                <input
                  type="text"
                  value={bandwidthOrCapacity}
                  onChange={(e) => setBandwidthOrCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SLA Tier</label>
                <select
                  value={slaTier}
                  onChange={(e) => setSlaTier(e.target.value as 'Platinum (99.9%)' | 'Gold (99.5%)' | 'Silver (99.0%)')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Platinum (99.9%)">Platinum (99.9%)</option>
                  <option value="Gold (99.5%)">Gold (99.5%)</option>
                  <option value="Silver (99.0%)">Silver (99.0%)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">DCLM Circuit ID</label>
                <input
                  type="text"
                  value={dclmAccountId}
                  onChange={(e) => setDclmAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ServiceHealthStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Active">Active</option>
                  <option value="Degraded">Degraded</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Activation Date</label>
                <input
                  type="date"
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Renewal Date</label>
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingService(null)}
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
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        title="Decommission Corporate Circuit"
        maxWidth="sm"
      >
        {serviceToDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs">
                Are you sure you want to decommission service <strong>{serviceToDelete.serviceName}</strong> (ID: {serviceToDelete.dclmAccountId})?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all"
              >
                Confirm Decommission
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
