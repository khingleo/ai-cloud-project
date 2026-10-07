/**
 * MTN ENTERPRISE HUB - CUSTOMERS MANAGEMENT PAGE (FULL CRUD)
 * Route: /customers
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, PlusCircle, Download, Phone, Mail, ExternalLink,
  MapPin, Edit, Trash2, Eye, X, Globe, CreditCard, Hash,
  Calendar, Briefcase, AlertTriangle,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import { formatCurrencyGHS } from '../utils/formatters';
import { exportBrandedTablePdf } from '../utils/exportBrandedPdf';
import type { Customer, CustomerSegment, CustomerStatus } from '../types';

const SEGMENT_COLORS: Record<CustomerSegment, string> = {
  'Large Enterprise': 'bg-amber-100 text-amber-800 border-amber-200',
  SME: 'bg-blue-100 text-blue-800 border-blue-200',
  'Public Sector': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Multinational: 'bg-violet-100 text-violet-800 border-violet-200',
};

const CREDIT_COLORS: Record<string, string> = {
  AAA: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  AA: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  A: 'text-blue-700 bg-blue-50 border-blue-200',
  BBB: 'text-amber-700 bg-amber-50 border-amber-200',
  BB: 'text-orange-700 bg-orange-50 border-orange-200',
  'Under Review': 'text-red-700 bg-red-50 border-red-200',
};

const INDUSTRIES = [
  'Banking & Financial Services', 'Mining & Natural Resources', 'FMCG & Manufacturing',
  'Healthcare & Pharmaceuticals', 'Education & Research', 'Logistics & Transportation',
  'Telecommunications & Technology', 'Government & Public Sector', 'Energy & Utilities',
  'Hospitality & Tourism', 'Retail & Commerce', 'Other Enterprise',
];

const SEGMENTS: CustomerSegment[] = ['Large Enterprise', 'SME', 'Public Sector', 'Multinational'];
const CREDIT_OPTS = ['AAA', 'AA', 'A', 'BBB', 'BB', 'Under Review'];
const STATUSES: CustomerStatus[] = ['Active', 'Prospect', 'Suspended', 'Dormant'];

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
      <p className="text-xs font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

export const CustomersPage: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // ── Add form state ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [segment, setSegment] = useState<CustomerSegment>('Large Enterprise');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [location, setLocation] = useState('Airport City, Accra');
  const [ghanaPostGps, setGhanaPostGps] = useState('GA-100-2026');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Chief Technology Officer');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [creditRating, setCreditRating] = useState<Customer['creditRating']>('AA');
  const [addAccountManager, setAddAccountManager] = useState('Kwame Mensah');

  // ── Edit form state ──
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editSegment, setEditSegment] = useState<CustomerSegment>('Large Enterprise');
  const [editIndustry, setEditIndustry] = useState(INDUSTRIES[0]);
  const [editLocation, setEditLocation] = useState('');
  const [editGhanaPostGps, setEditGhanaPostGps] = useState('');
  const [editStatus, setEditStatus] = useState<CustomerStatus>('Active');
  const [editContactName, setEditContactName] = useState('');
  const [editContactRole, setEditContactRole] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editCreditRating, setEditCreditRating] = useState<Customer['creditRating']>('AA');
  const [editAccountManager, setEditAccountManager] = useState('');

  const filteredCustomers = customers.filter((c) => {
    if (selectedSegment !== 'ALL' && c.segment !== selectedSegment) return false;
    if (selectedIndustry !== 'ALL' && c.industry !== selectedIndustry) return false;
    return true;
  });

  const resetAddForm = () => {
    setName(''); setContactName(''); setContactEmail(''); setContactPhone('');
    setWebsite(''); setLocation('Airport City, Accra');
    setGhanaPostGps('GA-100-2026'); setCreditRating('AA');
    setAddAccountManager('Kwame Mensah');
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newCust = addCustomer({
      name: name.trim(), segment, industry, location,
      ghanaPostGps: ghanaPostGps || 'GA-000-0000',
      accountManager: addAccountManager || 'Kwame Mensah',
      accountManagerEmail: `${(addAccountManager || 'kwame.mensah').toLowerCase().replace(/\s+/g, '.')}@mtn.com.gh`,
      status: 'Active',
      registrationNumber: `CS${Math.floor(100000000 + Math.random() * 900000000)}`,
      tin: `C${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      establishedYear: new Date().getFullYear(),
      website: website || `https://www.${slug}.com.gh`,
      email: contactEmail || 'info@enterprise.com.gh',
      phone: contactPhone || '+233 30 200 0000',
      creditRating,
      primaryContact: {
        id: `CONT-${Date.now()}`, customerId: '',
        name: contactName || 'Primary Executive', role: contactRole,
        email: contactEmail || 'contact@enterprise.com.gh',
        phone: contactPhone || '+233 24 000 1122', isPrimary: true,
      },
    });
    showToast('success', 'Customer Created', `${name} registered successfully.`);
    setIsAddModalOpen(false);
    resetAddForm();
    navigate(`/customers/${newCust.id}`);
  };

  const handleOpenEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditSegment(customer.segment);
    setEditIndustry(customer.industry);
    setEditLocation(customer.location);
    setEditGhanaPostGps(customer.ghanaPostGps);
    setEditStatus(customer.status);
    setEditContactName(customer.primaryContact.name);
    setEditContactRole(customer.primaryContact.role);
    setEditContactEmail(customer.primaryContact.email);
    setEditContactPhone(customer.primaryContact.phone);
    setEditWebsite(customer.website || '');
    setEditCreditRating(customer.creditRating || 'A');
    setEditAccountManager(customer.accountManager || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    updateCustomer(editingCustomer.id, {
      name: editName.trim(), segment: editSegment, industry: editIndustry,
      location: editLocation, ghanaPostGps: editGhanaPostGps, status: editStatus,
      website: editWebsite, creditRating: editCreditRating, accountManager: editAccountManager,
      primaryContact: {
        ...editingCustomer.primaryContact,
        name: editContactName, role: editContactRole,
        email: editContactEmail, phone: editContactPhone,
      },
    });
    showToast('success', 'Customer Updated', `${editName} record updated.`);
    setIsEditModalOpen(false);
    if (viewingCustomer?.id === editingCustomer.id) {
      setViewingCustomer((prev) =>
        prev ? {
          ...prev, name: editName.trim(), segment: editSegment, industry: editIndustry,
          location: editLocation, ghanaPostGps: editGhanaPostGps, status: editStatus,
          website: editWebsite, creditRating: editCreditRating, accountManager: editAccountManager,
          primaryContact: {
            ...prev.primaryContact, name: editContactName, role: editContactRole,
            email: editContactEmail, phone: editContactPhone,
          },
        } : null
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (!customerToDelete) return;
    deleteCustomer(customerToDelete.id);
    showToast('info', 'Customer Deleted', `${customerToDelete.name} removed from repository.`);
    if (viewingCustomer?.id === customerToDelete.id) setViewingCustomer(null);
    setCustomerToDelete(null);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Customer Name', 'Segment', 'Industry', 'Contact', 'Phone', 'Location', 'Status', 'Credit', 'Account Manager'];
    const rows = filteredCustomers.map((c) => [
      c.id, c.name, c.segment, c.industry,
      c.primaryContact?.name, c.primaryContact?.phone,
      c.location, c.status, c.creditRating, c.accountManager,
    ]);
    exportBrandedTablePdf({
      title: 'Enterprise Customers',
      filename: `MTN_EBD_Customers_${new Date().toISOString().split('T')[0]}.pdf`,
      headers,
      rows,
    });
    showToast('success', 'PDF Export Complete', 'Customer list downloaded as a branded PDF.');
  };

  const columns: Column<Customer>[] = [
    {
      header: 'Customer',
      accessor: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <span className="font-bold text-slate-900">{c.name}</span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[180px]">{c.location}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Industry',
      accessor: (c) => <span className="text-xs text-slate-700 font-medium">{c.industry}</span>,
    },
    {
      header: 'Segment',
      accessor: (c) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${SEGMENT_COLORS[c.segment]}`}>
          {c.segment}
        </span>
      ),
    },
    {
      header: 'Primary Contact',
      accessor: (c) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{c.primaryContact.name}</p>
          <p className="text-[11px] text-slate-500">{c.primaryContact.role}</p>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
            <Phone className="w-2.5 h-2.5" /> {c.primaryContact.phone}
          </div>
        </div>
      ),
    },
    {
      header: 'Services',
      accessor: (c) => (
        <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-xs">
          {c.activeServicesCount} live
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (c) => <StatusBadge status={c.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setViewingCustomer(c); }}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Full 360 Profile"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <PermissionGate action="edit">
            <button
              onClick={(e) => handleOpenEdit(e, c)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <PermissionGate action="delete">
            <button
              onClick={(e) => { e.stopPropagation(); setCustomerToDelete(c); }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  const industrySet = [...new Set(customers.map((c) => c.industry))].sort();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Enterprise Customers"
        subtitle="Centralized corporate accounts, contacts, credit ratings, and contract histories"
        breadcrumbs={[{ label: 'Customers' }]}
        actions={
          <>
            <PermissionGate action="export">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                <Download className="w-4 h-4" /><span>Export PDF</span>
              </button>
            </PermissionGate>
            <PermissionGate action="add">
              <button
                onClick={() => navigate('/customers/new')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
              >
                <PlusCircle className="w-4 h-4" /><span>Add Customer</span>
              </button>
            </PermissionGate>
          </>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Segment:</span>
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
          >
            <option value="ALL">All Segments</option>
            {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Industry:</span>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
          >
            <option value="ALL">All Industries</option>
            {industrySet.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
        <span className="ml-auto text-xs text-slate-400 font-medium">
          Showing <strong>{filteredCustomers.length}</strong> accounts
        </span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCustomers}
        searchPlaceholder="Search by name, location, industry, or contact..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return Boolean(
            item.name.toLowerCase().includes(q) ||
            item.industry.toLowerCase().includes(q) ||
            item.location.toLowerCase().includes(q) ||
            item.primaryContact.name.toLowerCase().includes(q) ||
            item.accountManager?.toLowerCase().includes(q)
          );
        }}
        onRowClick={(c) => setViewingCustomer(c)}
      />

      {/* ── VIEW DETAILS SLIDE-OVER ── */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setViewingCustomer(null)}
          />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Panel header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-mtn-yellow" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-sm leading-tight font-heading">{viewingCustomer.name}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">{viewingCustomer.industry}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingCustomer(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={viewingCustomer.status} />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${SEGMENT_COLORS[viewingCustomer.segment]}`}>
                  {viewingCustomer.segment}
                </span>
                {viewingCustomer.creditRating && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${CREDIT_COLORS[viewingCustomer.creditRating] ?? 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    <CreditCard className="w-3 h-3" /> {viewingCustomer.creditRating}
                  </span>
                )}
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">Active Services</p>
                  <p className="text-2xl font-black text-amber-900 font-heading mt-0.5">{viewingCustomer.activeServicesCount}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Contract Value</p>
                  <p className="text-base font-black text-slate-900 font-heading mt-0.5 leading-tight">
                    {viewingCustomer.totalValueGHS > 0
                      ? formatCurrencyGHS(viewingCustomer.totalValueGHS)
                      : 'Pending'}
                  </p>
                </div>
              </div>

              {/* Business info */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Business Information</h3>
                <div className="space-y-2.5">
                  <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={viewingCustomer.location} />
                  <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="GhanaPost GPS" value={viewingCustomer.ghanaPostGps} />
                  <InfoRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Reg. Number" value={viewingCustomer.registrationNumber || '—'} />
                  <InfoRow icon={<Hash className="w-3.5 h-3.5" />} label="TIN" value={viewingCustomer.tin || '—'} />
                  <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Est. Year" value={String(viewingCustomer.establishedYear || '—')} />
                  {viewingCustomer.website && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Website</p>
                        <a
                          href={viewingCustomer.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          {viewingCustomer.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary contact */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Primary Contact</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <p className="font-bold text-slate-900 text-sm">{viewingCustomer.primaryContact.name}</p>
                  <p className="text-xs text-slate-500 font-medium">{viewingCustomer.primaryContact.role}</p>
                  <div className="space-y-1.5 pt-1 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`tel:${viewingCustomer.primaryContact.phone}`} className="hover:text-slate-900">
                        {viewingCustomer.primaryContact.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${viewingCustomer.primaryContact.email}`} className="hover:text-slate-900 truncate">
                        {viewingCustomer.primaryContact.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account manager */}
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">MTN Account Manager</h3>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-mtn-yellow flex items-center justify-center font-black text-slate-900 text-sm shrink-0">
                    {(viewingCustomer.accountManager || 'KM').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{viewingCustomer.accountManager || '—'}</p>
                    <p className="text-[11px] text-slate-500">{viewingCustomer.accountManagerEmail || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel footer actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex gap-2 mt-auto">
              <button
                onClick={() => navigate(`/customers/${viewingCustomer.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Full 360° Profile
              </button>
              <PermissionGate action="edit">
                <button
                  onClick={(e) => handleOpenEdit(e, viewingCustomer)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </PermissionGate>
              <PermissionGate action="delete">
                <button
                  onClick={() => setCustomerToDelete(viewingCustomer)}
                  className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </PermissionGate>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD CUSTOMER MODAL ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetAddForm(); }}
        title="Register New Enterprise Customer"
        subtitle="Create a centralized customer master record in the repository"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Legal Name *</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Chartered Bank Ghana PLC"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Segment *</label>
              <select value={segment} onChange={(e) => setSegment(e.target.value as CustomerSegment)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50">
                {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Credit Rating</label>
              <select value={creditRating} onChange={(e) => setCreditRating(e.target.value as Customer['creditRating'])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50">
                {CREDIT_OPTS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Manager</label>
              <input type="text" value={addAccountManager} onChange={(e) => setAddAccountManager(e.target.value)}
                placeholder="Kwame Mensah"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Industry Vertical *</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50">
              {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Physical Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Ridge, Accra" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GhanaPost GPS</label>
              <input type="text" value={ghanaPostGps} onChange={(e) => setGhanaPostGps(e.target.value)}
                placeholder="GA-018-9241" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Corporate Website</label>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://www.company.com.gh" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
          </div>
          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Primary Executive Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                  placeholder="Mr. Kofi Boateng" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role / Job Title</label>
                <input type="text" value={contactRole} onChange={(e) => setContactRole(e.target.value)}
                  placeholder="Head of ICT" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+233 24 411 2233" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Corporate Email</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="kofi@corp.com.gh" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => { setIsAddModalOpen(false); resetAddForm(); }}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl transition-colors shadow-sm">
              Register Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT CUSTOMER MODAL ── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Customer — ${editingCustomer?.name ?? ''}`}
        subtitle="Update corporate details, primary contact, and account status"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Legal Name *</label>
            <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Segment (Type Any)</label>
              <input
                type="text"
                list="edit-segment-list"
                value={editSegment}
                onChange={(e) => setEditSegment(e.target.value as CustomerSegment)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
              <datalist id="edit-segment-list">
                {SEGMENTS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as CustomerStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Credit Rating</label>
              <select value={editCreditRating} onChange={(e) => setEditCreditRating(e.target.value as Customer['creditRating'])}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none">
                {CREDIT_OPTS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Mgr</label>
              <input type="text" value={editAccountManager} onChange={(e) => setEditAccountManager(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Industry Vertical (Type Any)</label>
            <input
              type="text"
              list="edit-industry-list"
              value={editIndustry}
              onChange={(e) => setEditIndustry(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
            <datalist id="edit-industry-list">
              {INDUSTRIES.map((ind) => <option key={ind} value={ind} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Physical Location</label>
              <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GhanaPost GPS</label>
              <input type="text" value={editGhanaPostGps} onChange={(e) => setEditGhanaPostGps(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Corporate Website</label>
            <input type="url" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
          </div>
          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Primary Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input type="text" value={editContactName} onChange={(e) => setEditContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                <input type="text" value={editContactRole} onChange={(e) => setEditContactRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input type="text" value={editContactPhone} onChange={(e) => setEditContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input type="email" value={editContactEmail} onChange={(e) => setEditContactEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl transition-colors shadow-sm">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <Modal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        title="Delete Enterprise Customer"
        maxWidth="sm"
      >
        {customerToDelete && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-900">Permanently delete this account?</p>
                <p className="text-xs text-rose-700 mt-1">
                  <strong>{customerToDelete.name}</strong> and all contact records will be permanently removed. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer ID:</span><strong>{customerToDelete.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Segment:</span><strong>{customerToDelete.segment}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Services:</span><strong>{customerToDelete.activeServicesCount}</strong>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Customer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
