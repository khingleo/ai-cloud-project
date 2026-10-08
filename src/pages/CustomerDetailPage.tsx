import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity, ArrowLeft, Building2, CreditCard, Edit, FileText, Layers,
  MapPin, Plus, Server, Tag, Trash2, TrendingUp, User,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import type {
  BillingAccount, Customer, CustomerSegment, CustomerSpecificPrice, CustomerStatus,
  EnterpriseDocument, InvoiceRecord, NetworkConfiguration, ServiceSubscription,
} from '../types';

type TabId = 'overview' | 'services' | 'network' | 'billing' | 'revenue' | 'pricing' | 'documents' | 'activity';
type RecordKind = 'service' | 'network' | 'billing' | 'invoice' | 'pricing' | 'document';
type FieldKind = 'text' | 'number' | 'date' | 'select' | 'textarea';
interface FieldDefinition {
  key: string;
  label: string;
  kind?: FieldKind;
  options?: string[];
  required?: boolean;
  step?: string;
}

const fields: Record<RecordKind, FieldDefinition[]> = {
  service: [
    { key: 'serviceId', label: 'Service reference', required: true },
    { key: 'serviceName', label: 'Service name', required: true },
    { key: 'productName', label: 'Product / solution', required: true },
    { key: 'packageTitle', label: 'Package / plan' },
    { key: 'category', label: 'Category', kind: 'select', options: ['Mobile', 'Fixed', 'Digital', 'Converged'], required: true },
    { key: 'status', label: 'Status', kind: 'select', options: ['Active', 'Pending Provisioning', 'Suspended', 'Expired', 'Terminated'], required: true },
    { key: 'startDate', label: 'Start date', kind: 'date', required: true },
    { key: 'endDate', label: 'End date', kind: 'date', required: true },
    { key: 'renewalDate', label: 'Renewal date', kind: 'date' },
    { key: 'quantity', label: 'Quantity', kind: 'number', required: true },
    { key: 'mrcPriceGHS', label: 'Monthly recurring charge (GHS)', kind: 'number', required: true, step: '0.01' },
    { key: 'otcPriceGHS', label: 'One-time charge (GHS)', kind: 'number', required: true, step: '0.01' },
    { key: 'billingFrequency', label: 'Billing frequency', kind: 'select', options: ['Monthly Postpaid', 'Quarterly', 'Annual', 'Prepaid'], required: true },
    { key: 'accountManager', label: 'Account manager' },
    { key: 'circuitId', label: 'Circuit ID' },
    { key: 'ipAllocation', label: 'IP allocation' },
    { key: 'bandwidthMbps', label: 'Bandwidth (Mbps)', kind: 'number', step: '0.01' },
    { key: 'simCount', label: 'SIM count', kind: 'number' },
    { key: 'location', label: 'Service location' },
    { key: 'contractRef', label: 'Contract reference' },
    { key: 'notes', label: 'Notes', kind: 'textarea' },
  ],
  network: [
    { key: 'serviceId', label: 'Related service ID' },
    { key: 'serviceName', label: 'Service name', required: true },
    { key: 'connectionType', label: 'Connection type', kind: 'select', options: ['Direct Dedicated Fiber', 'GPON Fiber', 'Microwave Radio', 'Satellite / Starlink', '4G/5G LTE', 'Cloud Cross-Connect'], required: true },
    { key: 'connectivityType', label: 'Connectivity type', kind: 'select', options: ['Point-to-Point', 'MPLS VPN', 'Direct Internet (DIA)', 'SD-WAN Overlay', 'SIP Trunk'], required: true },
    { key: 'bandwidth', label: 'Bandwidth', required: true },
    { key: 'circuitId', label: 'Circuit ID' },
    { key: 'ipAddress', label: 'IP address' },
    { key: 'subnetMask', label: 'Subnet mask' },
    { key: 'gatewayIp', label: 'Gateway IP' },
    { key: 'vlanId', label: 'VLAN ID', kind: 'number' },
    { key: 'accessTechnology', label: 'Access technology' },
    { key: 'routerCPE', label: 'Router / CPE' },
    { key: 'installationLocation', label: 'Installation location' },
    { key: 'gpsCoordinates', label: 'GPS coordinates' },
    { key: 'networkStatus', label: 'Network status', kind: 'select', options: ['Operational', 'Degraded', 'Configuring', 'Maintenance', 'Offline'], required: true },
    { key: 'latencyMs', label: 'Latency (ms)', kind: 'number', required: true },
    { key: 'packetLossPercent', label: 'Packet loss (%)', kind: 'number', required: true, step: '0.01' },
    { key: 'lastTestedAt', label: 'Last tested', kind: 'date' },
    { key: 'technicalNotes', label: 'Technical notes', kind: 'textarea' },
  ],
  billing: [
    { key: 'billingCycle', label: 'Billing cycle', kind: 'select', options: ['Monthly (1st-30th)', 'Quarterly', 'Advance Annual'], required: true },
    { key: 'monthlyRecurringCharges', label: 'Monthly recurring charges (GHS)', kind: 'number', required: true, step: '0.01' },
    { key: 'oneTimePendingCharges', label: 'One-time pending charges (GHS)', kind: 'number', required: true, step: '0.01' },
    { key: 'currentBalanceGHS', label: 'Current balance (GHS)', kind: 'number', required: true, step: '0.01' },
    { key: 'status', label: 'Account status', kind: 'select', options: ['Current', 'Overdue', 'Suspended'], required: true },
    { key: 'lastInvoiceDate', label: 'Last invoice date', kind: 'date' },
    { key: 'paymentStatus', label: 'Payment status', kind: 'select', options: ['Paid', 'Pending', 'Overdue'], required: true },
  ],
  invoice: [
    { key: 'billingAccountId', label: 'Billing account', kind: 'select', required: true },
    { key: 'period', label: 'Billing period', required: true },
    { key: 'amountGHS', label: 'Amount (GHS)', kind: 'number', required: true, step: '0.01' },
    { key: 'taxGHS', label: 'Tax (GHS)', kind: 'number', required: true, step: '0.01' },
    { key: 'totalGHS', label: 'Total (GHS)', kind: 'number', required: true, step: '0.01' },
    { key: 'dueDate', label: 'Due date', kind: 'date', required: true },
    { key: 'status', label: 'Status', kind: 'select', options: ['Paid', 'Unpaid', 'Overdue'], required: true },
    { key: 'paidDate', label: 'Paid date', kind: 'date' },
  ],
  pricing: [
    { key: 'productId', label: 'Product ID', required: true },
    { key: 'productName', label: 'Product / solution', required: true },
    { key: 'standardPriceGHS', label: 'Standard price (GHS)', kind: 'number', required: true, step: '0.01' },
    { key: 'customerPriceGHS', label: 'Customer price (GHS)', kind: 'number', required: true, step: '0.01' },
    { key: 'discountPercent', label: 'Discount (%)', kind: 'number', required: true, step: '0.01' },
    { key: 'pricingReason', label: 'Pricing reason', kind: 'textarea', required: true },
    { key: 'contractRef', label: 'Contract reference' },
    { key: 'effectiveDate', label: 'Effective date', kind: 'date', required: true },
    { key: 'expiryDate', label: 'Expiry date', kind: 'date', required: true },
    { key: 'approvalStatus', label: 'Approval status', kind: 'select', options: ['Approved', 'Pending Approval', 'Rejected'], required: true },
    { key: 'approvedBy', label: 'Approved by' },
  ],
  document: [
    { key: 'name', label: 'Document name', required: true },
    { key: 'type', label: 'Document type', kind: 'select', options: ['Customer Documents', 'Technical Documents', 'Quotations', 'Contracts', 'Business Registration', 'Identification', 'Engagement Forms', 'Solution Designs', 'Other'], required: true },
    { key: 'uploadedBy', label: 'Provided by' },
    { key: 'size', label: 'File size (metadata)' },
    { key: 'status', label: 'Review status', kind: 'select', options: ['Verified', 'Pending Review', 'Rejected', 'Archived'], required: true },
    { key: 'fileFormat', label: 'File format (metadata)', kind: 'select', options: ['pdf', 'docx', 'xlsx', 'png', 'zip'], required: true },
    { key: 'version', label: 'Version', required: true },
  ],
};

const kindLabels: Record<RecordKind, string> = {
  service: 'Service',
  network: 'Network / circuit',
  billing: 'Billing account',
  invoice: 'Invoice',
  pricing: 'Customer pricing',
  document: 'Document metadata',
};

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'services', label: 'Services', icon: Layers },
  { id: 'network', label: 'Network & Circuits', icon: Server },
  { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
  { id: 'revenue', label: 'Revenue & Contract', icon: TrendingUp },
  { id: 'pricing', label: 'Pricing', icon: Tag },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'activity', label: 'Activity & Audit', icon: Activity },
];

const emptyProfile = (customer: Customer) => ({
  name: customer.name,
  segment: customer.segment,
  industry: customer.industry,
  location: customer.location,
  ghanaPostGps: customer.ghanaPostGps,
  status: customer.status,
  website: customer.website || '',
  contactName: customer.primaryContact?.name || '',
  contactRole: customer.primaryContact?.role || '',
  contactEmail: customer.primaryContact?.email || '',
  contactPhone: customer.primaryContact?.phone || '',
});

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    customers, subscriptions, networkConfigs, billingAccounts, invoices, customerPrices, documents, auditLogs,
    addSubscription, updateSubscription, deleteSubscription,
    addNetworkConfig, updateNetworkConfig, deleteNetworkConfig,
    addBillingAccount, updateBillingAccount, deleteBillingAccount,
    addInvoice, updateInvoice, deleteInvoice,
    addCustomerPrice, updateCustomerPrice, deleteCustomerPrice,
    addDocument, updateDocument, deleteDocument,
    addAuditLog, updateCustomer, deleteCustomer, databaseSyncing, databaseSyncError, databaseReady,
  } = useAppState();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [recordKind, setRecordKind] = useState<RecordKind | null>(null);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<ReturnType<typeof emptyProfile> | null>(null);
  const [revenueForm, setRevenueForm] = useState<{ monthlyAmount: string | null; contractValue: string | null }>({
    monthlyAmount: null,
    contractValue: null,
  });

  const customer = customers.find((entry) => entry.id === id);
  const customerSubs = useMemo(() => subscriptions.filter((entry) => entry.customerId === id), [subscriptions, id]);
  const customerNets = useMemo(() => networkConfigs.filter((entry) => entry.customerId === id), [networkConfigs, id]);
  const customerBilling = useMemo(() => billingAccounts.filter((entry) => entry.customerId === id), [billingAccounts, id]);
  const customerInvoices = useMemo(() => invoices.filter((entry) => entry.customerId === id), [invoices, id]);
  const customerPricing = useMemo(() => customerPrices.filter((entry) => entry.customerId === id), [customerPrices, id]);
  const customerDocs = useMemo(() => documents.filter((entry) => entry.customerId === id), [documents, id]);
  const customerAudit = useMemo(() => auditLogs.filter((entry) => entry.recordId === id || entry.recordName === customer?.name), [auditLogs, id, customer?.name]);

  const monthlyRevenue = customerSubs.length
    ? customerSubs.reduce((sum, item) => sum + (item.mrcPriceGHS || item.monthlyPriceGHS || 0), 0)
    : customerBilling.length
      ? customerBilling.reduce((sum, item) => sum + item.monthlyRecurringCharges, 0)
      : customer?.customPriceGHS;
  const contractValue = customer?.contractValueGHS;

  if (!databaseReady && !databaseSyncError) {
    return <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Loading customer records from the shared database…</div>;
  }
  if (!databaseReady) {
    return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
      <h2 className="font-bold">Shared customer data is unavailable</h2>
      <p className="mt-1">This dossier is not showing cached or sample records because the database could not be loaded. Fix the Supabase setup and reload.</p>
    </div>;
  }

  if (!customer) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <h2 className="font-bold text-gray-900">Customer not found</h2>
        <p className="mt-2 text-sm text-gray-500">This customer is not available in the shared repository.</p>
        <button onClick={() => navigate('/customers')} className="mt-4 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold">Return to customers</button>
      </div>
    );
  }

  const customerName = customer.name;
  const openRecord = (kind: RecordKind, record?: Record<string, unknown>) => {
    setRecordKind(kind);
    setEditingRecord(record || null);
    const values: Record<string, string> = {};
    fields[kind].forEach(({ key }) => {
      values[key] = record?.[key] == null ? '' : String(record[key]);
    });
    if (kind === 'service' && !record) {
      values.category = 'Fixed';
      values.status = 'Active';
      values.quantity = '1';
      values.mrcPriceGHS = '0';
      values.otcPriceGHS = '0';
      values.billingFrequency = 'Monthly Postpaid';
      values.accountManager = customer.accountManager;
    }
    if (kind === 'network' && !record) {
      values.connectionType = 'Direct Dedicated Fiber';
      values.connectivityType = 'Direct Internet (DIA)';
      values.networkStatus = 'Configuring';
      values.latencyMs = '0';
      values.packetLossPercent = '0';
    }
    if (kind === 'billing' && !record) {
      values.billingCycle = 'Monthly (1st-30th)';
      values.status = 'Current';
      values.paymentStatus = 'Pending';
      values.monthlyRecurringCharges = '0';
      values.oneTimePendingCharges = '0';
      values.currentBalanceGHS = '0';
    }
    if (kind === 'invoice' && !record) {
      values.status = 'Unpaid';
      values.amountGHS = '0';
      values.taxGHS = '0';
      values.totalGHS = '0';
    }
    if (kind === 'pricing' && !record) {
      values.approvalStatus = 'Pending Approval';
      values.standardPriceGHS = '0';
      values.customerPriceGHS = '0';
      values.discountPercent = '0';
      values.approvedBy = '';
    }
    if (kind === 'document' && !record) {
      values.type = 'Customer Documents';
      values.uploadedBy = user?.name || '';
      values.status = 'Pending Review';
      values.fileFormat = 'pdf';
      values.version = 'v1';
    }
    setForm(values);
  };

  const closeRecord = () => {
    setRecordKind(null);
    setEditingRecord(null);
  };

  const saveRecord = (event: React.FormEvent) => {
    event.preventDefault();
    if (!recordKind) return;
    const payload: Record<string, unknown> = { ...form };
    let savedRecordId = String(editingRecord?.id || '');
    fields[recordKind].forEach(({ key, kind }) => {
      if (kind === 'number') payload[key] = form[key] === '' ? 0 : Number(form[key]);
    });

    if (recordKind === 'service') {
      const record = {
        ...payload, customerId: customer.id, customerName, currency: 'GHS',
        location: payload.location || customer.location, contractRef: payload.contractRef || '',
      } as unknown as Omit<ServiceSubscription, 'id' | 'createdBy' | 'updatedAt'>;
      if (editingRecord) updateSubscription(savedRecordId, record);
      else savedRecordId = addSubscription(record).id;
    } else if (recordKind === 'network') {
      const record = {
        ...payload, customerId: customer.id, customerName,
        ipAddress: payload.ipAddress || '', subnetMask: payload.subnetMask || '',
        gatewayIp: payload.gatewayIp || '', accessTechnology: payload.accessTechnology || '',
        routerCPE: payload.routerCPE || '', installationLocation: payload.installationLocation || customer.location,
        lastTestedAt: payload.lastTestedAt || new Date().toISOString().slice(0, 10),
        technicalNotes: payload.technicalNotes || '',
      } as unknown as Omit<NetworkConfiguration, 'id'>;
      if (editingRecord) updateNetworkConfig(savedRecordId, record);
      else savedRecordId = addNetworkConfig(record).id;
    } else if (recordKind === 'billing') {
      const record = { ...payload, customerId: customer.id, customerName, currency: 'GHS' } as unknown as Omit<BillingAccount, 'id'>;
      if (editingRecord) updateBillingAccount(savedRecordId, record);
      else savedRecordId = addBillingAccount(record).id;
    } else if (recordKind === 'invoice') {
      const record = { ...payload, customerId: customer.id, customerName } as unknown as Omit<InvoiceRecord, 'id'>;
      if (editingRecord) updateInvoice(savedRecordId, record);
      else savedRecordId = addInvoice(record).id;
    } else if (recordKind === 'pricing') {
      const record = { ...payload, customerId: customer.id, customerName } as unknown as Omit<CustomerSpecificPrice, 'id'>;
      if (editingRecord) updateCustomerPrice(savedRecordId, record);
      else savedRecordId = addCustomerPrice(record).id;
    } else {
      const record = {
        ...payload, customerId: customer.id, customerName, uploadedBy: form.uploadedBy || user?.name || 'Authenticated user',
      } as unknown as Omit<EnterpriseDocument, 'id' | 'date'>;
      if (editingRecord) updateDocument(savedRecordId, record);
      else savedRecordId = addDocument(record).id;
    }

    addAuditLog({
      user: user?.name || 'Authenticated user',
      userRole: user?.accessTier || 'staff',
      action: editingRecord ? 'UPDATE' : 'CREATE',
      module: kindLabels[recordKind],
      recordName: customerName,
      recordId: savedRecordId,
      details: `${editingRecord ? 'Updated' : 'Added'} ${kindLabels[recordKind].toLowerCase()} ${savedRecordId} in the customer dossier.`,
    });
    showToast('success', `${kindLabels[recordKind]} saved`, `The record is linked to ${customerName}.`);
    closeRecord();
  };

  const removeRecord = (kind: RecordKind, record: Record<string, unknown>) => {
    if (!window.confirm(`Delete this ${kindLabels[kind].toLowerCase()} record?`)) return;
    const recordId = String(record.id);
    if (kind === 'service') deleteSubscription(recordId);
    else if (kind === 'network') deleteNetworkConfig(recordId);
    else if (kind === 'billing') deleteBillingAccount(recordId);
    else if (kind === 'invoice') deleteInvoice(recordId);
    else if (kind === 'pricing') deleteCustomerPrice(recordId);
    else deleteDocument(recordId);
    addAuditLog({
      user: user?.name || 'Authenticated user',
      userRole: user?.accessTier || 'staff',
      action: 'DELETE',
      module: kindLabels[kind],
      recordName: customerName,
      recordId,
      details: `Deleted ${kindLabels[kind].toLowerCase()} ${recordId} from the customer dossier.`,
    });
    showToast('info', `${kindLabels[kind]} deleted`, 'The record was removed from the shared customer dossier.');
  };

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    updateCustomer(customer.id, {
      name: profile.name.trim(),
      segment: profile.segment,
      industry: profile.industry,
      location: profile.location,
      address: profile.location,
      ghanaPostGps: profile.ghanaPostGps,
      status: profile.status,
      website: profile.website,
      primaryContact: {
        ...customer.primaryContact,
        customerId: customer.id,
        name: profile.contactName,
        role: profile.contactRole,
        email: profile.contactEmail,
        phone: profile.contactPhone,
      },
      contactPerson: profile.contactName,
    });
    showToast('success', 'Customer details saved', 'The customer record was updated.');
    setProfileOpen(false);
  };

  const saveRevenue = (event: React.FormEvent) => {
    event.preventDefault();
    const monthlyInput = revenueForm.monthlyAmount ?? (customer.customPriceGHS == null ? '' : String(customer.customPriceGHS));
    const contractInput = revenueForm.contractValue ?? (customer.contractValueGHS == null ? '' : String(customer.contractValueGHS));
    const monthlyAmount = monthlyInput.trim() ? Number(monthlyInput) : undefined;
    const savedContractValue = contractInput.trim() ? Number(contractInput) : undefined;
    if ((monthlyAmount !== undefined && (!Number.isFinite(monthlyAmount) || monthlyAmount < 0))
      || (savedContractValue !== undefined && (!Number.isFinite(savedContractValue) || savedContractValue < 0))) {
      showToast('error', 'Invalid amount', 'Enter a valid non-negative amount in GHS.');
      return;
    }
    updateCustomer(customer.id, { customPriceGHS: monthlyAmount, contractValueGHS: savedContractValue });
    showToast('success', 'Revenue and contract fields saved', 'These values are stored on the customer record.');
  };

  const openProfile = () => {
    setProfile(emptyProfile(customer));
    setProfileOpen(true);
  };

  const renderActions = (kind: RecordKind, record: Record<string, unknown>) => (
    <div className="flex justify-end gap-2 whitespace-nowrap">
      <button aria-label={`Edit ${kindLabels[kind]}`} onClick={() => openRecord(kind, record)} className="rounded-md p-1.5 text-blue-700 hover:bg-blue-50"><Edit className="h-4 w-4" /></button>
      <button aria-label={`Delete ${kindLabels[kind]}`} onClick={() => removeRecord(kind, record)} className="rounded-md p-1.5 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
    </div>
  );

  const card = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm';
  const table = 'w-full min-w-[720px] text-left text-xs';
  const addButton = (kind: RecordKind) => (
    <button onClick={() => openRecord(kind)} className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-yellow-500">
      <Plus className="h-4 w-4" /> Add {kindLabels[kind]}
    </button>
  );

  const renderTable = (headers: string[], rows: React.ReactNode, empty: string) => (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className={table}>
        <thead className="border-b bg-gray-50 text-[10px] font-bold uppercase tracking-wide text-gray-500">
          <tr>{headers.map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows || <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-sm text-gray-500">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );

  const recordModal = recordKind && (
    <Modal
      isOpen
      onClose={closeRecord}
      title={`${editingRecord ? 'Edit' : 'Add'} ${kindLabels[recordKind]}`}
      subtitle={`Saved to ${customerName}'s shared customer dossier.`}
      maxWidth="2xl"
      actions={
        <>
          <button type="button" onClick={closeRecord} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700">Cancel</button>
          <button type="submit" form="customer-record-form" className="rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold text-slate-950">Save record</button>
        </>
      }
    >
      {recordKind === 'document' && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">This form saves document metadata only. No file is uploaded or stored.</p>}
      <form id="customer-record-form" onSubmit={saveRecord} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields[recordKind].map((field) => {
          const value = form[field.key] || '';
          const common = {
            id: field.key, name: field.key, required: field.required, value,
            onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
              setForm((previous) => ({ ...previous, [field.key]: event.target.value })),
            className: 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100',
          };
          const isBillingAccountField = recordKind === 'invoice' && field.key === 'billingAccountId';
          return (
            <label key={field.key} htmlFor={field.key} className={`text-xs font-semibold text-gray-700 ${field.kind === 'textarea' ? 'sm:col-span-2' : ''}`}>
              {field.label}
              {field.kind === 'select' ? (
                <select {...common}>
                  <option value="">Select…</option>
                  {(isBillingAccountField ? customerBilling.map((account) => account.id) : field.options || []).map((option) => (
                    <option value={option} key={option}>{isBillingAccountField ? `${option} · ${customerName}` : option}</option>
                  ))}
                </select>
              ) : field.kind === 'textarea' ? (
                <textarea {...common} rows={3} />
              ) : (
                <input {...common} type={field.kind || 'text'} step={field.step} />
              )}
            </label>
          );
        })}
        {recordKind === 'invoice' && customerBilling.length === 0 && (
          <p className="sm:col-span-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Create a billing account for this customer before adding an invoice.</p>
        )}
      </form>
    </Modal>
  );

  return (
    <div className="space-y-5">
      <header className={`${card} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-yellow-400"><Building2 className="h-6 w-6" /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-yellow-800">
              <span>Customer dossier</span>
              <span className="font-mono text-gray-500">{customer.id}</span>
              {databaseSyncing && <span className="normal-case text-gray-500">Syncing…</span>}
              {!databaseSyncError && !databaseSyncing && <span className="normal-case text-emerald-700">Shared database</span>}
            </div>
            <h1 className="mt-1 text-xl font-bold text-gray-900">{customer.name}</h1>
            <p className="mt-1 text-xs text-gray-500">{customer.segment} · {customer.industry} · {customer.assignedKAM || customer.accountManager || 'No account manager'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/customers" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700"><ArrowLeft className="h-4 w-4" /> Customers</Link>
          <button onClick={openProfile} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700"><Edit className="h-4 w-4" /> Edit customer</button>
          <button onClick={() => {
            if (window.confirm(`Delete ${customer.name} and its linked dossier records?`)) {
              deleteCustomer(customer.id);
              navigate('/customers');
            }
          }} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      </header>

      <section className={`${card} grid grid-cols-2 gap-4 md:grid-cols-4`}>
        <div><p className="text-[10px] font-bold uppercase text-gray-400">Services</p><p className="mt-1 text-lg font-black text-gray-900">{customerSubs.length}</p></div>
        <div><p className="text-[10px] font-bold uppercase text-gray-400">Network circuits</p><p className="mt-1 text-lg font-black text-gray-900">{customerNets.length}</p></div>
        <div><p className="text-[10px] font-bold uppercase text-gray-400">Monthly recurring</p><p className="mt-1 text-lg font-black text-emerald-700">{monthlyRevenue == null ? '—' : `GHS ${monthlyRevenue.toLocaleString()}`}</p></div>
        <div><p className="text-[10px] font-bold uppercase text-gray-400">Contract value</p><p className="mt-1 text-lg font-black text-gray-900">{contractValue == null ? '—' : `GHS ${contractValue.toLocaleString()}`}</p></div>
      </section>

      <nav className="flex gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2">
        {tabs.map(({ id: tabId, label, icon: Icon }) => {
          const count = tabId === 'services' ? customerSubs.length
            : tabId === 'network' ? customerNets.length
              : tabId === 'billing' ? customerInvoices.length
                : tabId === 'pricing' ? customerPricing.length
                  : tabId === 'documents' ? customerDocs.length
                    : tabId === 'activity' ? customerAudit.length : undefined;
          return (
            <button key={tabId} onClick={() => setActiveTab(tabId)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${activeTab === tabId ? 'bg-yellow-400 text-slate-950' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="h-3.5 w-3.5" /> {label}{count === undefined ? '' : ` (${count})`}
            </button>
          );
        })}
      </nav>

      {activeTab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className={`${card} lg:col-span-2`}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-500">Customer details</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-gray-400">Legal name</dt><dd className="mt-1 font-semibold">{customer.name}</dd></div>
              <div><dt className="text-xs text-gray-400">Industry</dt><dd className="mt-1 font-semibold">{customer.industry || '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">Segment</dt><dd className="mt-1 font-semibold">{customer.segment}</dd></div>
              <div><dt className="text-xs text-gray-400">Status</dt><dd className="mt-1"><StatusBadge status={customer.status} size="sm" /></dd></div>
              <div><dt className="text-xs text-gray-400">Address</dt><dd className="mt-1 flex items-center gap-1 font-semibold"><MapPin className="h-3.5 w-3.5 text-gray-400" />{customer.location || '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">GhanaPost GPS</dt><dd className="mt-1 font-mono font-semibold">{customer.ghanaPostGps || '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">Registration number</dt><dd className="mt-1 font-mono font-semibold">{customer.registrationNumber || '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">TIN</dt><dd className="mt-1 font-mono font-semibold">{customer.tin || '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">Website</dt><dd className="mt-1 font-semibold">{customer.website || '—'}</dd></div>
              <div><dt className="text-xs text-gray-400">Account manager</dt><dd className="mt-1 font-semibold">{customer.assignedKAM || customer.accountManager || '—'}</dd></div>
            </dl>
          </section>
          <section className={card}>
            <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500"><User className="h-4 w-4" /> Primary contact</h2>
            <p className="font-bold text-gray-900">{customer.primaryContact?.name || '—'}</p>
            <p className="mt-1 text-xs text-gray-500">{customer.primaryContact?.role || '—'}</p>
            <p className="mt-4 break-all text-xs text-gray-700">{customer.primaryContact?.email || customer.email || '—'}</p>
            <p className="mt-2 text-xs text-gray-700">{customer.primaryContact?.phone || customer.phone || '—'}</p>
          </section>
        </div>
      )}

      {activeTab === 'services' && (
        <section className={`${card} space-y-4`}>
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Customer services</h2><p className="mt-1 text-xs text-gray-500">Saved service subscriptions linked by customer ID.</p></div>{addButton('service')}</div>
          {renderTable(['Reference', 'Product / service', 'Package', 'Dates', 'Monthly charge', 'Status', ''], customerSubs.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-3 font-mono font-semibold">{item.id}</td>
              <td className="px-3 py-3"><p className="font-semibold">{item.productName}</p><p className="text-gray-500">{item.serviceName}</p></td>
              <td className="px-3 py-3">{item.packageTitle || item.packageName || '—'}</td>
              <td className="px-3 py-3">{item.startDate || '—'} → {item.endDate || '—'}</td>
              <td className="px-3 py-3 font-semibold">GHS {item.mrcPriceGHS.toLocaleString()}</td>
              <td className="px-3 py-3">{item.status}</td><td className="px-3 py-3">{renderActions('service', item as unknown as Record<string, unknown>)}</td>
            </tr>
          )), 'No saved service subscriptions for this customer yet.')}
        </section>
      )}

      {activeTab === 'network' && (
        <section className={`${card} space-y-4`}>
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Network & circuit records</h2><p className="mt-1 text-xs text-gray-500">Customer-linked circuit, connectivity and configuration details.</p></div>{addButton('network')}</div>
          {renderTable(['Circuit', 'Service', 'Connectivity', 'Bandwidth', 'IP / VLAN', 'Status', ''], customerNets.map((item) => (
            <tr key={item.id}>
              <td className="px-3 py-3 font-mono font-semibold">{item.circuitId || item.id}</td>
              <td className="px-3 py-3">{item.serviceName}</td><td className="px-3 py-3">{item.connectivityType}</td>
              <td className="px-3 py-3">{item.bandwidth || '—'}</td>
              <td className="px-3 py-3">{item.ipAddress || '—'}{item.vlanId == null ? '' : ` · VLAN ${item.vlanId}`}</td>
              <td className="px-3 py-3">{item.networkStatus}</td><td className="px-3 py-3">{renderActions('network', item as unknown as Record<string, unknown>)}</td>
            </tr>
          )), 'No saved network circuits for this customer yet.')}
        </section>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-5">
          <section className={`${card} space-y-4`}>
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Billing accounts</h2><p className="mt-1 text-xs text-gray-500">Real account balances and recurring charge records.</p></div>{addButton('billing')}</div>
            {renderTable(['Account', 'Cycle', 'Recurring', 'Balance', 'Payment', 'Status', ''], customerBilling.map((item) => (
              <tr key={item.id}><td className="px-3 py-3 font-mono font-semibold">{item.id}</td><td className="px-3 py-3">{item.billingCycle}</td>
                <td className="px-3 py-3">GHS {item.monthlyRecurringCharges.toLocaleString()}</td><td className="px-3 py-3">GHS {item.currentBalanceGHS.toLocaleString()}</td>
                <td className="px-3 py-3">{item.paymentStatus}</td><td className="px-3 py-3">{item.status}</td>
                <td className="px-3 py-3">{renderActions('billing', item as unknown as Record<string, unknown>)}</td></tr>
            )), 'No billing accounts saved for this customer yet.')}
          </section>
          <section className={`${card} space-y-4`}>
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Invoices</h2><p className="mt-1 text-xs text-gray-500">Invoices belong to this customer and a saved billing account.</p></div>{addButton('invoice')}</div>
            {renderTable(['Invoice', 'Period', 'Billing account', 'Amount', 'Due date', 'Status', ''], customerInvoices.map((item) => (
              <tr key={item.id}><td className="px-3 py-3 font-mono font-semibold">{item.id}</td><td className="px-3 py-3">{item.period}</td>
                <td className="px-3 py-3 font-mono">{item.billingAccountId}</td><td className="px-3 py-3 font-semibold">GHS {item.totalGHS.toLocaleString()}</td>
                <td className="px-3 py-3">{item.dueDate}</td><td className="px-3 py-3">{item.status}</td>
                <td className="px-3 py-3">{renderActions('invoice', item as unknown as Record<string, unknown>)}</td></tr>
            )), 'No invoices saved for this customer yet.')}
          </section>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={card}>
            <h2 className="text-sm font-bold">Saved revenue and contract values</h2>
            <p className="mt-1 text-xs text-gray-500">Monthly revenue is derived from subscriptions or billing accounts. A manually saved monthly amount is used only when neither exists.</p>
            <dl className="mt-5 space-y-4">
              <div><dt className="text-xs text-gray-500">Monthly recurring revenue</dt><dd className="mt-1 text-xl font-black text-emerald-700">{monthlyRevenue == null ? 'Not recorded' : `GHS ${monthlyRevenue.toLocaleString()}`}</dd></div>
              <div><dt className="text-xs text-gray-500">Contract value</dt><dd className="mt-1 text-xl font-black">{contractValue == null ? 'Not recorded' : `GHS ${contractValue.toLocaleString()}`}</dd></div>
              <div><dt className="text-xs text-gray-500">Source</dt><dd className="mt-1 text-sm">{customerSubs.length ? 'Service subscriptions' : customerBilling.length ? 'Billing accounts' : customer.customPriceGHS != null ? 'Customer-entered monthly amount' : 'No saved revenue records'}</dd></div>
            </dl>
          </section>
          <form className={`${card} space-y-4`} onSubmit={saveRevenue}>
            <div><h2 className="text-sm font-bold">Edit customer revenue fields</h2><p className="mt-1 text-xs text-gray-500">These optional values are saved on the customer record. Contract value is not estimated.</p></div>
            <label className="block text-xs font-semibold text-gray-700">Manual monthly amount (GHS)<input type="number" min="0" step="0.01" value={revenueForm.monthlyAmount ?? (customer.customPriceGHS == null ? '' : String(customer.customPriceGHS))} onChange={(event) => setRevenueForm((previous) => ({ ...previous, monthlyAmount: event.target.value }))} placeholder="Not set" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-semibold text-gray-700">Contract value (GHS)<input type="number" min="0" step="0.01" value={revenueForm.contractValue ?? (customer.contractValueGHS == null ? '' : String(customer.contractValueGHS))} onChange={(event) => setRevenueForm((previous) => ({ ...previous, contractValue: event.target.value }))} placeholder="Not set" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></label>
            <p className="text-[11px] text-gray-500">Leave a field empty to clear its saved manual value.</p>
            <button className="rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold">Save revenue fields</button>
          </form>
        </div>
      )}

      {activeTab === 'pricing' && (
        <section className={`${card} space-y-4`}>
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Customer-specific pricing</h2><p className="mt-1 text-xs text-gray-500">Saved prices and approvals linked to this customer.</p></div>{addButton('pricing')}</div>
          {renderTable(['Product', 'Standard', 'Customer price', 'Discount', 'Term', 'Approval', ''], customerPricing.map((item) => (
            <tr key={item.id}><td className="px-3 py-3"><p className="font-semibold">{item.productName}</p><p className="text-gray-500">{item.productId}</p></td>
              <td className="px-3 py-3">GHS {item.standardPriceGHS.toLocaleString()}</td><td className="px-3 py-3 font-semibold">GHS {item.customerPriceGHS.toLocaleString()}</td>
              <td className="px-3 py-3">{item.discountPercent}%</td><td className="px-3 py-3">{item.effectiveDate} → {item.expiryDate}</td>
              <td className="px-3 py-3">{item.approvalStatus}</td><td className="px-3 py-3">{renderActions('pricing', item as unknown as Record<string, unknown>)}</td></tr>
          )), 'No customer pricing records saved yet.')}
        </section>
      )}

      {activeTab === 'documents' && (
        <section className={`${card} space-y-4`}>
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold">Document metadata</h2><p className="mt-1 text-xs text-gray-500">Metadata only: adding a row does not upload or store a file.</p></div>{addButton('document')}</div>
          {renderTable(['Name', 'Type', 'Provided by', 'Format / size', 'Version', 'Status', ''], customerDocs.map((item) => (
            <tr key={item.id}><td className="px-3 py-3 font-semibold">{item.name}</td><td className="px-3 py-3">{item.type}</td>
              <td className="px-3 py-3">{item.uploadedBy}</td><td className="px-3 py-3 uppercase">{item.fileFormat} · {item.size || 'size not recorded'}</td>
              <td className="px-3 py-3">{item.version}</td><td className="px-3 py-3">{item.status}</td>
              <td className="px-3 py-3">{renderActions('document', item as unknown as Record<string, unknown>)}</td></tr>
          )), 'No document metadata saved for this customer yet.')}
        </section>
      )}

      {activeTab === 'activity' && (
        <section className={`${card} space-y-4`}>
          <div><h2 className="text-sm font-bold">Activity & audit</h2><p className="mt-1 text-xs text-gray-500">Read-only entries already recorded against this customer.</p></div>
          {renderTable(['Timestamp', 'Action', 'Module', 'Record', 'User', 'Details'], customerAudit.map((item) => (
            <tr key={item.id}><td className="px-3 py-3 whitespace-nowrap">{item.timestamp}</td><td className="px-3 py-3 font-semibold">{item.action}</td>
              <td className="px-3 py-3">{item.module}</td><td className="px-3 py-3">{item.recordName}</td><td className="px-3 py-3">{item.user}</td>
              <td className="px-3 py-3">{item.details || '—'}</td></tr>
          )), 'No audit entries recorded for this customer.')}
        </section>
      )}

      {recordModal}

      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="Edit customer" subtitle="Customer profile fields are saved to the shared database." maxWidth="2xl" actions={
        <>
          <button type="button" onClick={() => setProfileOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold">Cancel</button>
          <button form="customer-profile-form" className="rounded-lg bg-yellow-400 px-4 py-2 text-xs font-bold">Save customer</button>
        </>
      }>
        {profile && <form id="customer-profile-form" onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">Customer name<input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></label>
          <label className="text-xs font-semibold">Segment<select value={profile.segment} onChange={(event) => setProfile({ ...profile, segment: event.target.value as CustomerSegment })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{['Large Enterprise', 'SME', 'Public Sector', 'Multinational'].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="text-xs font-semibold">Industry<input value={profile.industry} onChange={(event) => setProfile({ ...profile, industry: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></label>
          <label className="text-xs font-semibold">Status<select value={profile.status} onChange={(event) => setProfile({ ...profile, status: event.target.value as CustomerStatus })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">{['Active', 'Prospect', 'Suspended', 'Dormant'].map((value) => <option key={value}>{value}</option>)}</select></label>
          {([
            ['location', 'Address'], ['ghanaPostGps', 'GhanaPost GPS'], ['website', 'Website'],
            ['contactName', 'Primary contact'], ['contactRole', 'Contact role'], ['contactEmail', 'Contact email'], ['contactPhone', 'Contact phone'],
          ] as const).map(([key, label]) => <label key={key} className="text-xs font-semibold">{label}<input value={profile[key]} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></label>)}
        </form>}
      </Modal>
    </div>
  );
};
