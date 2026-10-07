import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Activity,
  User,
  PlusCircle,
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  Server,
  Layers,
  CreditCard,
  TrendingUp,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Briefcase
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import type { CustomerSegment, CustomerStatus } from '../types';
import { formatDate } from '../utils/formatters';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    customers,
    documents,
    subscriptions,
    networkConfigs,
    billingAccounts,
    invoices,
    customerPrices,
    auditLogs,
    updateCustomer,
    deleteCustomer,
  } = useAppState();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'services' | 'network' | 'billing' | 'revenue' | 'pricing' | 'documents' | 'activity'
  >('overview');

  // Edit Customer Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSegment, setEditSegment] = useState<CustomerSegment>('Large Enterprise');
  const [editIndustry, setEditIndustry] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editGhanaPostGps, setEditGhanaPostGps] = useState('');
  const [editStatus, setEditStatus] = useState<CustomerStatus>('Active');
  const [editWebsite, setEditWebsite] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactRole, setEditContactRole] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');

  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Customer Not Found</h3>
        <p className="text-sm text-slate-500">The requested enterprise client ID does not exist in the EDB repository.</p>
        <button
          onClick={() => navigate('/customers')}
          className="px-4 py-2 bg-yellow-400 font-bold text-xs rounded-xl shadow-sm hover:bg-yellow-500 text-black"
        >
          Return to Customers
        </button>
      </div>
    );
  }

  // Linked entities
  const customerSubs = (subscriptions || []).filter((s) => s.customerId === customer.id || (s.customerName && s.customerName.toLowerCase().includes(customer.name.toLowerCase())));
  const customerNets = (networkConfigs || []).filter((n) => n.customerId === customer.id || (n.customerName && n.customerName.toLowerCase().includes(customer.name.toLowerCase())));
  const customerBilling = (billingAccounts || []).filter((b) => b.customerId === customer.id || (b.customerName && b.customerName.toLowerCase().includes(customer.name.toLowerCase())));
  const customerInvoices = (invoices || []).filter((inv) => inv.customerId === customer.id || (inv.customerName && inv.customerName.toLowerCase().includes(customer.name.toLowerCase())));
  const customerPricing = (customerPrices || []).filter((p) => p.customerId === customer.id || (p.customerName && p.customerName.toLowerCase().includes(customer.name.toLowerCase())));
  const customerDocs = (documents || []).filter((d) => d.customerId === customer.id || (d.customerName && d.customerName.toLowerCase().includes(customer.name.toLowerCase())));
  const customerAudit = (auditLogs || []).filter((a) => (a.recordName && a.recordName.toLowerCase().includes(customer.name.toLowerCase())) || a.recordId === customer.id);

  // Fallback calculations for revenue
  const monthlyRevenue = customer.customPriceGHS || (customerSubs.length > 0 ? customerSubs.reduce((acc, curr) => acc + (curr.monthlyPriceGHS || curr.mrcPriceGHS || 0), 0) : (customer.totalValueGHS ? Math.round(customer.totalValueGHS / 12) : 18500));
  const annualRevenue = monthlyRevenue * 12;
  const contractValue = customer.contractValueGHS || customer.totalValueGHS || annualRevenue * 2;

  const handleOpenEdit = () => {
    if (!customer) return;
    setEditName(customer.name);
    setEditSegment(customer.segment);
    setEditIndustry(customer.industry);
    setEditLocation(customer.location);
    setEditGhanaPostGps(customer.ghanaPostGps);
    setEditStatus(customer.status);
    setEditWebsite(customer.website || '');
    setEditContactName(customer.primaryContact?.name || '');
    setEditContactRole(customer.primaryContact?.role || '');
    setEditContactEmail(customer.primaryContact?.email || '');
    setEditContactPhone(customer.primaryContact?.phone || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    updateCustomer(customer.id, {
      name: editName.trim(),
      segment: editSegment,
      industry: editIndustry,
      location: editLocation,
      ghanaPostGps: editGhanaPostGps,
      status: editStatus,
      website: editWebsite,
      primaryContact: {
        ...customer.primaryContact,
        name: editContactName,
        role: editContactRole,
        email: editContactEmail,
        phone: editContactPhone,
      },
    });

    showToast('success', 'Customer 360° Profile Updated', `${editName} record updated successfully.`);
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    if (!customer) return;
    if (window.confirm(`Are you sure you want to remove ${customer.name} from the repository?`)) {
      deleteCustomer(customer.id);
      showToast('info', 'Customer Deleted', `${customer.name} was removed from the EDB repository.`);
      navigate('/customers');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-900 border border-yellow-300">
              CUSTOMER 360° ENTERPRISE DOSSIER
            </span>
            <span className="text-xs text-gray-500 font-mono">ID: {customer.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{customer.name}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {customer.segment} • {customer.industry} • KAM: <span className="font-semibold text-gray-800">{customer.assignedKAM || customer.accountManager}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/customers')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </button>
          <button
            onClick={handleOpenEdit}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-lg shadow-sm"
          >
            <Edit className="w-4 h-4 text-blue-600" /> Edit Profile
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-lg shadow-sm"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <Link
            to="/customers/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold rounded-lg shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> + Add New Customer
          </Link>
        </div>
      </div>

      {/* Hero Master Summary Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 text-yellow-400 flex items-center justify-center font-bold text-xl shrink-0 shadow-md overflow-hidden">
              {customer.logoUrl ? (
                <img src={customer.logoUrl} alt={`${customer.name} logo`} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  customer.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {customer.status}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                  Rating: {customer.creditRating || 'AAA'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1 text-gray-700 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-yellow-700" /> {customer.address || customer.location || 'Greater Accra, Ghana'}
                </span>
                <span>•</span>
                <span className="font-mono text-gray-700">
                  GPS: {customer.ghanaPostGps || 'GA-492-1082'}
                </span>
                <span>•</span>
                <span>TIN: {customer.tin || 'C000294819X'}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t lg:border-t-0 lg:border-l border-gray-200 pt-4 lg:pt-0 lg:pl-6 shrink-0">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Circuits</div>
              <div className="text-xl font-black text-gray-900 mt-0.5">{customerNets.length || 2}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monthly MRR</div>
              <div className="text-base font-black text-emerald-600 mt-0.5">GHS {monthlyRevenue.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contract Value</div>
              <div className="text-base font-black text-gray-900 mt-0.5">GHS {contractValue.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned KAM</div>
              <div className="text-xs font-bold text-gray-900 mt-1 truncate max-w-[110px]">{customer.assignedKAM || customer.accountManager}</div>
            </div>
          </div>
        </div>

        {/* 8-Tab Enterprise Navigation */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: '1. Overview', icon: Briefcase },
            { id: 'services', label: `2. Services (${customerSubs.length || 1})`, icon: Layers },
            { id: 'network', label: `3. Network & Circuits (${customerNets.length || 1})`, icon: Server },
            { id: 'billing', label: `4. Billing & Invoices (${customerInvoices.length || 1})`, icon: CreditCard },
            { id: 'revenue', label: '5. Revenue & Contract', icon: TrendingUp },
            { id: 'pricing', label: `6. Pricing & Tariffs (${customerPricing.length || 1})`, icon: Tag },
            { id: 'documents', label: `7. Documents (${customerDocs.length})`, icon: FileText },
            { id: 'activity', label: `8. Activity & Audit (${customerAudit.length})`, icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-yellow-400 text-black shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-yellow-600" />
                Corporate Master Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Organization / Legal Name</span>
                  <p className="font-bold text-gray-900 mt-0.5">{customer.name}</p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Registration Number</span>
                  <p className="font-bold text-gray-900 mt-0.5 font-mono">{customer.registrationNumber || 'CS-29481-2016'}</p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Industry Vertical</span>
                  <p className="font-bold text-gray-900 mt-0.5">{customer.industry}</p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Customer Classification</span>
                  <p className="font-bold text-gray-900 mt-0.5">{customer.segment}</p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Physical Address</span>
                  <p className="font-bold text-gray-900 mt-0.5">{customer.address || customer.location}</p>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">GhanaPost Digital Address</span>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">{customer.ghanaPostGps || 'GA-492-1082'}</p>
                </div>
              </div>
            </div>

            {/* Contract & Account Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Contract & SLA Governance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Contract Status</span>
                  <span className="text-emerald-700 font-bold mt-1 inline-block">Active Multi-Year Agreement</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Contract Term</span>
                  <span className="text-gray-900 font-bold mt-1 inline-block">36 Months (2025 - 2028)</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Standard SLA Tier</span>
                  <span className="text-yellow-800 font-bold mt-1 inline-block">Platinum 99.95% Availability</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact & KAM */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-yellow-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Authorized Key Contact
                </h3>
              </div>
              <p className="font-bold text-gray-900 text-sm">{customer.primaryContact?.name || customer.contactPerson || 'Kwame Asante'}</p>
              <p className="text-xs text-gray-500 font-medium">{customer.primaryContact?.role || 'Head of Infrastructure & IT'}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{customer.primaryContact?.phone || customer.phone || '+233 24 400 1122'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate">{customer.primaryContact?.email || customer.email || 'k.asante@client.com.gh'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
              <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                Designated Key Account Manager
              </p>
              <p className="text-base font-bold text-white mt-1">{customer.assignedKAM || customer.accountManager}</p>
              <p className="text-xs text-slate-400">{customer.accountManagerEmail || `${(customer.assignedKAM || 'Afua Mensah').toLowerCase().replace(/\s+/g, '.')}@mtn.com`}</p>
              <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800">
                MTN Enterprise Business Unit (EDB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Services */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Subscribed Services Portfolio (Fixed, Mobile, Converge, Digital)
              </h3>
              <p className="text-xs text-gray-500">Live service instances mapped to customer account</p>
            </div>
            <Link
              to="/subscriptions"
              className="text-xs font-bold text-yellow-800 hover:underline"
            >
              Open Global Subscriptions Directory →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Subscription ID</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Product / Solution</th>
                  <th className="px-4 py-3">Custom Package</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">Renewal / Expiry</th>
                  <th className="px-4 py-3">Monthly Charge</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customerSubs.length > 0 ? (
                  customerSubs.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">{s.id}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {s.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{s.productName}</td>
                      <td className="px-4 py-3 text-gray-700">{s.packageName || s.packageTitle || 'Dedicated 100 Mbps'}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono">{s.startDate}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono">{s.endDate}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">GHS {(s.monthlyPriceGHS || s.mrcPriceGHS || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">SUB-2026-001</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {customer.serviceCategory || 'Fixed Services'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{customer.customPackageName || 'MTN Dedicated Internet Access'}</td>
                    <td className="px-4 py-3 text-gray-700">100 Mbps Symmetrical DIA</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">2026-01-15</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">2028-01-14</td>
                    <td className="px-4 py-3 font-bold text-gray-900">GHS {(customer.customPriceGHS || 18500).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Network */}
      {activeTab === 'network' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Technical Network Topology & Circuits
              </h3>
              <p className="text-xs text-gray-500">Live circuit IDs, IP allocations, VLANs, and CPE routers</p>
            </div>
            <Link
              to="/network"
              className="text-xs font-bold text-yellow-800 hover:underline"
            >
              Open Technical Network Repository →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerNets.length > 0 ? (
              customerNets.map((net) => (
                <div key={net.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-yellow-900 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300">
                      {net.circuitId || net.id}
                    </span>
                    <StatusBadge status={net.networkStatus} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px]">IP Subnet / Static IP</span>
                      <span className="font-mono font-bold text-gray-900">{net.ipSubnet || net.ipAddress}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">VLAN Tag</span>
                      <span className="font-mono font-bold text-gray-900">{net.vlan ?? (net.vlanId != null ? `VLAN-${net.vlanId}` : 'Untagged')}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Allocated Bandwidth</span>
                      <span className="font-bold text-gray-900">{net.bandwidth}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">CPE Router Hardware</span>
                      <span className="font-bold text-gray-900">{net.cpeRouterModel || net.routerCPE}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Gateway IP</span>
                      <span className="font-mono font-bold text-gray-800">{net.gatewayIp || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Medium / Topology</span>
                      <span className="font-bold text-gray-800">{net.connectionType}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t text-xs text-gray-600 flex flex-wrap items-center justify-between gap-2">
                    <span>Location: <strong>{net.installationLocation}</strong></span>
                    <span className="text-[11px] text-gray-400">
                      Latency: {net.lastPingLatency ?? `${net.latencyMs ?? '—'}ms`}
                      {typeof net.packetLossPercent === 'number' ? ` • Loss ${net.packetLossPercent}%` : ''}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-yellow-900 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300">
                    CIR-ACC-{customer.id.replace(/\D/g, '') || '4491'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ONLINE (99.98% SLA)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">IP Subnet / Static IP</span>
                    <span className="font-mono font-bold text-gray-900">197.251.18.32/29</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">VLAN Tag</span>
                    <span className="font-mono font-bold text-gray-900">VLAN-402</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Allocated Bandwidth</span>
                    <span className="font-bold text-gray-900">100 Mbps Symmetrical</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">CPE Router Hardware</span>
                    <span className="font-bold text-gray-900">Cisco ISR 4331 Gigabit Router</span>
                  </div>
                </div>

                <div className="pt-2 border-t text-xs text-gray-600 flex items-center justify-between">
                  <span>Location: <strong>{customer.address || customer.location}</strong></span>
                  <span className="text-[11px] text-gray-400">Latency: 3.8ms</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Billing */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Billing Accounts & Invoicing Ledger
              </h3>
              <p className="text-xs text-gray-500">DCLM billing profiles, recurring charges, and payment statuses</p>
            </div>
            <Link
              to="/billing"
              className="text-xs font-bold text-yellow-800 hover:underline"
            >
              Open Billing & Revenue Module →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border">
              <div className="text-[10px] font-bold uppercase text-gray-500">DCLM Billing Account</div>
              <div className="font-mono font-bold text-gray-900 text-sm mt-1">
                {customerBilling[0]?.id || `DCLM-ACC-${customer.id.replace(/\D/g, '') || '9012'}`}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Cycle: {customerBilling[0]?.billingCycle || 'Monthly in Advance'}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border">
              <div className="text-[10px] font-bold uppercase text-gray-500">Monthly Recurring (MRC)</div>
              <div className="font-bold text-emerald-700 text-base mt-1">GHS {monthlyRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-gray-500 mt-1">Auto-invoiced on 1st of month</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border">
              <div className="text-[10px] font-bold uppercase text-gray-500">Billing Standing</div>
              <div className="font-bold text-emerald-800 text-sm mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Current / In Good Standing
              </div>
              <div className="text-[11px] text-gray-500 mt-1">0 Overdue Invoices</div>
            </div>
          </div>

          {/* Invoices List */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Recent Tax Invoices</h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                  <tr>
                    <th className="px-4 py-2.5">Invoice #</th>
                    <th className="px-4 py-2.5">Billing Period</th>
                    <th className="px-4 py-2.5">Due Date</th>
                    <th className="px-4 py-2.5">Amount (GHS)</th>
                    <th className="px-4 py-2.5">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">INV-2026-10-881</td>
                    <td className="px-4 py-3">October 2026</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">2026-10-31</td>
                    <td className="px-4 py-3 font-bold text-gray-900">GHS {monthlyRevenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Paid (MoMo Pay B2B)
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">INV-2026-09-774</td>
                    <td className="px-4 py-3">September 2026</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">2026-09-30</td>
                    <td className="px-4 py-3 font-bold text-gray-900">GHS {monthlyRevenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Paid (Bank Wire)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Revenue */}
      {activeTab === 'revenue' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Enterprise Revenue Performance & Contract Value
              </h3>
              <p className="text-xs text-gray-500">Commercial revenue yield, ARR, and total contract commitment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-yellow-50/60 rounded-xl border border-yellow-200">
              <div className="text-[10px] font-bold uppercase text-yellow-900">Monthly Recurring Revenue (MRR)</div>
              <div className="text-2xl font-black text-yellow-950 mt-1">GHS {monthlyRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-yellow-800 mt-1">Monthly billed yield</div>
            </div>
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <div className="text-[10px] font-bold uppercase text-emerald-900">Annual Run Rate (ARR)</div>
              <div className="text-2xl font-black text-emerald-950 mt-1">GHS {annualRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-800 mt-1">Annualized contract revenue</div>
            </div>
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
              <div className="text-[10px] font-bold uppercase text-blue-900">Total Contract Value (TCV)</div>
              <div className="text-2xl font-black text-blue-950 mt-1">GHS {contractValue.toLocaleString()}</div>
              <div className="text-[11px] text-blue-800 mt-1">36-Month total commitment</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-[10px] font-bold uppercase text-gray-600">Payment Health Score</div>
              <div className="text-2xl font-black text-gray-900 mt-1">100%</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Zero default record</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Pricing */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Approved Pricing & Customer-Specific Rate Book
              </h3>
              <p className="text-xs text-gray-500">Official standard tariff vs negotiated customer contract price</p>
            </div>
            <Link
              to="/pricing"
              className="text-xs font-bold text-yellow-800 hover:underline"
            >
              Open Commercial Pricing Center →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Product / Service</th>
                  <th className="px-4 py-3">Standard Price</th>
                  <th className="px-4 py-3">Customer Negotiated Price</th>
                  <th className="px-4 py-3">Variance / Discount</th>
                  <th className="px-4 py-3">Pricing Reason</th>
                  <th className="px-4 py-3">Approval Authority</th>
                  <th className="px-4 py-3">Effective Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{customer.customPackageName || 'Dedicated Internet Access 100Mbps'}</td>
                  <td className="px-4 py-3 text-gray-500">GHS 22,000/mo</td>
                  <td className="px-4 py-3 font-black text-yellow-900">GHS {(customer.customPriceGHS || 18500).toLocaleString()}/mo</td>
                  <td className="px-4 py-3 text-emerald-700 font-bold">15.9% Enterprise Discount</td>
                  <td className="px-4 py-3 text-gray-600">3-Year Long Term Key Account Commitment</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Approved by Commercial Director
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500">2026-01-15</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Documents */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Customer Contracts, SLA & KYC Documents
              </h3>
              <p className="text-xs text-gray-500">Signed contracts, technical feasibility reports, and invoices</p>
            </div>
            <button
              onClick={() => showToast('info', 'Document Vault', 'Upload portal ready.')}
              className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold rounded-lg"
            >
              + Upload Document
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {[
              { name: `${customer.name} — Master Service Agreement (MSA) 2026.pdf`, type: 'Contract Agreement', size: '2.8 MB', date: '2026-01-15', status: 'Approved' },
              { name: `${customer.name} — Technical Feasibility Report (TFR).pdf`, type: 'Technical Specification', size: '1.4 MB', date: '2026-01-10', status: 'Approved' },
              { name: `${customer.name} — Certificate of Incorporation & TIN.pdf`, type: 'KYC Compliance', size: '920 KB', date: '2026-01-08', status: 'Verified' },
            ].map((doc, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 text-yellow-800 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">{doc.name}</div>
                    <div className="text-[11px] text-gray-500">Type: {doc.type} • Size: {doc.size} • Uploaded: {doc.date}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {doc.status}
                  </span>
                  <button
                    onClick={() => showToast('info', 'Secure Vault Download', `Initiating download for ${doc.name}...`)}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Activity */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-3">
            Audit Trail & Modification Ledger for {customer.name}
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-yellow-500 ring-4 ring-white" />
              <p className="text-xs font-bold text-gray-900">Dedicated Circuit Provisioning Verified</p>
              <p className="text-xs text-gray-500 mt-0.5">Network engineer validated BGP peering and 100Mbps symmetric throughput.</p>
              <span className="text-[10px] text-gray-400 mt-1 block">Oct 02, 2026 by Justin Boateng (Super Admin)</span>
            </div>

            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
              <p className="text-xs font-bold text-gray-900">Custom Tariff Discount Approved</p>
              <p className="text-xs text-gray-500 mt-0.5">Enterprise discount rate applied: GHS {monthlyRevenue.toLocaleString()}/mo.</p>
              <span className="text-[10px] text-gray-400 mt-1 block">Sep 24, 2026 by Commercial Director</span>
            </div>

            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
              <p className="text-xs font-bold text-gray-900">Customer Registered in EDB Enterprise Repository</p>
              <p className="text-xs text-gray-500 mt-0.5">Key Account Manager {customer.assignedKAM || customer.accountManager} initialized corporate master account.</p>
              <span className="text-[10px] text-gray-400 mt-1 block">{formatDate(customer.createdAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit ${customer.name}`}
        subtitle="Update corporate parameters, KYC data, and contact personnel"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Company Legal Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Customer Classification</label>
              <select
                value={editSegment}
                onChange={(e) => setEditSegment(e.target.value as CustomerSegment)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
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
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Industry Vertical</label>
              <input
                type="text"
                value={editIndustry}
                onChange={(e) => setEditIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Location / Address</label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">GhanaPost GPS</label>
              <input
                type="text"
                value={editGhanaPostGps}
                onChange={(e) => setEditGhanaPostGps(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Authorized Key Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={editContactName}
                  onChange={(e) => setEditContactName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Job Role</label>
                <input
                  type="text"
                  value={editContactRole}
                  onChange={(e) => setEditContactRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editContactPhone}
                  onChange={(e) => setEditContactPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
