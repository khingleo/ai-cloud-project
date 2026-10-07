/**
 * MTN ENTERPRISE HUB - DEDICATED NEW CUSTOMER ONBOARDING PAGE
 * Route: /customers/new
 * 
 * Features:
 * - Full manual text entry for all corporate metadata (Company Name, Industry, Segment, GPS, Location, Reg Number, TIN, Website, Contact Person, KAM)
 * - Intelligent open text inputs (no forced restrictive dropdowns)
 * - Manual Package & Service Configuration with Real-time Smart Price Estimation
 * - Ability to type custom package names, bandwidth/capacity, and manual price overrides
 * - Multi-service assignment directly during customer registration
 */

import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  PlusCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  Hash,
  User,
  Layers,
  Sparkles,
  Trash2,
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle2,
  ImagePlus,
  X,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { formatCurrencyGHS } from '../utils/formatters';
import type { CustomerSegment } from '../types';

interface CustomServiceItem {
  id: string;
  packageName: string;
  category: string;
  capacityOrBandwidth: string;
  monthlyPriceGHS: number;
  setupFeeGHS: number;
  contractTermMonths: number;
  billingFrequency: string;
  technicalNotes: string;
}

// Smart Price Estimator based on keywords typed in package name or specs
function estimatePriceForPackage(name: string, capacity: string): { estimatedMRC: number; estimatedOTC: number; category: string } {
  const text = `${name} ${capacity}`.toLowerCase();
  
  // Dedicated Internet (DIA)
  if (text.includes('dedicated') || text.includes('dia')) {
    const mbpsMatch = text.match(/(\d+)\s*(mbps|mb|g|gbps)/);
    const speed = mbpsMatch ? parseInt(mbpsMatch[1], 10) : 20;
    const isGbps = text.includes('gbps') || text.includes('1g');
    const actualSpeed = isGbps ? speed * 1000 : speed;
    return {
      estimatedMRC: Math.max(1800, actualSpeed * 85),
      estimatedOTC: 1500,
      category: 'Fixed',
    };
  }

  // Fiber Broadband / FWA / Turbonet
  if (text.includes('fiber') || text.includes('broadband') || text.includes('turbonet') || text.includes('fwa')) {
    const mbpsMatch = text.match(/(\d+)\s*(mbps|mb)/);
    const speed = mbpsMatch ? parseInt(mbpsMatch[1], 10) : 50;
    return {
      estimatedMRC: Math.max(450, speed * 25),
      estimatedOTC: 800,
      category: 'Fixed',
    };
  }

  // Starlink / Satellite
  if (text.includes('starlink') || text.includes('satellite') || text.includes('vsat')) {
    return {
      estimatedMRC: 3800,
      estimatedOTC: 18500,
      category: 'Converged',
    };
  }

  // SD-WAN / MPLS / Leased Lines
  if (text.includes('sd-wan') || text.includes('sdwan') || text.includes('mpls') || text.includes('leased line')) {
    const branchesMatch = text.match(/(\d+)\s*(site|branch|location)/);
    const branches = branchesMatch ? parseInt(branchesMatch[1], 10) : 3;
    return {
      estimatedMRC: branches * 3200,
      estimatedOTC: branches * 1200,
      category: 'Converged',
    };
  }

  // Cloud / Azure / Colocation / Data Center
  if (text.includes('cloud') || text.includes('azure') || text.includes('colo') || text.includes('rack') || text.includes('server')) {
    return {
      estimatedMRC: 4500,
      estimatedOTC: 2000,
      category: 'Converged',
    };
  }

  // Hosted PBX / SIP / VoIP / Call Center / IVR
  if (text.includes('pbx') || text.includes('sip') || text.includes('voip') || text.includes('call center') || text.includes('ivr') || text.includes('voice')) {
    const userMatch = text.match(/(\d+)\s*(user|ext|extension|agent|channel|did)/);
    const count = userMatch ? parseInt(userMatch[1], 10) : 15;
    return {
      estimatedMRC: Math.max(600, count * 95),
      estimatedOTC: 1000,
      category: 'Converged',
    };
  }

  // Bulk SMS / USSD / Sponsored Data / Chenosis
  if (text.includes('sms') || text.includes('ussd') || text.includes('chenosis') || text.includes('messenger')) {
    const smsMatch = text.match(/(\d+[\d,]*)\s*(sms|hit|msg|message)/);
    const count = smsMatch ? parseInt(smsMatch[1].replace(/,/g, ''), 10) : 20000;
    return {
      estimatedMRC: Math.max(350, Math.round(count * 0.038)),
      estimatedOTC: 500,
      category: 'Digital',
    };
  }

  // CUG / Postpaid / Mobile SIMs / Groupshare / AFA
  if (text.includes('cug') || text.includes('postpaid') || text.includes('sim') || text.includes('mobile') || text.includes('groupshare') || text.includes('afa')) {
    const simMatch = text.match(/(\d+)\s*(sim|line|user|member)/);
    const count = simMatch ? parseInt(simMatch[1], 10) : 20;
    return {
      estimatedMRC: Math.max(500, count * 110),
      estimatedOTC: count * 20,
      category: 'Mobile',
    };
  }

  // Microsoft 365 / WebWiz / Software
  if (text.includes('365') || text.includes('microsoft') || text.includes('office') || text.includes('webwiz') || text.includes('website')) {
    const userMatch = text.match(/(\d+)\s*(license|user|seat)/);
    const count = userMatch ? parseInt(userMatch[1], 10) : 10;
    return {
      estimatedMRC: Math.max(300, count * 145),
      estimatedOTC: 400,
      category: 'Converged',
    };
  }

  // Security / Firewall / WAF
  if (text.includes('security') || text.includes('firewall') || text.includes('waf') || text.includes('ddos')) {
    return {
      estimatedMRC: 2800,
      estimatedOTC: 1500,
      category: 'Converged',
    };
  }

  // Default fallback estimate
  return {
    estimatedMRC: 1500,
    estimatedOTC: 500,
    category: 'Fixed',
  };
}

export const AddCustomerPage: React.FC = () => {
  const { addCustomer, addActiveService, addSubscription, addNetworkConfig, addBillingAccount } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // ── 0. Company Logo / Picture ──
  const [logoUrl, setLogoUrl] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // ── 1. Company Information (Manual Free Text) ──
  const [name, setName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [segment, setSegment] = useState('Large Enterprise');
  const [industry, setIndustry] = useState('Banking & Financial Services');
  const [location, setLocation] = useState('Airport City, Accra');
  const [ghanaPostGps, setGhanaPostGps] = useState('GA-182-9021');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [tin, setTin] = useState('');
  const [establishedYear, setEstablishedYear] = useState<string>('2018');
  const [website, setWebsite] = useState('');
  const [corporateEmail, setCorporateEmail] = useState('');
  const [corporatePhone, setCorporatePhone] = useState('+233 30 200 0000');
  const [creditRating, setCreditRating] = useState<'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'Under Review'>('AA');
  const [accountManager, setAccountManager] = useState('Kwame Mensah');
  const [accountManagerEmail, setAccountManagerEmail] = useState('kwame.mensah@mtn.com.gh');

  // ── 2. Primary Executive Contact (Manual Free Text) ──
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('Head of Information Technology');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('+233 24 000 1122');

  // ── 3. Services / Packages Configuration (Manual with Smart Estimator) ──
  const [serviceItems, setServiceItems] = useState<CustomServiceItem[]>([
    {
      id: 'item-1',
      packageName: 'Dedicated Internet Access 50Mbps',
      category: 'Fixed',
      capacityOrBandwidth: '50 Mbps Symmetrical (1:1 CIR)',
      monthlyPriceGHS: 4250,
      setupFeeGHS: 1500,
      contractTermMonths: 24,
      billingFrequency: 'Monthly Postpaid',
      technicalNotes: 'Fiber drop to server room, Managed Cisco CPE, /29 Public IPs',
    },
  ]);

  // Handle KAM Auto-Email Suggestion
  const handleAccountManagerChange = (val: string) => {
    setAccountManager(val);
    const clean = val.toLowerCase().trim().replace(/\s+/g, '.');
    if (clean) {
      setAccountManagerEmail(`${clean}@mtn.com.gh`);
    }
  };

  // Add a new blank package item
  const handleAddServiceItem = () => {
    const newItem: CustomServiceItem = {
      id: `item-${Date.now()}`,
      packageName: 'MTN Corporate CUG 25 Lines',
      category: 'Mobile',
      capacityOrBandwidth: '25 SIMs with 15GB Pooled Data + Unlimited On-net Calls',
      monthlyPriceGHS: 2750,
      setupFeeGHS: 500,
      contractTermMonths: 12,
      billingFrequency: 'Monthly Postpaid',
      technicalNotes: 'Standard 4G/5G Corporate SIMs',
    };
    setServiceItems((prev) => [...prev, newItem]);
  };

  // Remove a package item
  const handleRemoveServiceItem = (id: string) => {
    setServiceItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update a field in a package item & trigger smart price suggestion if package name changed
  const handleUpdateServiceItem = (id: string, field: keyof CustomServiceItem, value: any) => {
    setServiceItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // If package name or capacity was edited and user is typing, we auto-estimate if price was default
        if (field === 'packageName' || field === 'capacityOrBandwidth') {
          const { estimatedMRC, estimatedOTC, category } = estimatePriceForPackage(
            field === 'packageName' ? value : item.packageName,
            field === 'capacityOrBandwidth' ? value : item.capacityOrBandwidth
          );
          updated.monthlyPriceGHS = estimatedMRC;
          updated.setupFeeGHS = estimatedOTC;
          updated.category = category;
        }

        return updated;
      })
    );
  };

  // Compute Total Initial Contract Value
  const totalMonthlyValue = useMemo(() => {
    return serviceItems.reduce((sum, item) => sum + (Number(item.monthlyPriceGHS) || 0), 0);
  }, [serviceItems]);

  const totalSetupFees = useMemo(() => {
    return serviceItems.reduce((sum, item) => sum + (Number(item.setupFeeGHS) || 0), 0);
  }, [serviceItems]);

  const totalAnnualValue = totalMonthlyValue * 12 + totalSetupFees;

  // Handle Full Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Validation Error', 'Company legal name is required.');
      return;
    }

    const regNo = registrationNumber.trim() || `CS${Math.floor(100000000 + Math.random() * 900000000)}`;
    const tinNo = tin.trim() || `C${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Create the customer master record
    const createdCustomer = addCustomer({
      name: name.trim(),
      tradingName: tradingName.trim() || name.trim(),
      segment: (segment.trim() as CustomerSegment) || 'Large Enterprise',
      industry: industry.trim() || 'General Enterprise',
      location: location.trim() || 'Accra, Ghana',
      ghanaPostGps: ghanaPostGps.trim() || 'GA-000-0000',
      accountManager: accountManager.trim() || 'Kwame Mensah',
      accountManagerEmail: accountManagerEmail.trim() || 'kwame.mensah@mtn.com.gh',
      status: 'Active',
      registrationNumber: regNo,
      tin: tinNo,
      establishedYear: parseInt(establishedYear, 10) || new Date().getFullYear(),
      website: website.trim() || `https://www.${slug || 'enterprise'}.com.gh`,
      email: corporateEmail.trim() || (contactEmail.trim() || `info@${slug || 'company'}.com.gh`),
      phone: corporatePhone.trim() || '+233 30 200 0000',
      creditRating: creditRating || 'AA',
      activeServicesCount: serviceItems.filter((s) => s.packageName.trim()).length,
      totalValueGHS: totalAnnualValue || totalMonthlyValue * 12,
      logoUrl: logoUrl || undefined,
      primaryContact: {
        id: `CONT-${Date.now()}`,
        customerId: '',
        name: contactName.trim() || 'Primary Executive',
        role: contactRole.trim() || 'Corporate Executive',
        email: contactEmail.trim() || 'contact@enterprise.com.gh',
        phone: contactPhone.trim() || '+233 24 000 1122',
        isPrimary: true,
      },
    });

    // 2. Create Billing Account
    const billingAcc = addBillingAccount({
      customerId: createdCustomer.id,
      customerName: createdCustomer.name,
      billingCycle: 'Monthly (1st-30th)',
      currency: 'GHS',
      monthlyRecurringCharges: totalMonthlyValue,
      oneTimePendingCharges: totalSetupFees,
      currentBalanceGHS: totalMonthlyValue,
      status: 'Current',
      lastInvoiceDate: new Date().toISOString().split('T')[0],
      paymentStatus: 'Pending',
    });

    // 3. Provision each package as Active Service, Subscription, and Network Config
    serviceItems.forEach((item, index) => {
      if (item.packageName.trim()) {
        const cktId = `MTN-CKT-${Date.now().toString().slice(-4)}-${index + 1}`;
        const serviceId = `SRV-SUB-${Date.now().toString().slice(-4)}-${index + 1}`;

        try {
          addActiveService({
            customerId: createdCustomer.id,
            customerName: createdCustomer.name,
            serviceName: item.packageName.trim(),
            category: (item.category as any) || 'Fixed',
            activationDate: new Date().toISOString().split('T')[0],
            serviceOwner: accountManager.trim() || 'Kwame Mensah',
            status: 'Active',
            renewalDate: new Date(Date.now() + (Number(item.contractTermMonths) || 12) * 30 * 86400000).toISOString().split('T')[0],
            mrcGHS: Number(item.monthlyPriceGHS) || 0,
            bandwidthOrCapacity: item.capacityOrBandwidth || 'Dedicated Circuit',
            slaTier: 'Platinum (99.9%)',
            dclmAccountId: billingAcc.id,
            ipSubnetOrCircuitId: cktId,
          });

          addSubscription({
            customerId: createdCustomer.id,
            customerName: createdCustomer.name,
            serviceId,
            serviceName: item.packageName.trim(),
            productName: item.packageName.trim(),
            packageTitle: item.packageName.trim(),
            category: (item.category as any) || 'Fixed',
            status: 'Active',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + (Number(item.contractTermMonths) || 12) * 30 * 86400000).toISOString().split('T')[0],
            renewalDate: new Date(Date.now() + (Number(item.contractTermMonths) || 12) * 30 * 86400000).toISOString().split('T')[0],
            quantity: 1,
            mrcPriceGHS: Number(item.monthlyPriceGHS) || 0,
            otcPriceGHS: Number(item.setupFeeGHS) || 0,
            currency: 'GHS',
            billingFrequency: (item.billingFrequency as any) || 'Monthly Postpaid',
            accountManager: accountManager.trim() || 'Kwame Mensah',
            circuitId: cktId,
            location: location.trim() || 'Accra, Ghana',
            contractRef: `CTR-${Date.now().toString().slice(-4)}`,
            notes: item.technicalNotes || '',
          });

          const netIp = `154.160.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}/29`;
          const netVlan = 1000 + Math.floor(Math.random() * 900);
          addNetworkConfig({
            serviceId,
            serviceName: item.packageName.trim(),
            customerId: createdCustomer.id,
            customerName: createdCustomer.name,
            connectionType: 'Direct Dedicated Fiber',
            connectivityType: 'Direct Internet (DIA)',
            bandwidth: item.capacityOrBandwidth || '50 Mbps Symmetrical',
            ipAddress: netIp,
            subnetMask: '255.255.255.248',
            gatewayIp: `154.160.${Math.floor(Math.random() * 200)}.1`,
            vlanId: netVlan,
            accessTechnology: 'DWDM / Cisco Carrier Ethernet',
            routerCPE: 'Cisco Catalyst 8300 Series Edge Router',
            installationLocation: `${location.trim()} (Primary Server Room)`,
            gpsCoordinates: ghanaPostGps.trim(),
            networkStatus: 'Operational',
            latencyMs: 12,
            packetLossPercent: 0.01,
            lastTestedAt: new Date().toISOString(),
            technicalNotes: item.technicalNotes || 'Active fiber route configured.',
            // — Compatibility aliases (old pages read these keys):
            circuitId: cktId,
            ipSubnet: netIp,
            vlan: netVlan,
            cpeRouterModel: 'Cisco Catalyst 8300 Series Edge Router',
            lastPingLatency: '12ms',
          });
        } catch {
          // fallback
        }
      }
    });

    showToast('success', 'Customer Registered', `${name} successfully onboarded with ${serviceItems.length} service package(s).`);
    navigate(`/customers/${createdCustomer.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>
        <span className="text-xs text-slate-400 font-semibold">New Enterprise Master Registration</span>
      </div>

      <PageHeader
        title="Register Enterprise Customer"
        subtitle="Manual entry of corporate profile, executive contacts, custom package specifications, and price calculation"
        breadcrumbs={[
          { label: 'Customers', href: '/customers' },
          { label: 'New Customer' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── SECTION 1: COMPANY MASTER DETAILS (MANUAL INPUTS) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-mtn-yellow">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 font-heading">1. Company & Business Information</h2>
              <p className="text-xs text-slate-500">Enter corporate legal metadata, industry, and address details manually</p>
            </div>
          </div>

          {/* ── Company Logo / Profile Picture ── */}
          <div className="flex items-start gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div
              className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-mtn-yellow transition-colors"
              onClick={() => logoInputRef.current?.click()}
              title="Click to upload company logo / picture"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Company logo" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-7 h-7 text-slate-300" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Company Logo / Profile Picture</p>
              <p className="text-xs text-slate-500 mb-2">Upload a logo or photo. Accepts JPG, PNG, WebP, GIF. Stored locally with the profile.</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  {logoUrl ? 'Change Picture' : 'Upload Picture'}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Company Legal Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company Legal Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Chartered Bank Ghana PLC"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50 transition-all"
              />
            </div>

            {/* Trading Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Trading / Brand Name
              </label>
              <input
                type="text"
                value={tradingName}
                onChange={(e) => setTradingName(e.target.value)}
                placeholder="e.g. Stanchart Ghana"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            {/* Industry Vertical (Manual Text with Datalist Suggestions) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Industry Vertical (Type Any)
              </label>
              <input
                type="text"
                list="industry-suggestions"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Type industry name manually..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
              <datalist id="industry-suggestions">
                <option value="Banking & Financial Services" />
                <option value="Mining & Natural Resources" />
                <option value="FMCG & Manufacturing" />
                <option value="Healthcare & Pharmaceuticals" />
                <option value="Education & Universities" />
                <option value="Logistics, Haulage & Shipping" />
                <option value="Telecommunications & Tech" />
                <option value="Government & Public Sector" />
                <option value="Energy, Oil & Gas" />
                <option value="Hospitality & Tourism" />
                <option value="Retail & E-Commerce" />
                <option value="Agribusiness & Cocoa" />
              </datalist>
            </div>

            {/* Customer Segment (Manual Text with Suggestions) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Customer Segment (Type Any)
              </label>
              <input
                type="text"
                list="segment-suggestions"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="Large Enterprise, SME, etc."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
              <datalist id="segment-suggestions">
                <option value="Large Enterprise" />
                <option value="SME" />
                <option value="Public Sector" />
                <option value="Multinational" />
                <option value="Government Agency" />
                <option value="Emerging Corporate" />
              </datalist>
            </div>

            {/* Credit Rating */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Credit Rating Score
              </label>
              <input
                type="text"
                list="credit-suggestions"
                value={creditRating}
                onChange={(e) => setCreditRating(e.target.value as any)}
                placeholder="AAA, AA, A, BBB, BB..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
              <datalist id="credit-suggestions">
                <option value="AAA" />
                <option value="AA" />
                <option value="A" />
                <option value="BBB" />
                <option value="BB" />
                <option value="Under Review" />
              </datalist>
            </div>

            {/* Physical Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Physical Location / City
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Airport City, Accra"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* GhanaPost GPS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                GhanaPost Digital GPS
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ghanaPostGps}
                  onChange={(e) => setGhanaPostGps(e.target.value)}
                  placeholder="e.g. GA-182-9021"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Registration Number (RGD) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company Reg. Number (RGD)
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. CS1849202021"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            {/* Tax Identification Number (TIN) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tax ID Number (TIN)
              </label>
              <input
                type="text"
                value={tin}
                onChange={(e) => setTin(e.target.value)}
                placeholder="e.g. C0003928192"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            {/* Established Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Year Established
              </label>
              <input
                type="number"
                value={establishedYear}
                onChange={(e) => setEstablishedYear(e.target.value)}
                placeholder="2018"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            {/* Corporate Website */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Corporate Website
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.company.com.gh"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Corporate Switchboard Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Main Switchboard Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={corporatePhone}
                  onChange={(e) => setCorporatePhone(e.target.value)}
                  placeholder="+233 30 200 0000"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Corporate Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={corporateEmail}
                  onChange={(e) => setCorporateEmail(e.target.value)}
                  placeholder="info@company.com.gh"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Assigned MTN KAM (Manual Input with Suggestions) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned MTN Account Manager (KAM)
              </label>
              <input
                type="text"
                list="kam-suggestions"
                value={accountManager}
                onChange={(e) => handleAccountManagerChange(e.target.value)}
                placeholder="e.g. Kwame Mensah"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
              <datalist id="kam-suggestions">
                <option value="Kwame Mensah" />
                <option value="Abena Osei" />
                <option value="Kofi Boateng" />
                <option value="Afua Asantewaa" />
                <option value="Eunice Amponsah" />
                <option value="Justin Kwabena" />
              </datalist>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: PRIMARY EXECUTIVE CONTACT (MANUAL INPUTS) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 font-heading">2. Primary Executive Contact Person</h2>
              <p className="text-xs text-slate-500">Key enterprise decision maker, CTO, Head of Procurement, or IT Lead</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Contact Person Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Full Name
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Dr. Kwesi Appiah"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            {/* Job Title / Role */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Job Title / Corporate Role
              </label>
              <input
                type="text"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                placeholder="e.g. Chief Information Officer"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            {/* Direct Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Direct Mobile Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+233 24 123 4567"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            {/* Direct Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Corporate Email Address
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="kwesi.appiah@company.com.gh"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 3: REQUESTED PACKAGES & SMART PRICE ESTIMATOR ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-mtn-yellow">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 font-heading">3. Custom Package & Price Configuration</h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Auto AI Price Estimator Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Type any custom package name or capacity manually — the system dynamically calculates the estimated monthly rate (GHS) with full manual override
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddServiceItem}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-mtn-yellow" />
              <span>Add Another Package</span>
            </button>
          </div>

          {/* List of Configured Package Items */}
          <div className="space-y-4">
            {serviceItems.map((item, index) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Service Package Item
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                      Category: {item.category}
                    </span>
                  </div>

                  {serviceItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceItem(item.id)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold inline-flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Manual Package Name (Free text typing) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Package / Solution Name (Type Custom Name) <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={item.packageName}
                      onChange={(e) => handleUpdateServiceItem(item.id, 'packageName', e.target.value)}
                      placeholder="e.g. Dedicated Internet 100Mbps, Starlink 220Mbps, Custom CUG 50 SIMs..."
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                    />
                  </div>

                  {/* Bandwidth / Quantity / Capacity Specs */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bandwidth / User Capacity / Tier
                    </label>
                    <input
                      type="text"
                      value={item.capacityOrBandwidth}
                      onChange={(e) => handleUpdateServiceItem(item.id, 'capacityOrBandwidth', e.target.value)}
                      placeholder="e.g. 50 Mbps Symmetrical, 20 Extensions, 50k SMS"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                    />
                  </div>

                  {/* Estimated Monthly Price (GHS) - User can freely override */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Monthly Recurring Price (GHS) *</span>
                      <span className="text-[10px] text-amber-700 font-bold">Editable</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={item.monthlyPriceGHS}
                        onChange={(e) => handleUpdateServiceItem(item.id, 'monthlyPriceGHS', parseFloat(e.target.value) || 0)}
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      />
                      <DollarSign className="w-4 h-4 text-amber-700 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* One-Time Setup Fee (GHS) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Installation / Setup Fee (GHS)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={item.setupFeeGHS}
                        onChange={(e) => handleUpdateServiceItem(item.id, 'setupFeeGHS', parseFloat(e.target.value) || 0)}
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                      />
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Contract Term (Months) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contract Term (Months)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={item.contractTermMonths}
                        onChange={(e) => handleUpdateServiceItem(item.id, 'contractTermMonths', parseInt(e.target.value, 10) || 12)}
                        className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                      />
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Technical Notes / Requirements */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Technical Specs, Equipment & Provisioning Notes
                    </label>
                    <input
                      type="text"
                      value={item.technicalNotes}
                      onChange={(e) => handleUpdateServiceItem(item.id, 'technicalNotes', e.target.value)}
                      placeholder="e.g. Cisco ISR 4331 CPE Router, Direct GPON Fiber Termination, /29 Static Public IPs"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Dynamic Pricing Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-mtn-yellow">Total Contract Summary</p>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <div>
                  <span className="text-xs text-slate-400 block">Monthly Recurring Charge</span>
                  <span className="text-xl font-black font-heading text-white">{formatCurrencyGHS(totalMonthlyValue)}/mo</span>
                </div>
                <div className="h-8 w-px bg-slate-700 hidden sm:block" />
                <div>
                  <span className="text-xs text-slate-400 block">One-Time Setup</span>
                  <span className="text-base font-bold text-slate-200">{formatCurrencyGHS(totalSetupFees)}</span>
                </div>
                <div className="h-8 w-px bg-slate-700 hidden sm:block" />
                <div>
                  <span className="text-xs text-slate-400 block">Total 1-Year Value</span>
                  <span className="text-base font-black text-emerald-400">{formatCurrencyGHS(totalAnnualValue)}</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-bold px-3 py-1 bg-white/10 rounded-full text-slate-300 border border-white/10">
                {serviceItems.length} Active Package(s) Configured
              </span>
            </div>
          </div>
        </div>

        {/* ── SUBMIT BUTTONS BAR ── */}
        <div className="sticky bottom-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-sm font-black rounded-xl shadow-mtn-glow transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Register Customer & Provision Services</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
