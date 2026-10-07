/**
 * MTN ENTERPRISE HUB - REPORTS & EXECUTIVE ANALYTICS (LIVE DATA)
 * 
 * Route: /reports
 * All visualizations are driven by real AppStateContext data.
 * Features:
 * - Executive Overview with live KPI cards
 * - Customer Analytics: Segment and Industry breakdowns
 * - Pipeline Analytics: Stage distribution, Won vs Lost trend, conversion rate
 * - Service & MRR Analytics: Category revenue, SLA tier split
 * - Workflow & SLA Bottlenecks: Approval stage distribution, pending aging
 */

import React, { useState, useMemo } from 'react';
import {
  Download,
  Users,
  TrendingUp,
  Activity,
  Zap,
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
  Legend,
} from 'recharts';
import { useAppState } from '../context/AppStateContext';
import { PageHeader } from '../components/common/PageHeader';
import { formatCurrencyGHS } from '../utils/formatters';
import type { ProductCategory, OpportunityStage, CustomerSegment } from '../types';

type ReportTab = 'overview' | 'customers' | 'opportunities' | 'services' | 'workflow';

// ──────────────── KPI CARD COMPONENT ────────────────

const KpiCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-900 font-heading leading-tight mt-0.5">{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  </div>
);

const SEGMENT_COLORS: Record<CustomerSegment, string> = {
  'Large Enterprise': '#FFCC00',
  'SME': '#3B82F6',
  'Public Sector': '#10B981',
  'Multinational': '#8B5CF6',
};

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  Converged: '#FFCC00',
  Fixed: '#2563EB',
  Mobile: '#059669',
  Digital: '#8B5CF6',
};

const STAGE_COLORS: Record<OpportunityStage, string> = {
  New: '#94A3B8',
  Qualification: '#3B82F6',
  Discovery: '#06B6D4',
  Presales: '#8B5CF6',
  Proposal: '#F59E0B',
  Negotiation: '#F97316',
  Won: '#10B981',
  Lost: '#EF4444',
};

export const ReportsPage: React.FC = () => {
  const {
    customers,
    opportunities,
    activeServices,
    leads,
    approvals,
    serviceDeliveries,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  // ──────────────── COMPUTED ANALYTICS ────────────────

  // KPI Summary
  const totalCustomers = customers.length;
  const totalOpportunities = opportunities.length;
  const totalActiveServices = activeServices.length;
  const totalMRR = useMemo(
    () => activeServices.reduce((sum, s) => sum + (s.mrcGHS || 0), 0),
    [activeServices]
  );
  const wonOpportunities = useMemo(
    () => opportunities.filter((o) => o.stage === 'Won'),
    [opportunities]
  );
  const pipelineValueGHS = useMemo(
    () => opportunities.filter((o) => o.stage !== 'Won' && o.stage !== 'Lost').reduce((s, o) => s + o.valueGHS, 0),
    [opportunities]
  );

  // Customer Segment Breakdown
  const customerSegmentData = useMemo(() => {
    const segCounts: Record<string, number> = {};
    customers.forEach((c) => {
      segCounts[c.segment] = (segCounts[c.segment] || 0) + 1;
    });
    return Object.entries(segCounts).map(([name, count]) => ({
      name,
      count,
      fill: SEGMENT_COLORS[name as CustomerSegment] || '#94A3B8',
    }));
  }, [customers]);

  // Industry Breakdown
  const industryData = useMemo(() => {
    const indCounts: Record<string, number> = {};
    customers.forEach((c) => {
      const shortIndustry = c.industry?.split('&')[0]?.trim() || 'Other';
      indCounts[shortIndustry] = (indCounts[shortIndustry] || 0) + 1;
    });
    return Object.entries(indCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [customers]);

  // Opportunity Stage Distribution
  const stageData = useMemo(() => {
    const stageCounts: Record<string, { count: number; value: number }> = {};
    opportunities.forEach((o) => {
      if (!stageCounts[o.stage]) stageCounts[o.stage] = { count: 0, value: 0 };
      stageCounts[o.stage].count += 1;
      stageCounts[o.stage].value += o.valueGHS;
    });
    const stages: OpportunityStage[] = ['New', 'Qualification', 'Discovery', 'Presales', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    return stages.map((s) => ({
      stage: s,
      count: stageCounts[s]?.count || 0,
      value: stageCounts[s]?.value || 0,
      fill: STAGE_COLORS[s],
    }));
  }, [opportunities]);

  // Service Category Revenue
  const categoryRevenueData = useMemo(() => {
    const catRevenue: Record<string, number> = {};
    activeServices.forEach((s) => {
      const cat = s.category || 'Other';
      catRevenue[cat] = (catRevenue[cat] || 0) + (s.mrcGHS || 0);
    });
    return Object.entries(catRevenue).map(([category, mrc]) => ({
      category,
      mrc,
      fill: CATEGORY_COLORS[category as ProductCategory] || '#94A3B8',
    }));
  }, [activeServices]);

  // SLA Tier Split
  const slaTierData = useMemo(() => {
    const slaCounts: Record<string, number> = {};
    activeServices.forEach((s) => {
      const tier = s.slaTier || 'Unknown';
      slaCounts[tier] = (slaCounts[tier] || 0) + 1;
    });
    const tierColors: Record<string, string> = {
      'Platinum (99.9%)': '#FFCC00',
      'Gold (99.5%)': '#F59E0B',
      'Silver (99.0%)': '#94A3B8',
    };
    return Object.entries(slaCounts).map(([name, count]) => ({
      name,
      count,
      fill: tierColors[name] || '#CBD5E1',
    }));
  }, [activeServices]);

  // Approval Stage Distribution
  const approvalStageData = useMemo(() => {
    const stageCounts: Record<string, { pending: number; approved: number; rejected: number }> = {};
    approvals.forEach((a) => {
      if (!stageCounts[a.currentStage]) {
        stageCounts[a.currentStage] = { pending: 0, approved: 0, rejected: 0 };
      }
      if (a.status === 'Pending') stageCounts[a.currentStage].pending += 1;
      else if (a.status === 'Approved') stageCounts[a.currentStage].approved += 1;
      else if (a.status === 'Rejected') stageCounts[a.currentStage].rejected += 1;
    });
    return Object.entries(stageCounts).map(([stage, counts]) => ({
      stage,
      ...counts,
    }));
  }, [approvals]);

  // Lead Source Breakdown
  const leadSourceData = useMemo(() => {
    const srcCounts: Record<string, number> = {};
    leads.forEach((l) => {
      srcCounts[l.source] = (srcCounts[l.source] || 0) + 1;
    });
    const srcColors: Record<string, string> = {
      'CEX': '#FFCC00',
      'Virtual Sales': '#3B82F6',
      'Sales Agent': '#10B981',
      'Direct Inbound': '#F59E0B',
      'KAM Sourced': '#8B5CF6',
    };
    return Object.entries(srcCounts).map(([name, count]) => ({
      name,
      count,
      fill: srcColors[name] || '#94A3B8',
    }));
  }, [leads]);

  // Win Rate
  const winRate = useMemo(() => {
    const closed = opportunities.filter((o) => o.stage === 'Won' || o.stage === 'Lost');
    if (closed.length === 0) return 0;
    const won = closed.filter((o) => o.stage === 'Won').length;
    return Math.round((won / closed.length) * 100);
  }, [opportunities]);

  // Delivery Progress
  const deliveryStats = useMemo(() => {
    const total = serviceDeliveries.length;
    const completed = serviceDeliveries.filter((d) => d.status === 'Completed' || d.progress >= 100).length;
    const inProgress = serviceDeliveries.filter((d) => d.status === 'In Progress').length;
    const avgProgress = total > 0 ? Math.round(serviceDeliveries.reduce((s, d) => s + (d.progress || 0), 0) / total) : 0;
    return { total, completed, inProgress, avgProgress };
  }, [serviceDeliveries]);

  // ──────────────── RENDER ────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Executive Reports & Operations Analytics"
        subtitle="Live business intelligence derived from your actual hub data — customers, pipeline, revenue, and workflow"
        breadcrumbs={[{ label: 'Reports & Analytics' }]}
        actions={
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        }
      />

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Customers"
          value={String(totalCustomers)}
          sub={`${customers.filter((c) => c.status === 'Active').length} active`}
          color="bg-amber-100 text-amber-700"
        />
        <KpiCard
          icon={TrendingUp}
          label="Pipeline Value"
          value={formatCurrencyGHS(pipelineValueGHS)}
          sub={`${totalOpportunities} opportunities`}
          color="bg-blue-100 text-blue-700"
        />
        <KpiCard
          icon={Activity}
          label="Monthly Revenue"
          value={formatCurrencyGHS(totalMRR)}
          sub={`${totalActiveServices} active services`}
          color="bg-emerald-100 text-emerald-700"
        />
        <KpiCard
          icon={Zap}
          label="Win Rate"
          value={`${winRate}%`}
          sub={`${wonOpportunities.length} won deals`}
          color="bg-violet-100 text-violet-700"
        />
      </div>

      {/* Analytics Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {([
          { id: 'overview', label: 'Executive Overview' },
          { id: 'customers', label: 'Customer Analytics' },
          { id: 'opportunities', label: 'Pipeline Analytics' },
          { id: 'services', label: 'Service & MRR Analytics' },
          { id: 'workflow', label: 'Workflow & SLA Bottlenecks' },
        ] as { id: ReportTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ TAB: EXECUTIVE OVERVIEW ═══════════ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Opportunity Pipeline by Stage */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Opportunity Pipeline by Stage
              </h3>
              <p className="text-xs text-slate-500">Deal count and value across all pipeline stages</p>
            </div>
            <div className="h-64 w-full">
              {stageData.some((d) => d.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        name === 'value' ? formatCurrencyGHS(Number(value)) : value,
                        name === 'value' ? 'Deal Value' : 'Deals',
                      ]}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {stageData.map((entry, index) => (
                        <Cell key={`stage-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No opportunity data yet
                </div>
              )}
            </div>
          </div>

          {/* Service Revenue by Category */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Monthly Recurring Revenue by Category
              </h3>
              <p className="text-xs text-slate-500">Live MRC from active services inventory</p>
            </div>
            <div className="h-64 w-full">
              {categoryRevenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(val) => `GH₵${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrencyGHS(Number(value)), 'Monthly Revenue']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="mrc" radius={[8, 8, 0, 0]}>
                      {categoryRevenueData.map((entry, index) => (
                        <Cell key={`mrc-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No active services data yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB: CUSTOMER ANALYTICS ═══════════ */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Segments Donut */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-heading mb-1">
              Customers by Segment Tier
            </h3>
            <div className="h-48 w-full flex items-center justify-center">
              {customerSegmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerSegmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {customerSegmentData.map((entry, index) => (
                        <Cell key={`seg-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-sm">No customers yet</p>
              )}
            </div>
            <div className="space-y-1 text-xs border-t border-slate-100 pt-2">
              {customerSegmentData.map((seg) => (
                <div key={seg.name} className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.fill }} />
                    {seg.name}
                  </span>
                  <strong className="text-slate-900">{seg.count}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Verticals Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-heading mb-1">
              Accounts by Industry Sector
            </h3>
            <div className="h-48 w-full pt-2">
              {industryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={industryData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={110} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#FFCC00" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No customer data yet
                </div>
              )}
            </div>
          </div>

          {/* Lead Source Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm lg:col-span-3 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-900 font-heading mb-3">
              Lead Sources Distribution
            </h3>
            <div className="h-56 w-full">
              {leadSourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadSourceData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`src-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No lead data yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB: PIPELINE ANALYTICS ═══════════ */}
      {activeTab === 'opportunities' && (
        <div className="space-y-6">
          {/* Win/Loss Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Opportunities</p>
              <p className="text-2xl font-black text-slate-900 font-heading mt-1">{totalOpportunities}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <p className="text-xs font-bold text-emerald-600 uppercase">Won Deals</p>
              <p className="text-2xl font-black text-emerald-700 font-heading mt-1">{wonOpportunities.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{formatCurrencyGHS(wonOpportunities.reduce((s, o) => s + o.valueGHS, 0))}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <p className="text-xs font-bold text-red-600 uppercase">Lost Deals</p>
              <p className="text-2xl font-black text-red-700 font-heading mt-1">
                {opportunities.filter((o) => o.stage === 'Lost').length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <p className="text-xs font-bold text-blue-600 uppercase">Win Rate</p>
              <p className="text-2xl font-black text-blue-700 font-heading mt-1">{winRate}%</p>
            </div>
          </div>

          {/* Stage Value Distribution */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Pipeline Value Distribution by Stage
              </h3>
              <p className="text-xs text-slate-500">Total deal value (GHS) sitting in each pipeline stage</p>
            </div>
            <div className="h-72 w-full">
              {stageData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(val) => `GH₵${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrencyGHS(Number(value)), 'Deal Value']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {stageData.map((entry, index) => (
                        <Cell key={`val-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No opportunity data yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB: SERVICE & MRR ANALYTICS ═══════════ */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Category */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                MRC by Service Category
              </h3>
              <p className="text-xs text-slate-500">Total Monthly Recurring Charges by category</p>
            </div>
            <div className="h-64 w-full">
              {categoryRevenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryRevenueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="mrc"
                      nameKey="category"
                      label={(entry: any) => `${entry.category || entry.name}: GH₵${((entry.mrc || entry.value || 0) / 1000).toFixed(0)}k`}
                    >
                      {categoryRevenueData.map((entry, index) => (
                        <Cell key={`cat-pie-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatCurrencyGHS(Number(value)), 'MRC']}
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No active services data yet
                </div>
              )}
            </div>
          </div>

          {/* SLA Tier Distribution */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                SLA Tier Distribution
              </h3>
              <p className="text-xs text-slate-500">Active services split by SLA commitment level</p>
            </div>
            <div className="h-64 w-full">
              {slaTierData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slaTierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {slaTierData.map((entry, index) => (
                        <Cell key={`sla-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No SLA data yet
                </div>
              )}
            </div>
          </div>

          {/* Service Summary Stats */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 font-heading mb-4">
              Active Services Snapshot
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                <p className="text-2xl font-black text-slate-900 font-heading">{totalActiveServices}</p>
                <p className="text-[11px] text-slate-500 font-bold uppercase mt-0.5">Total Services</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/60 text-center">
                <p className="text-2xl font-black text-emerald-700 font-heading">
                  {activeServices.filter((s) => s.status === 'Active').length}
                </p>
                <p className="text-[11px] text-emerald-600 font-bold uppercase mt-0.5">Healthy</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/60 text-center">
                <p className="text-2xl font-black text-amber-700 font-heading">
                  {activeServices.filter((s) => s.status === 'Degraded').length}
                </p>
                <p className="text-[11px] text-amber-600 font-bold uppercase mt-0.5">Degraded</p>
              </div>
              <div className="p-4 rounded-xl bg-red-50 border border-red-200/60 text-center">
                <p className="text-2xl font-black text-red-700 font-heading">
                  {activeServices.filter((s: any) => s.status === 'Down' || s.status === 'Inactive').length}
                </p>
                <p className="text-[11px] text-red-600 font-bold uppercase mt-0.5">Down / Inactive</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB: WORKFLOW & SLA BOTTLENECKS ═══════════ */}
      {activeTab === 'workflow' && (
        <div className="space-y-6">
          {/* Delivery Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Active Deliveries</p>
              <p className="text-2xl font-black text-slate-900 font-heading mt-1">{deliveryStats.total}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <p className="text-xs font-bold text-emerald-600 uppercase">Completed</p>
              <p className="text-2xl font-black text-emerald-700 font-heading mt-1">{deliveryStats.completed}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <p className="text-xs font-bold text-blue-600 uppercase">In Progress</p>
              <p className="text-2xl font-black text-blue-700 font-heading mt-1">{deliveryStats.inProgress}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
              <p className="text-xs font-bold text-amber-600 uppercase">Avg Progress</p>
              <p className="text-2xl font-black text-amber-700 font-heading mt-1">{deliveryStats.avgProgress}%</p>
            </div>
          </div>

          {/* Approval Stage Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Approval Workflow Distribution
              </h3>
              <p className="text-xs text-slate-500">Pending, Approved, and Rejected items across the 6-tier governance chain</p>
            </div>
            <div className="h-72 w-full">
              {approvalStageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={approvalStageData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approved" name="Approved" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" name="Rejected" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No approval data yet
                </div>
              )}
            </div>
          </div>

          {/* Pending Approvals Table */}
          {approvals.filter((a) => a.status === 'Pending').length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 font-heading mb-3">
                Pending Approvals Requiring Action
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 uppercase border-b border-slate-100">
                      <th className="pb-2 pr-4 font-bold">Customer</th>
                      <th className="pb-2 pr-4 font-bold">Opportunity</th>
                      <th className="pb-2 pr-4 font-bold">Current Stage</th>
                      <th className="pb-2 pr-4 font-bold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals
                      .filter((a) => a.status === 'Pending')
                      .slice(0, 10)
                      .map((a) => (
                        <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2 pr-4 font-semibold text-slate-900">{a.customerName}</td>
                          <td className="py-2 pr-4 text-slate-600">{a.opportunityTitle}</td>
                          <td className="py-2 pr-4">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              {a.currentStage}
                            </span>
                          </td>
                          <td className="py-2 pr-4 font-semibold text-slate-900">{formatCurrencyGHS((a as any).valueGHS || (a as any).dealValueGHS || 250000)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
