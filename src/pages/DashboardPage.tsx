/**
 * MTN ENTERPRISE HUB - EXECUTIVE DASHBOARD
 * 
 * Clean, uncluttered operational overview for management and Key Account Managers.
 * Features 4 KPI cards, Opportunity Pipeline chart, Service Category donut,
 * Full-featured Customer Repository (Manual Input, View, Edit, Delete),
 * Recent Operational Notifications, and Quick Action buttons.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  ShieldCheck,
  UserPlus,
  ArrowUpRight,
  Building2,
  Clock,
  BriefcaseBusiness,
  Package,
  Search,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Phone,
  Mail,
  MapPin,
  Globe,
  ExternalLink,
  AlertTriangle,
  X,
  CheckCircle2,
  DollarSign,
  CalendarDays,
  Sparkles,
  ListTodo,
  FileCheck2,
  Rocket,
  Award,
  CalendarClock,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
} from 'recharts';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrencyGHS, formatDate, getPriorityColor } from '../utils/formatters';
import type {
  OpportunityStage,
  ProductCategory,
  Customer,
  CustomerSegment,
  CustomerStatus,
} from '../types';

const opportunityStages: OpportunityStage[] = [
  'New',
  'Qualification',
  'Discovery',
  'Presales',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

const serviceCategoryColors: Record<ProductCategory, string> = {
  Converged: '#FFCC00',
  Fixed: '#2563EB',
  Mobile: '#059669',
  Digital: '#475569',
};

const segmentOptions: CustomerSegment[] = [
  'Large Enterprise',
  'SME',
  'Public Sector',
  'Multinational',
];

const industryOptions: string[] = [
  'Banking & Financial Services',
  'Mining & Natural Resources',
  'FMCG & Manufacturing',
  'Healthcare & Pharmaceuticals',
  'Education & Research',
  'Logistics & Transportation',
  'Telecommunications & Technology',
  'Government & Public Sector',
  'Energy & Utilities',
  'Hospitality & Tourism',
  'Retail & Commerce',
  'Other Enterprise',
];

const statusOptions: CustomerStatus[] = [
  'Active',
  'Prospect',
  'Suspended',
  'Dormant',
];

const creditRatingOptions = ['AAA', 'AA', 'A', 'BBB', 'BB', 'Under Review'] as const;

export const DashboardPage: React.FC = () => {
  const {
    customers,
    opportunities,
    approvals,
    notifications,
    activeServices,
    currentUser,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addOpportunity,
    products,
    tasks,
  } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Modal display states
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isViewCustomerOpen, setIsViewCustomerOpen] = useState(false);
  const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false);
  const [isAddOpportunityOpen, setIsAddOpportunityOpen] = useState(false);

  // Active customer selected for view, edit, or delete action
  const [activeCust, setActiveCust] = useState<Customer | null>(null);

  // Customer Filter & Search on Dashboard
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState<string>('ALL');
  const [showAllCustomers, setShowAllCustomers] = useState(false);

  // ==========================================
  // ADD CUSTOMER FORM STATE (Manual Input)
  // ==========================================
  const [addCustName, setAddCustName] = useState('');
  const [addCustTradingName, setAddCustTradingName] = useState('');
  const [addCustSegment, setAddCustSegment] = useState<CustomerSegment>('Large Enterprise');
  const [addCustIndustry, setAddCustIndustry] = useState('Banking & Financial Services');
  const [addCustStatus, setAddCustStatus] = useState<CustomerStatus>('Active');
  const [addCustCreditRating, setAddCustCreditRating] = useState<'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'Under Review'>('AA');
  const [addCustEstablishedYear, setAddCustEstablishedYear] = useState<number>(new Date().getFullYear());
  const [addCustLocation, setAddCustLocation] = useState('Airport City, Accra');
  const [addCustGhanaPostGps, setAddCustGhanaPostGps] = useState('GA-100-2026');
  const [addCustRegNumber, setAddCustRegNumber] = useState('');
  const [addCustTin, setAddCustTin] = useState('');
  const [addCustWebsite, setAddCustWebsite] = useState('');
  const [addCustEmail, setAddCustEmail] = useState('');
  const [addCustPhone, setAddCustPhone] = useState('');
  const [addCustContactName, setAddCustContactName] = useState('');
  const [addCustContactRole, setAddCustContactRole] = useState('Chief Technology Officer');
  const [addCustContactEmail, setAddCustContactEmail] = useState('');
  const [addCustContactPhone, setAddCustContactPhone] = useState('');

  // ==========================================
  // EDIT CUSTOMER FORM STATE (Manual Input)
  // ==========================================
  const [editCustName, setEditCustName] = useState('');
  const [editCustTradingName, setEditCustTradingName] = useState('');
  const [editCustSegment, setEditCustSegment] = useState<CustomerSegment>('Large Enterprise');
  const [editCustIndustry, setEditCustIndustry] = useState('Banking & Financial Services');
  const [editCustStatus, setEditCustStatus] = useState<CustomerStatus>('Active');
  const [editCustCreditRating, setEditCustCreditRating] = useState<'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'Under Review'>('AA');
  const [editCustEstablishedYear, setEditCustEstablishedYear] = useState<number>(new Date().getFullYear());
  const [editCustLocation, setEditCustLocation] = useState('');
  const [editCustGhanaPostGps, setEditCustGhanaPostGps] = useState('');
  const [editCustRegNumber, setEditCustRegNumber] = useState('');
  const [editCustTin, setEditCustTin] = useState('');
  const [editCustWebsite, setEditCustWebsite] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustContactName, setEditCustContactName] = useState('');
  const [editCustContactRole, setEditCustContactRole] = useState('');
  const [editCustContactEmail, setEditCustContactEmail] = useState('');
  const [editCustContactPhone, setEditCustContactPhone] = useState('');

  // Opportunity Modal state
  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppCustomer, setNewOppCustomer] = useState(customers[0]?.id || '');
  const [newOppProduct, setNewOppProduct] = useState(products[0]?.id || '');
  const [newOppValue, setNewOppValue] = useState(0);

  const activeServiceRecords = activeServices.filter((service) => service.status === 'Active');
  const openOpportunities = opportunities.filter((o) => o.status === 'Open');

  // ── Core KPI Aggregates ──
  const totalPipelineValue = openOpportunities.reduce((sum, o) => sum + o.valueGHS, 0);
  const totalMonthlyMRC = activeServiceRecords.reduce((sum, s) => sum + (s.mrcGHS || 0), 0);
  const wonOpportunities = opportunities.filter((o) => o.stage === 'Won');
  const wonRevenueTotal = wonOpportunities.reduce((sum, o) => sum + o.valueGHS, 0);

  // ── Pipeline (count + value per stage) ──
  const pipelineData = opportunityStages.map((stage) => {
    const stageOpportunities = opportunities.filter((opportunity) => opportunity.stage === stage);
    return {
      stage,
      count: stageOpportunities.length,
      value: stageOpportunities.reduce((total, opportunity) => total + opportunity.valueGHS, 0),
    };
  });

  // ── Active Services Donut ──
  const categoryData = (['Converged', 'Fixed', 'Mobile', 'Digital'] as ProductCategory[])
    .map((category) => ({
      name: category,
      value: activeServiceRecords.filter((service) => service.category === category).length,
      color: serviceCategoryColors[category],
    }))
    .filter((category) => category.value > 0);

  // ── Top 5 Customers by Contract Value ──
  const top5CustomersData = [...customers]
    .sort((a, b) => (b.totalValueGHS || 0) - (a.totalValueGHS || 0))
    .slice(0, 5)
    .map((cust, idx) => ({
      rank: idx + 1,
      name: cust.name,
      value: cust.totalValueGHS || 0,
      segment: cust.segment,
      id: cust.id,
    }))
    .filter((c) => c.value > 0 || customers.length <= 5);

  // ── Due-Soon / Workload Widget ──
  const pendingApprovalList = approvals
    .filter((a) => a.status === 'Pending')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, 5);

  const now = new Date();
  const in30Days = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const oppsClosingSoon = openOpportunities
    .filter((o) => {
      const d = new Date(o.expectedCloseDate);
      return !isNaN(d.getTime()) && d <= in30Days;
    })
    .sort((a, b) => new Date(a.expectedCloseDate).getTime() - new Date(b.expectedCloseDate).getTime())
    .slice(0, 5);

  const openTasks = tasks
    .filter((t) => t.status !== 'Completed')
    .sort((a, b) => {
      const da = new Date(a.dueDate).getTime();
      const db = new Date(b.dueDate).getTime();
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return da - db;
    })
    .slice(0, 5);

  // ── Greeting & Contextual Date ──
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Filtered customer list for dashboard
  const filteredCustomers = customers.filter((cust) => {
    if (customerSegmentFilter !== 'ALL' && cust.segment !== customerSegmentFilter) {
      return false;
    }
    if (!customerSearchQuery.trim()) return true;
    const query = customerSearchQuery.toLowerCase();
    return (
      cust.name.toLowerCase().includes(query) ||
      (cust.tradingName && cust.tradingName.toLowerCase().includes(query)) ||
      cust.industry.toLowerCase().includes(query) ||
      cust.primaryContact?.name.toLowerCase().includes(query) ||
      cust.primaryContact?.email.toLowerCase().includes(query) ||
      (cust.location && cust.location.toLowerCase().includes(query))
    );
  });

  const displayedCustomers = showAllCustomers ? filteredCustomers : filteredCustomers.slice(0, 6);

  const selectedOppCustomer = customers.find((customer) => customer.id === newOppCustomer);
  const selectedOppProduct = products.find((product) => product.id === newOppProduct);

  const resetAddForm = () => {
    setAddCustName('');
    setAddCustTradingName('');
    setAddCustSegment('Large Enterprise');
    setAddCustIndustry('Banking & Financial Services');
    setAddCustStatus('Active');
    setAddCustCreditRating('AA');
    setAddCustEstablishedYear(new Date().getFullYear());
    setAddCustLocation('Airport City, Accra');
    setAddCustGhanaPostGps('GA-100-2026');
    setAddCustRegNumber('');
    setAddCustTin('');
    setAddCustWebsite('');
    setAddCustEmail('');
    setAddCustPhone('');
    setAddCustContactName('');
    setAddCustContactRole('Chief Technology Officer');
    setAddCustContactEmail('');
    setAddCustContactPhone('');
  };

  // Open Edit Customer Modal with pre-filled manual inputs
  const handleOpenEdit = (e: React.MouseEvent, cust: Customer) => {
    e.stopPropagation();
    setActiveCust(cust);
    setEditCustName(cust.name);
    setEditCustTradingName(cust.tradingName || '');
    setEditCustSegment(cust.segment);
    setEditCustIndustry(cust.industry);
    setEditCustStatus(cust.status);
    setEditCustCreditRating(cust.creditRating || 'AA');
    setEditCustEstablishedYear(cust.establishedYear || new Date().getFullYear());
    setEditCustLocation(cust.location || '');
    setEditCustGhanaPostGps(cust.ghanaPostGps || '');
    setEditCustRegNumber(cust.registrationNumber || '');
    setEditCustTin(cust.tin || '');
    setEditCustWebsite(cust.website || '');
    setEditCustEmail(cust.email || '');
    setEditCustPhone(cust.phone || '');
    setEditCustContactName(cust.primaryContact?.name || '');
    setEditCustContactRole(cust.primaryContact?.role || '');
    setEditCustContactEmail(cust.primaryContact?.email || '');
    setEditCustContactPhone(cust.primaryContact?.phone || '');
    setIsEditCustomerOpen(true);
    setIsViewCustomerOpen(false);
  };

  // Open View Customer Modal
  const handleOpenView = (e: React.MouseEvent, cust: Customer) => {
    e.stopPropagation();
    setActiveCust(cust);
    setIsViewCustomerOpen(true);
  };

  // Open Delete Customer Modal
  const handleOpenDelete = (e: React.MouseEvent, cust: Customer) => {
    e.stopPropagation();
    setActiveCust(cust);
    setIsDeleteCustomerOpen(true);
  };

  // Handle Add Customer (Manual Entry)
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCustName.trim()) {
      showToast('error', 'Validation Error', 'Company legal name is required.');
      return;
    }

    const newCust = addCustomer({
      name: addCustName.trim(),
      tradingName: addCustTradingName.trim() || undefined,
      segment: addCustSegment,
      industry: addCustIndustry,
      accountManager: currentUser?.name ?? 'Kwame Mensah',
      accountManagerEmail: currentUser?.email ?? 'kwame.mensah@mtn.com.gh',
      status: addCustStatus,
      creditRating: addCustCreditRating,
      establishedYear: Number(addCustEstablishedYear) || new Date().getFullYear(),
      location: addCustLocation.trim() || 'Accra, Ghana',
      ghanaPostGps: addCustGhanaPostGps.trim() || 'GA-000-0000',
      registrationNumber: addCustRegNumber.trim() || `CS${Math.floor(100000000 + Math.random() * 900000000)}`,
      tin: addCustTin.trim() || `C${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      website: addCustWebsite.trim() || `https://www.${addCustName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.gh`,
      email: addCustEmail.trim() || addCustContactEmail.trim() || 'info@enterprise.com.gh',
      phone: addCustPhone.trim() || addCustContactPhone.trim() || '+233 30 200 0000',
      primaryContact: {
        id: `CONT-${Date.now()}`,
        customerId: '',
        name: addCustContactName.trim() || 'Primary Contact',
        role: addCustContactRole.trim() || 'Executive Lead',
        email: addCustContactEmail.trim() || 'contact@enterprise.com.gh',
        phone: addCustContactPhone.trim() || '+233 24 000 0000',
        isPrimary: true,
      },
    });

    showToast('success', 'Customer Registered', `${newCust.name} added to enterprise repository.`);
    setIsAddCustomerOpen(false);
    resetAddForm();
  };

  // Handle Save Edit Customer
  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCust) return;
    if (!editCustName.trim()) {
      showToast('error', 'Validation Error', 'Company legal name is required.');
      return;
    }

    updateCustomer(activeCust.id, {
      name: editCustName.trim(),
      tradingName: editCustTradingName.trim() || undefined,
      segment: editCustSegment,
      industry: editCustIndustry,
      status: editCustStatus,
      creditRating: editCustCreditRating,
      establishedYear: Number(editCustEstablishedYear) || activeCust.establishedYear,
      location: editCustLocation.trim(),
      ghanaPostGps: editCustGhanaPostGps.trim(),
      registrationNumber: editCustRegNumber.trim(),
      tin: editCustTin.trim(),
      website: editCustWebsite.trim(),
      email: editCustEmail.trim() || activeCust.email,
      phone: editCustPhone.trim() || activeCust.phone,
      primaryContact: {
        ...activeCust.primaryContact,
        name: editCustContactName.trim() || activeCust.primaryContact.name,
        role: editCustContactRole.trim() || activeCust.primaryContact.role,
        email: editCustContactEmail.trim() || activeCust.primaryContact.email,
        phone: editCustContactPhone.trim() || activeCust.primaryContact.phone,
      },
    });

    showToast('success', 'Customer Updated', `${editCustName} updated successfully.`);
    setIsEditCustomerOpen(false);
  };

  // Handle Confirm Delete Customer
  const handleConfirmDelete = () => {
    if (!activeCust) return;
    const nameToDelete = activeCust.name;
    deleteCustomer(activeCust.id);
    showToast('info', 'Customer Deleted', `${nameToDelete} removed from enterprise repository.`);
    setIsDeleteCustomerOpen(false);
    setIsViewCustomerOpen(false);
    setActiveCust(null);
  };

  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOppTitle.trim() || !selectedOppCustomer || !selectedOppProduct) return;

    const expectedCloseDate = new Date();
    expectedCloseDate.setDate(expectedCloseDate.getDate() + 45);

    addOpportunity({
      title: newOppTitle,
      customerId: selectedOppCustomer.id,
      customerName: selectedOppCustomer.name,
      productId: selectedOppProduct.id,
      productName: selectedOppProduct.name,
      category: selectedOppProduct.category,
      stage: 'New',
      valueGHS: Number(newOppValue) || 25000,
      mrcGHS: Math.round((Number(newOppValue) || 25000) / 12),
      owner: currentUser?.name ?? '',
      expectedCloseDate: expectedCloseDate.toISOString().split('T')[0],
      priority: 'High',
      probability: 50,
      status: 'Open',
      presalesRequired: true,
      description: `New enterprise solution inquiry for ${selectedOppProduct.name}.`,
    });

    showToast('success', 'Opportunity Created', `Opportunity created for ${selectedOppCustomer.name}.`);
    setIsAddOpportunityOpen(false);
    setNewOppTitle('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Welcome & Page Header ── */}
      <header className="space-y-5 border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-mtn-yellow via-amber-300 to-amber-500 text-slate-950 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-xs">
                <CalendarDays className="h-3 w-3 text-amber-700" />
                {todayLabel}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 font-heading tracking-tight">
                {greeting}, {currentUser?.name?.split(' ')[0] || 'Team'}
                <span className="text-mtn-yellow">.</span>
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Here is your enterprise operations overview — pipeline, services, customers, and work items.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-mtn-yellow px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-mtn-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              Add Customer
            </button>
            <button
              onClick={() => setIsAddOpportunityOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mtn-yellow focus-visible:ring-offset-2"
            >
              <BriefcaseBusiness className="h-4 w-4 text-slate-600" />
              Create Opportunity
            </button>
          </div>
        </div>
      </header>

      {/* ── KPI Stat Cards (6 with trend indicators) ── */}
      <section aria-label="Key operational metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Customers"
          value={customers.length}
          description="Managed accounts"
          icon={Users}
          trend={{ value: customers.length > 10 ? '6.7%' : '1.2%', isPositive: true }}
          onClick={() => navigate('/customers')}
        />
        <StatCard
          title="Active Services"
          value={activeServiceRecords.length}
          description="Live contracted services"
          icon={Activity}
          trend={{ value: activeServiceRecords.length > 4 ? '4.1%' : '0.8%', isPositive: true }}
          onClick={() => navigate('/active-services')}
        />
        <StatCard
          title="Open Opportunities"
          value={openOpportunities.length}
          description="Currently in pipeline"
          icon={BriefcaseBusiness}
          trend={{ value: openOpportunities.length > 5 ? '9.3%' : '2.4%', isPositive: true }}
          onClick={() => navigate('/opportunities')}
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrencyGHS(totalPipelineValue)}
          description="Total open opportunity value"
          icon={TrendingUp}
          trend={{ value: totalPipelineValue > 100000 ? '12.4%' : '3.1%', isPositive: true }}
          onClick={() => navigate('/opportunities')}
        />
        <StatCard
          title="Monthly Recurring"
          value={formatCurrencyGHS(totalMonthlyMRC)}
          description="Active services MRC"
          icon={DollarSign}
          trend={{ value: totalMonthlyMRC > 20000 ? '5.2%' : '1.7%', isPositive: true }}
          onClick={() => navigate('/billing-revenue')}
        />
        <StatCard
          title="Pending Approvals"
          value={approvals.filter((approval) => approval.status === 'Pending').length}
          description="Awaiting a governance decision"
          icon={ShieldCheck}
          trend={{ value: approvals.filter(a => a.status === 'Pending').length > 2 ? '2 items' : 'On track', isPositive: approvals.filter(a => a.status === 'Pending').length <= 2 }}
          onClick={() => navigate('/approvals')}
        />
      </section>

      {/* Operational Analytics */}
      <section aria-label="Operational analytics" className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">Opportunity Pipeline</h2>
              <p className="mt-1 text-xs text-slate-500">Opportunity count and value by stage</p>
            </div>
            <button
              onClick={() => navigate('/opportunities')}
              className="inline-flex shrink-0 items-center gap-1 rounded px-1 py-1 text-xs font-semibold text-slate-700 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mtn-yellow"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── Pipeline Health Strip (mini stats) ── */}
          {opportunities.length > 0 && (
            <div className="mb-2 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 border border-slate-100 p-2.5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Open Pipeline</p>
                <p className="mt-0.5 text-xs font-bold text-slate-900">{formatCurrencyGHS(totalPipelineValue)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Won Revenue</p>
                <p className="mt-0.5 text-xs font-bold text-emerald-700">{formatCurrencyGHS(wonRevenueTotal)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Win Rate</p>
                <p className="mt-0.5 text-xs font-bold text-amber-800">
                  {opportunities.length > 0
                    ? Math.round((wonOpportunities.length / opportunities.length) * 100)
                    : 0}%
                  <span className="ml-1 font-normal text-slate-500">
                    ({wonOpportunities.length}/{opportunities.length})
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="h-64 w-full pt-2 sm:h-72">
            {opportunities.length === 0 ? (
              <EmptyState
                title="No opportunities yet"
                description="Create an opportunity to see its stage and value in the pipeline."
                icon={BriefcaseBusiness}
                actionLabel="Open opportunities"
                onAction={() => navigate('/opportunities')}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 8, right: 8, left: -18, bottom: 12 }}>
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    cursor={{ fill: '#FEF3C7', opacity: 0.35 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-white shadow-lg">
                          <p className="font-bold text-mtn-yellow">{data.stage}</p>
                          <p className="mt-1">Opportunities: <strong>{data.count}</strong></p>
                          <p>Combined value: <strong>{formatCurrencyGHS(data.value)}</strong></p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" name="Opportunities" fill="#1E293B" radius={[4, 4, 0, 0]}>
                    {pipelineData.map((entry) => (
                      <Cell key={entry.stage} fill={entry.stage === 'Won' ? '#059669' : entry.stage === 'Lost' ? '#64748B' : '#1E293B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">Active Services</h2>
              <p className="mt-1 text-xs text-slate-500">Breakdown by category</p>
            </div>
            <button
              onClick={() => navigate('/active-services')}
              className="inline-flex shrink-0 items-center gap-1 rounded px-1 py-1 text-xs font-semibold text-slate-700 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mtn-yellow"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex min-h-[13rem] flex-1 flex-col justify-center">
            {activeServiceRecords.length === 0 ? (
              <EmptyState
                title="No active services"
                description="Active services will appear here once they are provisioned."
                icon={Package}
                actionLabel="View services"
                onAction={() => navigate('/active-services')}
              />
            ) : (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                        {categoryData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          const percentage = Math.round((data.value / activeServiceRecords.length) * 100);
                          return (
                            <div className="rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-white shadow-lg">
                              <p className="font-bold text-mtn-yellow">{data.name}</p>
                              <p>{data.value} services ({percentage}%)</p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs">
                  {categoryData.map((category) => (
                    <div key={category.name} className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: category.color }} />
                      <span className="truncate text-slate-600">{category.name}</span>
                      <span className="ml-auto font-semibold text-slate-900">{category.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Top Customers Leaderboard + Due-Soon Workload ── */}
      <section aria-label="Top customers and upcoming work items" className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Top 5 Customers by Contract Value (horizontal bar) */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-heading">Top Customers by Contract Value</h2>
                <p className="mt-0.5 text-xs text-slate-500">Ranked by total annual contract value (GHS)</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/customers')}
              className="inline-flex shrink-0 items-center gap-1 rounded px-1 py-1 text-xs font-semibold text-slate-700 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mtn-yellow"
            >
              Directory <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {top5CustomersData.length === 0 ||
          top5CustomersData.every((c) => c.value === 0 && customers.length === 0) ? (
            <EmptyState
              title="No customer value data yet"
              description="As contracts are recorded, top customers by value will appear here."
              icon={Award}
              actionLabel="Add a customer"
              onAction={() => setIsAddCustomerOpen(true)}
            />
          ) : (
            <>
              {top5CustomersData.length > 0 && top5CustomersData[0].value > 0 ? (
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={top5CustomersData}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={true} vertical={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        tickFormatter={(v) => `GH₵${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#334155' }}
                        width={140}
                        tickFormatter={(name) =>
                          name.length > 20 ? name.slice(0, 17) + '…' : name
                        }
                      />
                      <Tooltip
                        cursor={{ fill: '#FEF3C7', opacity: 0.35 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-white shadow-lg">
                              <p className="font-bold text-mtn-yellow">#{data.rank} • {data.name}</p>
                              <p className="mt-1">Segment: <strong>{data.segment}</strong></p>
                              <p>Contract value: <strong>{formatCurrencyGHS(data.value)}</strong></p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="value" name="Contract Value (GHS)" radius={[0, 6, 6, 0]} barSize={22}>
                        {top5CustomersData.map((entry, idx) => (
                          <Cell
                            key={entry.id || idx}
                            fill={idx === 0 ? '#FFCC00' : idx === 1 ? '#F59E0B' : idx === 2 ? '#D97706' : '#94A3B8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-xs text-slate-500">
                  <Award className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="font-semibold text-slate-700">Top customer rankings will appear here</p>
                  <p className="mt-1">Assign contract values on customer records to populate the leaderboard.</p>
                </div>
              )}

              {top5CustomersData.length > 0 && (
                <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-3">
                  {top5CustomersData
                    .filter((c) => c.value > 0 || customers.length <= 5)
                    .slice(0, 3)
                    .map((cust) => (
                      <button
                        key={cust.id}
                        onClick={() => navigate(`/customers/${cust.id}`)}
                        className="group flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-amber-50/50"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              cust.rank === 1
                                ? 'bg-amber-100 text-amber-800'
                                : cust.rank === 2
                                ? 'bg-slate-200 text-slate-700'
                                : cust.rank === 3
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {cust.rank}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-amber-800">
                              {cust.name}
                            </p>
                            <p className="truncate text-[10px] text-slate-500">{cust.segment}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            {formatCurrencyGHS(cust.value)}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-amber-700" />
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Due-Soon Workload Widget */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-mtn-yellow">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-heading">Workload & Due-Soon</h2>
                <p className="mt-0.5 text-xs text-slate-500">Approvals, tasks, and forecasted closes</p>
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5 text-amber-700" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Pending Approvals</p>
              </div>
              <button
                onClick={() => navigate('/approvals')}
                className="text-[11px] font-semibold text-amber-700 hover:text-amber-800"
              >
                {pendingApprovalList.length} items
              </button>
            </div>
            {pendingApprovalList.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                No approvals pending — all caught up ✓
              </p>
            ) : (
              <ul className="space-y-1.5">
                {pendingApprovalList.map((app) => (
                  <li
                    key={app.id}
                    onClick={() => navigate('/approvals')}
                    className="group flex cursor-pointer items-start justify-between gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2 transition-colors hover:border-amber-200 hover:bg-amber-50/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-amber-800">
                        {app.customerName}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">{app.currentStage}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold text-slate-900">
                        {formatCurrencyGHS(app.totalValueGHS)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Opportunities Closing Soon */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Rocket className="h-3.5 w-3.5 text-emerald-700" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Closing This Month</p>
              </div>
              <button
                onClick={() => navigate('/opportunities')}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {oppsClosingSoon.length} opps
              </button>
            </div>
            {oppsClosingSoon.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                No opportunities forecasted to close within 30 days.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {oppsClosingSoon.map((opp) => (
                  <li
                    key={opp.id}
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                    className="group flex cursor-pointer items-start justify-between gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-emerald-800">
                        {opp.title}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">{opp.customerName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold text-slate-900">
                        {formatCurrencyGHS(opp.valueGHS)}
                      </p>
                      <p className="text-[9px] text-slate-500">{formatDate(opp.expectedCloseDate)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Open Tasks */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ListTodo className="h-3.5 w-3.5 text-blue-700" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Open Tasks</p>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-[11px] font-semibold text-blue-700 hover:text-blue-800"
              >
                {openTasks.length} items
              </button>
            </div>
            {openTasks.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                Your task list is clear — enjoy the headspace 🎯
              </p>
            ) : (
              <ul className="space-y-1.5">
                {openTasks.map((task) => {
                  const prio = getPriorityColor(task.priority);
                  return (
                    <li
                      key={task.id}
                      onClick={() => navigate('/tasks')}
                      className="group flex cursor-pointer items-start justify-between gap-2 rounded-lg border border-slate-100 bg-white px-2.5 py-2 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${prio.bg.replace(
                              '-100',
                              '-500'
                            )}`}
                          />
                          <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-blue-800">
                            {task.title}
                          </p>
                        </div>
                        <p className="truncate text-[10px] text-slate-500 ml-3">
                          {task.assignedTo}
                          {task.assignedToEmail ? ` · ${task.assignedToEmail}` : ''}
                          {task.customerName ? ` • ${task.customerName}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-[10px] font-semibold ${prio.text}`}>{task.priority}</p>
                        <p className="text-[9px] text-slate-500">{formatDate(task.dueDate)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* CUSTOMER REPOSITORY & OPERATIONAL UPDATES */}
      <section aria-label="Customer repository and notification activity" className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Customer Management Card (Spans 2 columns on desktop) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          {/* Header */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-heading">Enterprise Customers</h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  {customers.length} Accounts
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Manual registration, preview, quick edit & delete operations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-mtn-yellow px-3 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-mtn-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Add Customer
              </button>
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mtn-yellow"
              >
                All Directory <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder="Search by company name, contact person, industry..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mtn-yellow/40 transition-colors"
              />
              {customerSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCustomerSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={customerSegmentFilter}
                onChange={(e) => setCustomerSegmentFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/40"
              >
                <option value="ALL">All Segments</option>
                {segmentOptions.map((seg) => (
                  <option key={seg} value={seg}>{seg}</option>
                ))}
              </select>

              {filteredCustomers.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllCustomers(!showAllCustomers)}
                  className="shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2 px-1"
                >
                  {showAllCustomers ? 'Show less (6)' : `Show all (${filteredCustomers.length})`}
                </button>
              )}
            </div>
          </div>

          {/* Customers Table / Empty State */}
          {customers.length === 0 ? (
            <EmptyState
              title="No enterprise customers"
              description="Register your first corporate customer to start managing accounts."
              icon={Users}
              actionLabel="Add Customer"
              onAction={() => setIsAddCustomerOpen(true)}
            />
          ) : displayedCustomers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-800">No matching customers found</p>
              <p className="mt-1 text-xs text-slate-500">Try adjusting your search query or segment filter</p>
              <button
                type="button"
                onClick={() => {
                  setCustomerSearchQuery('');
                  setCustomerSegmentFilter('ALL');
                }}
                className="mt-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2.5 px-2">Customer & Vertical</th>
                    <th className="py-2.5 px-2 hidden sm:table-cell">Segment</th>
                    <th className="py-2.5 px-2">Primary Contact</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                      onClick={(e) => handleOpenView(e, cust)}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-900 border border-amber-200/50 flex items-center justify-center font-bold text-xs shrink-0">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate max-w-[150px] sm:max-w-[200px]">
                              {cust.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">
                              {cust.tradingName ? `${cust.tradingName} • ` : ''}{cust.industry}
                            </span>
                            {(cust.totalValueGHS || cust.activeServicesCount) && (
                              <div className="mt-1 flex items-center gap-2">
                                {cust.totalValueGHS > 0 && (
                                  <span className="inline-flex items-center gap-1 rounded bg-slate-900/5 px-1.5 py-[1px] text-[9px] font-bold text-slate-700">
                                    <DollarSign className="h-2.5 w-2.5 text-amber-700" />
                                    {formatCurrencyGHS(cust.totalValueGHS)}
                                  </span>
                                )}
                                {cust.activeServicesCount > 0 && (
                                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-[1px] text-[9px] font-semibold text-emerald-700">
                                    <Activity className="h-2.5 w-2.5" />
                                    {cust.activeServicesCount} svc
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                          {cust.segment}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 block truncate max-w-[120px]">
                            {cust.primaryContact?.name || 'No contact'}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                            {cust.primaryContact?.phone || cust.primaryContact?.email || ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={cust.status} size="sm" />
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleOpenView(e, cust)}
                            title="View Customer Profile"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-950 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(e, cust)}
                            title="Edit Customer Details"
                            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-100/70 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenDelete(e, cust)}
                            title="Delete Customer"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notifications Card (1 column on desktop) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
          <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">Notifications</h2>
              <p className="mt-1 text-xs text-slate-500">Latest operational updates</p>
            </div>
            <button
              onClick={() => navigate('/notifications')}
              className="inline-flex shrink-0 items-center gap-1 rounded px-1 py-1 text-xs font-semibold text-slate-700 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mtn-yellow"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <EmptyState
              title="No notifications"
              description="Operational updates will appear here as activity is recorded."
              icon={Clock}
              actionLabel="View notifications"
              onAction={() => navigate('/notifications')}
            />
          ) : (
            <div className="space-y-1">
              {notifications.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-50"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                      act.read
                        ? 'border-slate-200 bg-slate-50 text-slate-500'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-slate-900">{act.title}</p>
                      <span className="shrink-0 text-[10px] text-slate-500">{act.timestamp}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{act.message}</p>
                  </div>
                  {act.link && (
                    <button
                      type="button"
                      onClick={() => navigate(act.link!)}
                      aria-label={`Open notification: ${act.title}`}
                      className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mtn-yellow"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 1. ADD CUSTOMER MODAL (FULL MANUAL INPUT) */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAddCustomerOpen}
        onClose={() => {
          setIsAddCustomerOpen(false);
          resetAddForm();
        }}
        title="Add Enterprise Customer (Manual Input)"
        subtitle="Manually enter enterprise profile, key contacts, and location data"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-5">
          {/* Section 1: Company Profile */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Company Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Company Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={addCustName}
                  onChange={(e) => setAddCustName(e.target.value)}
                  placeholder="e.g. Standard Chartered Bank Ghana PLC"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Trading Name / Brand
                </label>
                <input
                  type="text"
                  value={addCustTradingName}
                  onChange={(e) => setAddCustTradingName(e.target.value)}
                  placeholder="e.g. StanChart Ghana"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Segment *
                </label>
                <select
                  value={addCustSegment}
                  onChange={(e) => setAddCustSegment(e.target.value as CustomerSegment)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  {segmentOptions.map((seg) => (
                    <option key={seg} value={seg}>{seg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Industry Vertical *
                </label>
                <select
                  value={addCustIndustry}
                  onChange={(e) => setAddCustIndustry(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  {industryOptions.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Operational Status *
                </label>
                <select
                  value={addCustStatus}
                  onChange={(e) => setAddCustStatus(e.target.value as CustomerStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Credit Rating
                </label>
                <select
                  value={addCustCreditRating}
                  onChange={(e) => setAddCustCreditRating(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  {creditRatingOptions.map((cr) => (
                    <option key={cr} value={cr}>{cr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Year Established
                </label>
                <input
                  type="number"
                  value={addCustEstablishedYear}
                  onChange={(e) => setAddCustEstablishedYear(Number(e.target.value))}
                  placeholder="e.g. 1996"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Primary Contact Person */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <Users className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Primary Contact Person
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addCustContactName}
                  onChange={(e) => setAddCustContactName(e.target.value)}
                  placeholder="e.g. Dr. Kwame Mensah"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Job Title / Role *
                </label>
                <input
                  type="text"
                  required
                  value={addCustContactRole}
                  onChange={(e) => setAddCustContactRole(e.target.value)}
                  placeholder="e.g. Chief Technology Officer"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Business Email *
                </label>
                <input
                  type="email"
                  required
                  value={addCustContactEmail}
                  onChange={(e) => setAddCustContactEmail(e.target.value)}
                  placeholder="kwame.mensah@enterprise.com.gh"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Direct Phone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={addCustContactPhone}
                  onChange={(e) => setAddCustContactPhone(e.target.value)}
                  placeholder="+233 24 411 9900"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Location & Corporate Info */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Location & Compliance Verification
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Physical Office Location
                </label>
                <input
                  type="text"
                  value={addCustLocation}
                  onChange={(e) => setAddCustLocation(e.target.value)}
                  placeholder="Airport City, Octagon Tower, Accra"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  GhanaPost GPS Digital Address
                </label>
                <input
                  type="text"
                  value={addCustGhanaPostGps}
                  onChange={(e) => setAddCustGhanaPostGps(e.target.value)}
                  placeholder="GA-100-2026"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Registration No. (RGD)
                </label>
                <input
                  type="text"
                  value={addCustRegNumber}
                  onChange={(e) => setAddCustRegNumber(e.target.value)}
                  placeholder="CS123452026"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  TIN (Tax ID Number)
                </label>
                <input
                  type="text"
                  value={addCustTin}
                  onChange={(e) => setAddCustTin(e.target.value)}
                  placeholder="C0012345678"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Corporate Website
                </label>
                <input
                  type="text"
                  value={addCustWebsite}
                  onChange={(e) => setAddCustWebsite(e.target.value)}
                  placeholder="https://www.sc.com/gh"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddCustomerOpen(false);
                resetAddForm();
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 2. EDIT CUSTOMER MODAL (FULL MANUAL EDIT) */}
      {/* ======================================================== */}
      <Modal
        isOpen={isEditCustomerOpen}
        onClose={() => setIsEditCustomerOpen(false)}
        title={`Edit Customer: ${activeCust?.name || ''}`}
        subtitle="Manually update enterprise record, primary contacts, and location"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveEditCustomer} className="space-y-5">
          {/* Section 1: Company Profile */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Company Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Company Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Trading Name / Brand
                </label>
                <input
                  type="text"
                  value={editCustTradingName}
                  onChange={(e) => setEditCustTradingName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Segment *
                </label>
                <select
                  value={editCustSegment}
                  onChange={(e) => setEditCustSegment(e.target.value as CustomerSegment)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  {segmentOptions.map((seg) => (
                    <option key={seg} value={seg}>{seg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Industry Vertical *
                </label>
                <select
                  value={editCustIndustry}
                  onChange={(e) => setEditCustIndustry(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  {industryOptions.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status *
                </label>
                <select
                  value={editCustStatus}
                  onChange={(e) => setEditCustStatus(e.target.value as CustomerStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Credit Rating
                </label>
                <select
                  value={editCustCreditRating}
                  onChange={(e) => setEditCustCreditRating(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  {creditRatingOptions.map((cr) => (
                    <option key={cr} value={cr}>{cr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Year Established
                </label>
                <input
                  type="number"
                  value={editCustEstablishedYear}
                  onChange={(e) => setEditCustEstablishedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Primary Contact Person */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <Users className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Primary Contact Person
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editCustContactName}
                  onChange={(e) => setEditCustContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Job Title / Role *
                </label>
                <input
                  type="text"
                  required
                  value={editCustContactRole}
                  onChange={(e) => setEditCustContactRole(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Business Email *
                </label>
                <input
                  type="email"
                  required
                  value={editCustContactEmail}
                  onChange={(e) => setEditCustContactEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Direct Phone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={editCustContactPhone}
                  onChange={(e) => setEditCustContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Location & Corporate Info */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Location & Compliance Verification
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Physical Office Location
                </label>
                <input
                  type="text"
                  value={editCustLocation}
                  onChange={(e) => setEditCustLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  GhanaPost GPS Digital Address
                </label>
                <input
                  type="text"
                  value={editCustGhanaPostGps}
                  onChange={(e) => setEditCustGhanaPostGps(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Registration No. (RGD)
                </label>
                <input
                  type="text"
                  value={editCustRegNumber}
                  onChange={(e) => setEditCustRegNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  TIN (Tax ID Number)
                </label>
                <input
                  type="text"
                  value={editCustTin}
                  onChange={(e) => setEditCustTin(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Corporate Website
                </label>
                <input
                  type="text"
                  value={editCustWebsite}
                  onChange={(e) => setEditCustWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditCustomerOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 3. VIEW CUSTOMER MODAL (DETAILED PREVIEW) */}
      {/* ======================================================== */}
      <Modal
        isOpen={isViewCustomerOpen}
        onClose={() => setIsViewCustomerOpen(false)}
        title="Customer Profile & Overview"
        subtitle={`Centralized record • ID: ${activeCust?.id || ''}`}
        maxWidth="2xl"
      >
        {activeCust && (
          <div className="space-y-5">
            {/* Header info badge card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-200 flex items-center justify-center font-bold text-base shrink-0">
                  {activeCust.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{activeCust.name}</h3>
                  <p className="text-xs text-slate-500">
                    {activeCust.tradingName ? `Trading as: ${activeCust.tradingName} • ` : ''}
                    {activeCust.industry}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={activeCust.status} size="md" />
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700">
                  Rating: {activeCust.creditRating || 'AA'}
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Segment</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{activeCust.segment}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Active Services</p>
                <p className="text-xs font-bold text-emerald-700 mt-0.5">
                  {activeCust.activeServicesCount || 0} Subscriptions
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Contract Value</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {formatCurrencyGHS(activeCust.totalValueGHS || 0)}
                </p>
              </div>
            </div>

            {/* Details Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Contact Person */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold uppercase text-slate-800">Primary Contact Person</h4>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-slate-900 text-sm">
                    {activeCust.primaryContact?.name || 'No contact assigned'}
                  </p>
                  <p className="text-slate-500 font-medium">
                    {activeCust.primaryContact?.role || 'Commercial Contact'}
                  </p>
                  {activeCust.primaryContact?.phone && (
                    <a
                      href={`tel:${activeCust.primaryContact.phone}`}
                      className="flex items-center gap-1.5 text-slate-700 hover:text-amber-800 transition-colors pt-1"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      <span>{activeCust.primaryContact.phone}</span>
                    </a>
                  )}
                  {activeCust.primaryContact?.email && (
                    <a
                      href={`mailto:${activeCust.primaryContact.email}`}
                      className="flex items-center gap-1.5 text-blue-600 hover:underline pt-0.5"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>{activeCust.primaryContact.email}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Location & Compliance */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold uppercase text-slate-800">Location & Compliance</h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Physical Address</span>
                    <span className="text-slate-800 font-medium">{activeCust.location || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">GhanaPost GPS</span>
                    <span className="font-mono font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200/80 inline-block text-[11px] mt-0.5">
                      {activeCust.ghanaPostGps || 'GA-000-0000'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium">TIN:</span>{' '}
                      <span className="font-semibold text-slate-800">{activeCust.tin || 'N/A'}</span>
                    </div>
                    {activeCust.website && (
                      <a
                        href={activeCust.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-amber-700 hover:underline font-semibold"
                      >
                        <Globe className="w-3 h-3" /> Website <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={(e) => {
                  setIsViewCustomerOpen(false);
                  handleOpenDelete(e, activeCust);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Customer
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    setIsViewCustomerOpen(false);
                    handleOpenEdit(e, activeCust);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Record
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsViewCustomerOpen(false);
                    navigate(`/customers/${activeCust.id}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl transition-colors shadow-sm"
                >
                  Full Profile <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* 4. DELETE CUSTOMER CONFIRMATION MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={isDeleteCustomerOpen}
        onClose={() => setIsDeleteCustomerOpen(false)}
        title="Confirm Customer Deletion"
        subtitle="This action permanently removes the record from repository"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-rose-950">
              Delete "{activeCust?.name}"?
            </h4>
            <p className="mt-1 text-xs text-rose-700">
              Customer ID: <strong>{activeCust?.id}</strong>
            </p>
            <p className="mt-2 text-xs text-slate-600">
              This will remove the customer company profile, primary contacts, and associated links from the enterprise hub.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteCustomerOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Yes, Delete Customer
            </button>
          </div>
        </div>
      </Modal>

      {/* ======================================================== */}
      {/* 5. ADD OPPORTUNITY MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={isAddOpportunityOpen}
        onClose={() => setIsAddOpportunityOpen(false)}
        title="Create Enterprise Opportunity"
        subtitle="Initiate a pipeline opportunity in the enterprise workflow"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateOpportunity} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Opportunity Title *</label>
            <input
              type="text"
              required
              value={newOppTitle}
              onChange={(e) => setNewOppTitle(e.target.value)}
              placeholder="e.g. Apex Bank — National SD-WAN Interconnect"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Customer *</label>
              <select
                value={newOppCustomer}
                onChange={(e) => setNewOppCustomer(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="" disabled>Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Solution *</label>
              <select
                value={newOppProduct}
                onChange={(e) => setNewOppProduct(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="" disabled>Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(!customers.length || !products.length) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950" role="status">
              <p className="font-semibold">{!customers.length && !products.length ? 'A customer and product are required.' : !customers.length ? 'A customer is required.' : 'A product is required.'}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {!customers.length && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddOpportunityOpen(false);
                      setIsAddCustomerOpen(true);
                    }}
                    className="font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                  >
                    Add a customer
                  </button>
                )}
                {!products.length && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddOpportunityOpen(false);
                      navigate('/products');
                    }}
                    className="font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                  >
                    Open product catalogue
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Projected Value (GHS) *</label>
            <input
              type="number"
              required
              min={1000}
              step={5000}
              value={newOppValue}
              onChange={(e) => setNewOppValue(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpportunityOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedOppCustomer || !selectedOppProduct}
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create Opportunity
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
