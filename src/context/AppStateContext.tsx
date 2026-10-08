/**
 * MTN ENTERPRISE HUB - GLOBAL APPLICATION STATE CONTEXT
 * 
 * Manages local reactive state and shared Supabase persistence for customer records.
 * Facilitates the complete end-to-end business journey:
 * Customer -> Lead -> Opportunity -> Presales -> Approvals -> Service Delivery -> Active Service
 * 
 * Customer-linked records are synchronized by keyed rows; other modules remain locally cached.
 * All functions include Add, Edit (Update), and Delete operations for every enterprise module.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type {
  Customer,
  CustomerSegment,
  EnterpriseProduct,
  Lead,
  Opportunity,
  OpportunityStage,
  PresalesRequest,
  EnterpriseDocument,
  EnterpriseApproval,
  ApprovalStageName,
  ServiceDelivery,
  ActiveService,
  EnterpriseTask,
  EnterpriseNotification,
  EnterpriseUser,
  ServiceSubscription,
  NetworkConfiguration,
  StandardPriceItem,
  CustomerSpecificPrice,
  BillingAccount,
  InvoiceRecord,
  AuditLogEntry,
} from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface AppStateContextType {
  // State Collections
  customers: Customer[];
  products: EnterpriseProduct[];
  leads: Lead[];
  opportunities: Opportunity[];
  presales: PresalesRequest[];
  documents: EnterpriseDocument[];
  approvals: EnterpriseApproval[];
  serviceDeliveries: ServiceDelivery[];
  activeServices: ActiveService[];
  tasks: EnterpriseTask[];
  notifications: EnterpriseNotification[];
  users: EnterpriseUser[];
  currentUser: EnterpriseUser | null;
  subscriptions: ServiceSubscription[];
  networkConfigs: NetworkConfiguration[];
  standardPrices: StandardPriceItem[];
  customerPrices: CustomerSpecificPrice[];
  billingAccounts: BillingAccount[];
  invoices: InvoiceRecord[];
  auditLogs: AuditLogEntry[];
  databaseSyncError: string | null;
  databaseSyncing: boolean;
  databaseReady: boolean;
  importRecords: (
    collection: MutableTransferCollection,
    records: Array<Record<string, unknown>>,
  ) => ImportSummary;

  // Helper for manual company entry
  getOrCreateCustomerByName: (companyName: string, segment?: CustomerSegment, industry?: string) => Customer;

  // Actions - Customers (CRUD)
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'activeServicesCount' | 'totalValueGHS'> & { activeServicesCount?: number; totalValueGHS?: number }) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Actions - Leads (CRUD)
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  convertLeadToOpportunity: (leadId: string) => Opportunity | null;

  // Actions - Opportunities (CRUD)
  addOpportunity: (opportunity: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>) => Opportunity;
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => void;
  updateOpportunityStage: (id: string, newStage: OpportunityStage) => void;

  // Actions - Products (CRUD)
  addProduct: (product: Omit<EnterpriseProduct, 'id'>) => EnterpriseProduct;
  updateProduct: (id: string, updates: Partial<EnterpriseProduct>) => void;
  deleteProduct: (id: string) => void;

  // Actions - Presales & Technical Assessment (CRUD)
  addPresalesRequest: (presales: Omit<PresalesRequest, 'id' | 'createdAt'>) => PresalesRequest;
  updatePresales: (id: string, updates: Partial<PresalesRequest>) => void;
  deletePresalesRequest: (id: string) => void;
  submitPresalesAssessment: (id: string, assessmentData: Partial<PresalesRequest>) => void;

  // Actions - Documents (CRUD)
  addDocument: (doc: Omit<EnterpriseDocument, 'id' | 'date'>) => EnterpriseDocument;
  updateDocument: (id: string, updates: Partial<EnterpriseDocument>) => void;
  deleteDocument: (id: string) => void;

  // Actions - Approvals (CRUD)
  addApproval: (approval: Omit<EnterpriseApproval, 'id' | 'createdAt' | 'updatedAt'>) => EnterpriseApproval;
  updateApproval: (id: string, updates: Partial<EnterpriseApproval>) => void;
  deleteApproval: (id: string) => void;
  signApprovalStep: (
    approvalId: string,
    stageName: ApprovalStageName,
    decision: 'Approved' | 'Rejected' | 'Returned',
    comments?: string
  ) => void;

  // Actions - Service Delivery (CRUD)
  addServiceDelivery: (delivery: Omit<ServiceDelivery, 'id'>) => ServiceDelivery;
  updateServiceDelivery: (id: string, updates: Partial<ServiceDelivery>) => void;
  deleteServiceDelivery: (id: string) => void;
  updateDeliveryProgress: (id: string, progress: number, milestoneIndex?: number) => void;

  // Actions - Active Services (CRUD)
  addActiveService: (service: Omit<ActiveService, 'id'>) => ActiveService;
  updateActiveService: (id: string, updates: Partial<ActiveService>) => void;
  deleteActiveService: (id: string) => void;

  // Actions - Subscriptions (CRUD)
  addSubscription: (sub: Omit<ServiceSubscription, 'id' | 'createdBy' | 'updatedAt'>) => ServiceSubscription;
  updateSubscription: (id: string, updates: Partial<ServiceSubscription>) => void;
  deleteSubscription: (id: string) => void;

  // Actions - Network Configurations (CRUD)
  addNetworkConfig: (config: Omit<NetworkConfiguration, 'id'>) => NetworkConfiguration;
  updateNetworkConfig: (id: string, updates: Partial<NetworkConfiguration>) => void;
  deleteNetworkConfig: (id: string) => void;

  // Actions - Pricing (CRUD)
  addStandardPrice: (price: Omit<StandardPriceItem, 'id'>) => StandardPriceItem;
  updateStandardPrice: (id: string, updates: Partial<StandardPriceItem>) => void;
  deleteStandardPrice: (id: string) => void;

  addCustomerPrice: (price: Omit<CustomerSpecificPrice, 'id'>) => CustomerSpecificPrice;
  updateCustomerPrice: (id: string, updates: Partial<CustomerSpecificPrice>) => void;
  deleteCustomerPrice: (id: string) => void;

  // Actions - Billing & Invoices (CRUD)
  addBillingAccount: (account: Omit<BillingAccount, 'id'>) => BillingAccount;
  updateBillingAccount: (id: string, updates: Partial<BillingAccount>) => void;
  deleteBillingAccount: (id: string) => void;

  addInvoice: (invoice: Omit<InvoiceRecord, 'id'>) => InvoiceRecord;
  updateInvoice: (id: string, updates: Partial<InvoiceRecord>) => void;
  deleteInvoice: (id: string) => void;

  // Actions - Tasks (CRUD)
  addTask: (task: Omit<EnterpriseTask, 'id' | 'createdAt'>) => EnterpriseTask;
  updateTask: (id: string, updates: Partial<EnterpriseTask>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  notifyTaskAssignee: (task: EnterpriseTask) => Promise<void>;

  // Actions - Users (CRUD)
  addUser: (user: Omit<EnterpriseUser, 'id'>) => EnterpriseUser;
  updateUser: (id: string, updates: Partial<EnterpriseUser>) => void;
  deleteUser: (id: string) => void;

  // Actions - Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Actions - Audit Ledger
  addAuditLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => AuditLogEntry;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export type TransferCollection =
  | 'customers'
  | 'products'
  | 'leads'
  | 'opportunities'
  | 'presales'
  | 'documents'
  | 'approvals'
  | 'serviceDeliveries'
  | 'activeServices'
  | 'subscriptions'
  | 'networkConfigs'
  | 'standardPrices'
  | 'customerPrices'
  | 'billingAccounts'
  | 'invoices'
  | 'tasks'
  | 'auditLogs';

export type MutableTransferCollection = Exclude<TransferCollection, 'auditLogs'>;

export interface ImportSummary {
  added: number;
  updated: number;
}

const STORAGE_PREFIX = 'mtn_hub_';
const PRODUCTS_SEED_KEY = 'mtn_hub_products_official_v5';
const SHARED_COLLECTIONS = [
  'customers',
  'subscriptions',
  'network_configs',
  'billing_accounts',
  'invoices',
  'customer_prices',
  'documents',
  'audit_logs',
  'tasks',
] as const;

type SharedCollection = typeof SHARED_COLLECTIONS[number];

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toEnterpriseNotification(value: unknown): EnterpriseNotification | null {
  if (
    !isObjectRecord(value)
    || typeof value.id !== 'string'
    || typeof value.recipient_id !== 'string'
    || typeof value.title !== 'string'
    || typeof value.message !== 'string'
    || typeof value.created_at !== 'string'
    || typeof value.read !== 'boolean'
    || typeof value.link !== 'string'
  ) return null;

  return {
    id: value.id,
    recipientId: value.recipient_id,
    title: value.title,
    message: value.message,
    category: 'Task',
    timestamp: new Date(value.created_at).toLocaleString(),
    read: value.read,
    link: value.link,
  };
}

function serializeRecord(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(serializeRecord).join(',')}]`;
  if (isObjectRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${serializeRecord(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function createRecordId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function isValidSharedRecord(collection: SharedCollection, value: unknown): value is Record<string, unknown> & { id: string } {
  if (!isObjectRecord(value) || typeof value.id !== 'string' || !value.id) return false;
  switch (collection) {
    case 'customers':
      return typeof value.name === 'string' && typeof value.segment === 'string';
    case 'subscriptions':
      return typeof value.customerId === 'string' && typeof value.productName === 'string';
    case 'network_configs':
      return typeof value.customerId === 'string' && typeof value.serviceName === 'string';
    case 'billing_accounts':
      return typeof value.customerId === 'string' && typeof value.customerName === 'string';
    case 'invoices':
      return typeof value.customerId === 'string' && typeof value.billingAccountId === 'string';
    case 'customer_prices':
      return typeof value.customerId === 'string' && typeof value.productName === 'string';
    case 'documents':
      return typeof value.name === 'string' && typeof value.type === 'string';
    case 'audit_logs':
      return typeof value.recordId === 'string' && typeof value.action === 'string';
    case 'tasks':
      return typeof value.title === 'string'
        && typeof value.assignedTo === 'string'
        && typeof value.status === 'string';
  }
}

// ================================================================
// MTN GHANA ENTERPRISE PRODUCT CATALOGUE SEED DATA
// Grounded strictly in "Enterprise Products (3).xlsx" / Sheet: products
// Product Owners: Afua, Eunice, Justin
// Categories: Mobile | Converged | Digital | Fixed
// ================================================================
const MTN_GHANA_PRODUCTS_SEED: EnterpriseProduct[] = [
  // ── 1. AFA Bundle (Mobile) ──
  {
    id: 'PROD-MOB-AFA',
    name: 'AFA Bundle',
    serviceType: 'Mobile',
    category: 'Mobile',
    description: 'A special mobile subscription for data, voice and sms services tailored for farmers.',
    fullDescription: 'A special mobile subscription for data, voice and sms services tailored for farmers. Designed to enhance agricultural productivity with affordable and reliable communication.',
    pricingModel: 'Fixed Pricing (Different packages)',
    productOwner: 'Afua',
    targetSegments: ['SME', 'Large Enterprise'],
    technicalRequirements: ['MTN SIM Cards', 'Farmer Association Registration'],
    status: 'Active',
    iconName: 'Sprout',
    keyFeatures: ['Discounted agricultural voice rates', 'Subsidized data bundles', 'Weather & market price SMS alerts'],
    slaOptions: ['Standard Mobile SLA (99.0%)'],
  },
  // ── 2. APN Solutions (Converged) ──
  {
    id: 'PROD-CONV-APN',
    name: 'APN Solutions',
    serviceType: 'Converged',
    category: 'Converged',
    description: "MTN Access Point Name Solutions enables devices such as PCs or POS devices to connect to company internal networks and databases securely.",
    fullDescription: "MTN Access Point Name Solutions or services enables devices such as Personal Computers or Mobile Devices such as point of sale (POS) devices in various geographical areas to connect to their databases and servers or a company's internal network.",
    pricingModel: 'Number of SIMs, Data Package, APN Connectivity Type (Internet, Leased Line), Medium (Direct Fiber, GPON Fiber, MW, Mobile), Customer segment (LE, SME)',
    productOwner: 'Afua',
    targetSegments: ['Large Enterprise', 'SME', 'Multinational'],
    technicalRequirements: ['Dedicated Private APN', 'IPSec Tunnel / Leased Line', 'Radius / AAA Authentication'],
    status: 'Active',
    iconName: 'Waypoints',
    keyFeatures: ['Isolated corporate APN gateway', 'Encrypted end-to-end data tunnel', 'Static IP per device support', 'Multi-medium connectivity'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.5%)'],
  },
  // ── 3. Association Bundle (Mobile) ──
  {
    id: 'PROD-MOB-ASSOC',
    name: 'Association Bundle',
    serviceType: 'Mobile',
    category: 'Mobile',
    description: 'Offers groups discounted data, voice, and SMS packages, plus essential business services on one platform.',
    fullDescription: 'The Association Bundle offers groups discounted data, voice, and SMS packages, plus essential business services on one platform. Tailored for trade unions, cooperatives, and professional bodies.',
    pricingModel: 'Fixed Pricing (Different packages)',
    productOwner: 'Afua',
    targetSegments: ['SME', 'Large Enterprise', 'Public Sector'],
    technicalRequirements: ['Corporate / Association Master Account', 'Bulk Member MSISDN list'],
    status: 'Active',
    iconName: 'Share2',
    keyFeatures: ['Group voice and data pooling', 'Unified billing to association', 'Self-service admin portal'],
    slaOptions: ['Standard Mobile SLA (99.0%)'],
  },
  // ── 4. Audio Conferencing (Converged) ──
  {
    id: 'PROD-CONV-AUDCONF',
    name: 'Audio Conferencing',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Enables multiple participants in different locations to join a teleconference by dialling into a central conference bridge.',
    fullDescription: 'Audio Conferencing enables two or more people in different locations to join a teleconference by dialling into a central conference bridge. Participants are charged a minimal fee based on the duration of access to the conference bridge.',
    pricingModel: 'Fixed Pricing (Different packages based on bridge duration and participants)',
    productOwner: 'Afua',
    targetSegments: ['Large Enterprise', 'Multinational', 'Public Sector'],
    technicalRequirements: ['PSTN / Mobile voice access', 'Dedicated Bridge PIN & Access Number'],
    status: 'Active',
    iconName: 'Headphones',
    keyFeatures: ['HD voice quality conference bridge', 'Toll-free and local dial-in numbers', 'Host moderation controls'],
    slaOptions: ['Gold (99.5%)'],
  },
  // ── 5. Auto-Recharge (Mobile) ──
  {
    id: 'PROD-MOB-AUTORECH',
    name: 'Auto-Recharge',
    serviceType: 'Mobile',
    category: 'Mobile',
    description: 'A service offering to organisations and customers to buy airtime in bulk with automated multi-number distribution.',
    fullDescription: 'A service offering to organisation and customers to buy airtime in bulk. It also allows bulk purchase unto multiple numbers automatically on scheduled cycles.',
    pricingModel: 'Fixed Pricing / Bulk Airtime Discount Tiers',
    productOwner: 'Afua',
    targetSegments: ['Large Enterprise', 'SME', 'Public Sector'],
    technicalRequirements: ['Corporate Master Account', 'API or Portal Access for scheduled disbursement'],
    status: 'Active',
    iconName: 'Zap',
    keyFeatures: ['Scheduled automated bulk recharge', 'Real-time disbursement reports', 'Multi-number CSV batch uploads'],
    slaOptions: ['Standard (99.0%)'],
  },
  // ── 6. Bulk SMS (Digital) ──
  {
    id: 'PROD-DIG-BULKSMS',
    name: 'Bulk SMS',
    serviceType: 'Digital',
    category: 'Digital',
    description: 'Allows enterprise clients to send out large volumes of SMS messages instantaneously to target audiences.',
    fullDescription: 'Bulk SMS allows you to send out large amounts of SMS messages at a time. Ideal for promotional campaigns, transaction alerts, and corporate notifications.',
    pricingModel: 'Volume of SMS (Tiered Pricing), Bulk SMS via Ngage may include Platform access fee',
    productOwner: 'Afua',
    targetSegments: ['Large Enterprise', 'SME', 'Public Sector', 'Multinational'],
    technicalRequirements: ['HTTP REST API / SMPP Protocol / Web Portal', 'Sender ID registration with NCA'],
    status: 'Active',
    iconName: 'MessageSquare',
    keyFeatures: ['High throughput (>10,000 SMS/min)', 'Custom Alpha-Numeric Sender ID', 'Detailed delivery receipts (DLR)', 'Ngage campaign management portal'],
    slaOptions: ['Platinum (99.9%)', 'Gold (99.5%)'],
  },
  // ── 7. Business Manager (Digital) ──
  {
    id: 'PROD-DIG-BIZMGR',
    name: 'Business Manager',
    serviceType: 'Digital',
    category: 'Digital',
    description: 'Cloud solution that helps SMEs manage retail operations, accept MoMo payments, and access dashboards and reports.',
    fullDescription: 'Business Manager is a cloud-based solution that helps SMEs manage retail operations, accept MoMo payments, and access dashboards and reports. It is available through the Business Manager web portal and as an Android mobile application.',
    pricingModel: 'Fixed Pricing (Different packages)',
    productOwner: 'Afua',
    targetSegments: ['SME', 'Large Enterprise'],
    technicalRequirements: ['Android Smartphone / Tablet or Web Browser', 'MTN MoMo Merchant Account'],
    status: 'Active',
    iconName: 'Store',
    keyFeatures: ['Integrated MoMo QR payment acceptance', 'Real-time sales & inventory tracking', 'Android mobile app & web portal', 'Automated financial reports'],
    slaOptions: ['Gold (99.5%)'],
  },
  // ── 8. Business Messenger (Digital) ──
  {
    id: 'PROD-DIG-BIZMSG',
    name: 'Business Messenger',
    serviceType: 'Digital',
    category: 'Digital',
    description: 'Prepaid solution providing enterprise clients an application to connect to their audience via SMS, E-mail and Social Media.',
    fullDescription: 'The Business Messenger is a prepaid solution that provides enterprise clients an application to connect to their audience either through SMS, E-mail and Social Media with multi-channel analytics.',
    pricingModel: 'Fixed Pricing (Different packages)',
    productOwner: 'Afua',
    targetSegments: ['Large Enterprise', 'SME'],
    technicalRequirements: ['Web Browser / SaaS Portal', 'Verified Corporate Sender ID'],
    status: 'Active',
    iconName: 'Megaphone',
    keyFeatures: ['Omnichannel SMS, Email, and Social integration', 'Interactive chatbot capabilities', 'Campaign conversion analytics'],
    slaOptions: ['Gold (99.5%)'],
  },
  // ── 9. Chenosis (Digital) ──
  {
    id: 'PROD-DIG-CHENOSIS',
    name: 'Chenosis',
    serviceType: 'Digital',
    category: 'Digital',
    description: 'Pan African Developer Accelerator Platform (DxP) providing APIs, Low-Code/No-Code solutions to build apps faster and cheaper.',
    fullDescription: 'Chenosis is a Pan African Developer Accelerator Platform (DxP) to help developers build applications better, faster and cheaper by providing them with tools such as APIs, Low-Code/No-Code platform solutions across fintech, messaging, and identity verification.',
    pricingModel: 'Type of API (Different prices for different APIs) & Volume of API calls (Tiered Pricing)',
    productOwner: 'Afua',
    targetSegments: ['Large Enterprise', 'SME', 'Multinational'],
    technicalRequirements: ['Developer Portal Access', 'API Key & OAuth 2.0 Credentials'],
    status: 'Active',
    iconName: 'Code',
    keyFeatures: ['Pan-African API marketplace', 'Identity, MoMo, Messaging & Location APIs', 'Low-Code/No-Code workflow builder', 'Developer sandbox environment'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.9%)'],
  },
  // ── 10. Cloud (Converged) ──
  {
    id: 'PROD-CONV-CLOUD',
    name: 'Cloud',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Cloud solutions such as compute, storage via local cloud and public cloud such as Microsoft Azure.',
    fullDescription: 'Cloud Solutions such as Compute, storage via local cloud and public cloud such as MS Azure. Tailored for enterprise digital transformation with local data sovereignty and low latency.',
    pricingModel: 'Resource consumption (vCPU, RAM, Storage) / Monthly Subscription',
    productOwner: 'Afua',
    targetSegments: ['Large Enterprise', 'Multinational', 'Public Sector'],
    technicalRequirements: ['Direct Internet Access / MPLS ExpressRoute', 'Hyper-V / VMware / Azure tenant'],
    status: 'Active',
    iconName: 'Cloud',
    keyFeatures: ['Local Ghanaian Data Centre hosting', 'Microsoft Azure ExpressRoute integration', 'Scalable IaaS compute & block storage', 'Disaster recovery and backup replication'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.9%)'],
  },
  // ── 11. Corporate Postpaid (Mobile) ──
  {
    id: 'PROD-MOB-CORPPOST',
    name: 'Corporate Postpaid',
    serviceType: 'Mobile',
    category: 'Mobile',
    description: 'Reliable, cost-effective, and scalable mobile voice, data, SMS, and CUG services for SMEs and large enterprises.',
    fullDescription: 'MTN Corporate Postpaid provides reliable, cost-effective, and scalable mobile services for SMEs and large enterprises. It offers organizations greater control, flexibility, and cost savings to keep their teams connected and productive.',
    pricingModel: 'Number of SIMs, Package (Data, Voice, SMS, CUG), Customer segment (LE, SME)',
    productOwner: 'Afua',
    targetSegments: ['Large Enterprise', 'SME', 'Public Sector', 'Multinational'],
    technicalRequirements: ['Corporate Master Postpaid Agreement', 'Company Registration & TIN'],
    status: 'Active',
    iconName: 'Smartphone',
    keyFeatures: ['Free on-net CUG calling', 'Itemized corporate billing per cost centre', 'Flexible pooled data bundles', 'Credit limit management'],
    slaOptions: ['Standard Mobile SLA (99.0%)'],
  },
  // ── 12. Data Center Colocation (Converged) ──
  {
    id: 'PROD-CONV-COLO',
    name: 'Data Center Colocation',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Low-cost rack space and managed IT infrastructure in MTN Tier III Data Centre for tech companies handling large data volumes.',
    fullDescription: 'MTN Co-location solution targets Tech Companies and Companies handling large volumes of data and possibly require secure server connectivity. Offering low-cost rack space, MTN Data Centre manages IT infrastructure, allowing businesses to focus on their operations.',
    pricingModel: 'Rack size, Bandwidth, Redundancy Requirements, Power may be charged in the near future',
    productOwner: 'Afua',
    targetSegments: ['Large Enterprise', 'Multinational', 'Public Sector'],
    technicalRequirements: ['Standard 19-inch rackmount hardware', 'Dual power feed PDUs', 'Cross-connect cabling'],
    status: 'Active',
    iconName: 'Server',
    keyFeatures: ['Tier III certified data center facility', 'Dual redundant power (UPS + Gen-sets)', 'Precision climate control & fire suppression', '24/7 biometric physical security'],
    slaOptions: ['Platinum (99.98%)'],
  },
  // ── 13. Devices (Mobile) ──
  {
    id: 'PROD-MOB-DEVICES',
    name: 'Devices',
    serviceType: 'Mobile',
    category: 'Mobile',
    description: 'Corporate acquisition of mobile devices on a 6, 9, or 12 months amortization schedule with corresponding upfront payments.',
    fullDescription: 'A service that provide a mean for mobile devices to be acquired by Organizations for use with mobile plans - payment terms are on a 12, 9, or 6 months amortization schedule with corresponding upfront payment.',
    pricingModel: 'Number of Devices, Type of Device, Payment Term (One off, amortized), Promo',
    productOwner: 'Afua',
    targetSegments: ['Large Enterprise', 'SME', 'Public Sector'],
    technicalRequirements: ['Corporate credit assessment approval', 'Direct debit / standing order agreement'],
    status: 'Active',
    iconName: 'TabletSmartphone',
    keyFeatures: ['Enterprise smartphone & tablet fleet provisioning', 'Flexible 6/9/12 month financing', 'Warranty and device replacement support'],
    slaOptions: ['Manufacturer Warranty'],
  },
  // ── 14. Dedicated Internet (Fixed) ──
  {
    id: 'PROD-FIXED-DIA',
    name: 'Dedicated Internet',
    serviceType: 'Fixed',
    category: 'Fixed',
    description: 'Dedicated uncontended bandwidth delivered to customer premises via direct connection with fiber, radio or satellite.',
    fullDescription: 'Internet Service with dedicated bandwidth delivered to customer premises via direct connection with fiber, radio or satellite. Solution is postpaid with an MRC payable by customer.',
    pricingModel: 'Medium (Direct Fiber, GPON Fiber, MW, Satellite), Bandwidth, Location (Installation), Redundancy Requirements, Customer Type (Corporate, ISP, NGP), Number of Sites, Contract Term',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'Multinational', 'Public Sector'],
    technicalRequirements: ['Direct Fiber / GPON / MW Link', 'Managed CPE Router', 'Static Public IP block'],
    status: 'Active',
    iconName: 'Globe',
    keyFeatures: ['1:1 uncontended symmetrical bandwidth', 'Guaranteed carrier-grade SLA', '24/7 proactive NOC monitoring', 'Static IP addresses included'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.5%)'],
  },
  // ── 15. Fiber Broadband for Business (Fixed) ──
  {
    id: 'PROD-FIXED-FIBERBIZ',
    name: 'Fiber Broadband for Business',
    serviceType: 'Fixed',
    category: 'Fixed',
    description: 'High-speed shared bandwidth delivered to customer premises via direct fiber connection with prepaid and postpaid options.',
    fullDescription: 'Internet Service with shared bandwidth delivered to customer premises via direct connection with fiber. Solution is both prepaid and postpaid.',
    pricingModel: 'Fixed Pricing (Different packages)',
    productOwner: 'Eunice',
    targetSegments: ['SME', 'Large Enterprise'],
    technicalRequirements: ['MTN Fiber coverage area', 'Optical Network Terminal (ONT) & Wi-Fi Router'],
    status: 'Active',
    iconName: 'Zap',
    keyFeatures: ['Ultra-fast fiber connectivity up to 100Mbps', 'Prepaid & postpaid flexibility', 'Unlimited & capped data bundle tiers'],
    slaOptions: ['Gold (99.0%)'],
  },
  // ── 16. Fixed Voice (Converged) ──
  {
    id: 'PROD-CONV-FIXVOICE',
    name: 'Fixed Voice',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Enterprise VOIP voice solution provided as an add-on to fixed broadband connectivity services.',
    fullDescription: 'A VOIP solution provided as an addon to broadband services, providing landline numbers with crystal-clear voice clarity.',
    pricingModel: 'Fixed Pricing (Monthly line charge + call tariffs)',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'SME'],
    technicalRequirements: ['Broadband connection', 'IP Phone or Voice Gateway (ATA)'],
    status: 'Active',
    iconName: 'PhoneCall',
    keyFeatures: ['Fixed landline number (030xxxxxxx)', 'Discounted enterprise call rates', 'Add-on to existing broadband link'],
    slaOptions: ['Gold (99.5%)'],
  },
  // ── 17. Global MPLS (Fixed) ──
  {
    id: 'PROD-FIXED-GLBMPLS',
    name: 'Global MPLS',
    serviceType: 'Fixed',
    category: 'Fixed',
    description: 'Wide Area Connectivity Service with dedicated bandwidth interconnecting headquarters and international branch offices outside Ghana.',
    fullDescription: 'Wide Area Connectivity Service with dedicated bandwidth delivered to customer premises (Head Office & Branch) via direct connection with fiber, radio or satellite. This interconnects all of customers locations for resource sharing and involves international transit for customers with head office or branch(es) outside of Ghana. Solution is postpaid with an MRC payable by customer.',
    pricingModel: 'Medium (Direct Fiber, GPON Fiber, MW, Satellite), Bandwidth, Number of branches, Location of head office and branches (Installation, International Transit), Redundancy Requirements, Contract Term',
    productOwner: 'Eunice',
    targetSegments: ['Multinational', 'Large Enterprise'],
    technicalRequirements: ['Direct Fiber / Subsea Cable transit', 'Managed MPLS Edge Routers', 'BGP Routing Configuration'],
    status: 'Active',
    iconName: 'Network',
    keyFeatures: ['Global reach via MTN GlobalConnect', 'End-to-end QoS prioritization', 'Symmetrical dedicated international transit', 'Single SLA and support desk across countries'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.5%)'],
  },
  // ── 18. Hosted PBX (Converged) ──
  {
    id: 'PROD-CONV-HPBX',
    name: 'Hosted PBX',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Cloud VOIP solution delivering voice, conferencing, and collaboration capabilities via an MTN Hosted platform.',
    fullDescription: 'A VOIP solution that delivers voice, conferencing and other communication and collaboration capabilities to customers via an MTN Hosted platform without on-premise PBX hardware.',
    pricingModel: 'Number of DIDs, Concurrent calls, Extensions, Number of voice calls',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'SME', 'Public Sector'],
    technicalRequirements: ['Broadband / DIA connectivity', 'SIP IP Phones / Softphones on PC & Mobile'],
    status: 'Active',
    iconName: 'PhoneForwarded',
    keyFeatures: ['Cloud switchboard with auto-attendant', 'Extension dialing across branches', 'Call recording & voicemail to email', 'Zero hardware maintenance'],
    slaOptions: ['Platinum (99.9%)', 'Gold (99.5%)'],
  },
  // ── 19. Groupshare (Mobile) ──
  {
    id: 'PROD-MOB-GROUPSHARE',
    name: 'Groupshare',
    serviceType: 'Mobile',
    category: 'Mobile',
    description: 'Bulk mobile data solution that allows businesses and unions to disburse data to employees and union members.',
    fullDescription: 'A bulk mobile data solution that allows businesses and unions to disburse to employees and union members seamlessly from a central corporate wallet.',
    pricingModel: 'Fixed Pricing (Volume data bundle tiers)',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'SME', 'Public Sector'],
    technicalRequirements: ['MTN Corporate Account', 'Employee / Member MSISDN database'],
    status: 'Active',
    iconName: 'Share2',
    keyFeatures: ['Centralized data allocation management', 'Scheduled or on-demand distribution', 'Real-time usage tracking per member'],
    slaOptions: ['Standard Mobile SLA (99.0%)'],
  },
  // ── 20. IVR (Converged) ──
  {
    id: 'PROD-CONV-IVR',
    name: 'IVR',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Hosted Interactive Voice Response solution that builds and routes automated call trees for businesses.',
    fullDescription: 'A hosted solution that builds and routes IVR trees for businesses, enabling automated customer self-service, routing to agent queues, and multi-lingual voice prompts.',
    pricingModel: 'Number of recordings & IVR tree branches',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'SME', 'Public Sector'],
    technicalRequirements: ['MTN Voice Line / SIP Trunk', 'Custom Audio Prompts / Studio Recordings'],
    status: 'Active',
    iconName: 'PhoneIncoming',
    keyFeatures: ['Multi-level voice menu navigation', 'Time-of-day call routing rules', 'Multi-language audio prompts', 'Integration with CRM & call queues'],
    slaOptions: ['Gold (99.5%)'],
  },
  // ── 21. Leased Lines (Fixed) ──
  {
    id: 'PROD-FIXED-LEASEDLINES',
    name: 'Leased Lines',
    serviceType: 'Fixed',
    category: 'Fixed',
    description: 'Dedicated point-to-point Wide Area Connectivity Service interconnecting head offices and branches for internal resource sharing.',
    fullDescription: 'Wide Area Connectivity Service with dedicated bandwidth delivered to customer premises (Head Office & Branch) via direct connection with fiber, radio or satellite. This interconnects all of customers locations for resource sharing. Solution is postpaid with an MRC payable by customer.',
    pricingModel: 'Medium (Direct Fiber, GPON Fiber, MW, Satellite), Bandwidth, Number of branches, Location of head office and branches (Installation), Redundancy Requirements, Customer Type (Metro, Inter-Regional), Contract Term',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'Public Sector', 'Multinational'],
    technicalRequirements: ['Point-to-point Fiber / MW termination', 'Managed Demarcation Device / NTU'],
    status: 'Active',
    iconName: 'Waypoints',
    keyFeatures: ['Dedicated uncontended point-to-point circuit', 'Low latency inter-branch data transport', 'Layer 2 / Layer 3 transparent routing', 'High-availability path protection'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.5%)'],
  },
  // ── 22. Managed Services (Converged) ──
  {
    id: 'PROD-CONV-MGDSRV',
    name: 'Managed Services',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Curated bespoke solution to manage networking, IT support and operations for enterprise businesses.',
    fullDescription: 'A solution that curates bespoke requirements to manage the Networking/IT support and operations for businesses. Solution is postpaid with an MRC payable by customer. This can be an addon to an existing service.',
    pricingModel: 'As per customer requirements (Monthly SLA & support scope)',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'Multinational', 'Public Sector'],
    technicalRequirements: ['Network audit & asset inventory', 'SLA agreement & escalation matrix'],
    status: 'Active',
    iconName: 'Wrench',
    keyFeatures: ['24/7/365 proactive NOC monitoring', 'On-site & remote IT engineer support', 'Preventive hardware maintenance', 'Monthly operational reporting'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.9%)'],
  },
  // ── 23. Professional Services (Converged) ──
  {
    id: 'PROD-CONV-PROFSRV',
    name: 'Professional Services',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Bespoke, one-time project-based solution for customer requirements relating to IT infrastructure and networking.',
    fullDescription: 'A bespoke, one time project-based solution to customer requirements relating to Networking/IT. This can be an addon to an existing service, covering audits, migrations, and architecture design.',
    pricingModel: 'As per customer requirements (Scope of Work / Milestones)',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'Multinational', 'Public Sector'],
    technicalRequirements: ['Agreed Statement of Work (SoW)', 'Project charter & milestone plan'],
    status: 'Active',
    iconName: 'Briefcase',
    keyFeatures: ['Network architecture & security auditing', 'Data center migration consulting', 'Turnkey cabling & infrastructure deployment', 'Vendor-certified IT architects'],
    slaOptions: ['Project Milestone SLA'],
  },
  // ── 24. Security (Converged) ──
  {
    id: 'PROD-CONV-SEC',
    name: 'Security',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Network and application security for enterprise customers including DNS Filtering, Managed Firewall, WAF, and DDoS Protection.',
    fullDescription: 'A solution to provide network and application security to enterprise customers. Solutions include DNS Filtering, Managed Firewall, WAF, etc. in partnership with global cyber leaders such as Cloudflare and Fortinet.',
    pricingModel: 'Type of security solution (Cloudflare, Managed Firewall, etc.), Security Package',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'Multinational', 'Public Sector', 'SME'],
    technicalRequirements: ['Edge Firewall Appliance or Cloud Proxy DNS redirection', 'SSL/TLS certificate installation'],
    status: 'Active',
    iconName: 'ShieldCheck',
    keyFeatures: ['Next-Gen Managed Firewall (NGFW)', 'Web Application Firewall (WAF) & DDoS mitigation', 'DNS content filtering & malware blocking', 'Real-time threat intelligence & SOC alerts'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.9%)'],
  },
  // ── 25. SIP/VOIP (Converged) ──
  {
    id: 'PROD-CONV-SIPVOIP',
    name: 'SIP/VOIP',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Unified communication and collaboration enablement delivering physical or cloud SIP connection to customer IP-PBX systems.',
    fullDescription: "A solution that provides unified communication and collaboration enablement by delivering a connection (physical/cloud) to customer's communication systems.",
    pricingModel: 'Number of DIDs & Concurrent calls, SIP Connectivity Type (Internet, Leased Line), Medium (Direct Fiber, GPON Fiber, MW, Cloud), Location (Installation), Number of voice calls',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'Multinational', 'Public Sector'],
    technicalRequirements: ['Customer IP-PBX / Session Border Controller (SBC)', 'Dedicated Fiber/Data Link or Internet SIP'],
    status: 'Active',
    iconName: 'Radio',
    keyFeatures: ['High-capacity concurrent voice channels (30-1000+ channels)', 'Direct Inward Dialing (DID) blocks', 'Crystal clear HD voice codec support', 'Disaster recovery failover routing'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.5%)'],
  },
  // ── 26. Sponsored Data (Digital) ──
  {
    id: 'PROD-DIG-SPONSDATA',
    name: 'Sponsored Data',
    serviceType: 'Digital',
    category: 'Digital',
    description: 'Reverse billing solution that allows enterprises to pay for data usage when designated apps or websites are used by their customers.',
    fullDescription: 'A reverse billing solution that allows enterprises to pay for data usage when designated applications or websites are used/visited by their customers, driving digital adoption without customer data cost barriers.',
    pricingModel: 'Volume of Data (Tiered Pricing per GB)',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'Public Sector', 'SME'],
    technicalRequirements: ['Customer domain / App URL IP whitelisting', 'MTN Packet Gateway URL routing'],
    status: 'Active',
    iconName: 'Award',
    keyFeatures: ['Zero-rated data access for end users', 'Direct corporate billing per megabyte consumed', 'Real-time traffic analytics dashboard'],
    slaOptions: ['Platinum (99.9%)', 'Gold (99.5%)'],
  },
  // ── 27. Mobile Advertising (Digital) ──
  {
    id: 'PROD-DIG-MOBADV',
    name: 'Mobile Advertising',
    serviceType: 'Digital',
    category: 'Digital',
    description: 'Targeted enterprise mobile messaging and broadcast advertising solutions across subscriber demographics and locations.',
    fullDescription: 'A targeted marketing solution allowing corporate advertisers to reach granular consumer segments based on location, ARPU, device type, and interests via SMS, MMS, and USSD flash messages.',
    pricingModel: 'Volume of SMS (Tiered Pricing)',
    productOwner: 'Eunice',
    targetSegments: ['Large Enterprise', 'SME'],
    technicalRequirements: ['Creative ad copy & target demographic selection', 'Ad regulatory compliance clearance'],
    status: 'Active',
    iconName: 'Megaphone',
    keyFeatures: ['Geo-fenced location targeting', 'Demographic & spend-tier filtering', 'High open rate (>95%)', 'Post-campaign response analytics'],
    slaOptions: ['Campaign Completion SLA'],
  },
  // ── 28. Tertiary Bundle (Mobile) ──
  {
    id: 'PROD-MOB-TERTIARY',
    name: 'Tertiary Bundle',
    serviceType: 'Mobile',
    category: 'Mobile',
    description: 'Subsidized mobile data and voice bundle targeting tertiary institutions like universities and colleges for students and staff.',
    fullDescription: 'A mobile bundle that targets tertiary institutions like universities and colleges, facilitating e-learning, academic research, and campus collaboration with highly subsidized rates.',
    pricingModel: 'Fixed Pricing (Different packages)',
    productOwner: 'Justin',
    targetSegments: ['Public Sector', 'Large Enterprise'],
    technicalRequirements: ['University MOU / Accreditation Agreement', 'Student/Faculty SIM database'],
    status: 'Active',
    iconName: 'GraduationCap',
    keyFeatures: ['Subsidized academic data bundles', 'Whitelisted university portal access', 'Pooled student data allocations'],
    slaOptions: ['Standard Mobile SLA (99.0%)'],
  },
  // ── 29. Toll Free- Mobile (Mobile) ──
  {
    id: 'PROD-MOB-TOLLFREE',
    name: 'Toll Free- Mobile',
    serviceType: 'Mobile',
    category: 'Mobile',
    description: 'Reverse billing solution allowing enterprises to pay for voice calls initiated by their customers to a designated mobile number.',
    fullDescription: 'A reverse billing solution that allows enterprises to pay for calls initiated by their customers to their designated mobile line, removing cost barriers for customer support and sales enquiries.',
    pricingModel: 'Fixed Pricing (Reverse Billing based on inbound call minutes)',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'Public Sector', 'SME'],
    technicalRequirements: ['Designated MTN Mobile Line / Short Code', 'Reverse billing master profile'],
    status: 'Active',
    iconName: 'PhoneForwarded',
    keyFeatures: ['Free inbound calling for mobile customers', 'Detailed call duration itemized billing', 'Routing to single or multiple contact lines'],
    slaOptions: ['Standard (99.5%)'],
  },
  // ── 30. Toll Free- SIP (Converged) ──
  {
    id: 'PROD-CONV-TOLLFREESIP',
    name: 'Toll Free- SIP',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Reverse billing solution allowing enterprises to pay for calls initiated by their customers to their designated VOIP line.',
    fullDescription: 'A reverse billing solution that allows enterprises to pay for calls initiated by their customers to their designated VOIP line, routed directly into enterprise call centers and contact platforms.',
    pricingModel: 'Fixed Pricing (Reverse Billing based on incoming minutes + SIP trunk fee)',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'Public Sector', 'Multinational'],
    technicalRequirements: ['SIP Trunk / IP-PBX Connection', 'Toll-free 0800 / Short Code number allocation'],
    status: 'Active',
    iconName: 'PhoneCall',
    keyFeatures: ['National toll-free number provisioning (0800xxxxxx)', 'Direct SIP termination to contact center', 'Concurrent call capacity scaling'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.5%)'],
  },
  // ── 31. Turbonet Broadband(WTTX)/FWA (Fixed) ──
  {
    id: 'PROD-FIXED-TURBONET',
    name: 'Turbonet Broadband(WTTX)/FWA',
    serviceType: 'Fixed',
    category: 'Fixed',
    description: 'Wireless broadband solution delivering high-speed internet connectivity via the MTN mobile backbone with prepaid packages.',
    fullDescription: 'A wireless broadband solution that delivers internet connectivity via the MTN mobile backbone. Has prepaid packages businesses can subscribe to with high-gain outdoor/indoor routers.',
    pricingModel: 'Fixed Pricing (Different packages)',
    productOwner: 'Justin',
    targetSegments: ['SME', 'Large Enterprise'],
    technicalRequirements: ['4G / 5G LTE coverage area', 'MTN Turbonet Router with external antenna option'],
    status: 'Active',
    iconName: 'Wifi',
    keyFeatures: ['Plug-and-play instant business broadband', 'High-capacity 4G/5G LTE data bundles', 'Connect up to 32 simultaneous office devices', 'Flexible prepaid top-up options'],
    slaOptions: ['Standard Wireless SLA (99.0%)'],
  },
  // ── 32. USSD (Digital) ──
  {
    id: 'PROD-DIG-USSD',
    name: 'USSD',
    serviceType: 'Digital',
    category: 'Digital',
    description: 'Short code routing solution that allows businesses to run interactive menu applications for their customers on any mobile phone.',
    fullDescription: 'A short code routing solution that allows businesses run user applications for their customers. Works across all mobile phone types without requiring internet connectivity or smartphone capabilities.',
    pricingModel: 'Volume of USSD Hits (Tiered Pricing) + Dedicated Short Code Lease',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'SME', 'Public Sector'],
    technicalRequirements: ['Short Code (*xxx#) allocation from NCA', 'HTTPS Callback API endpoint'],
    status: 'Active',
    iconName: 'Hash',
    keyFeatures: ['Universal reach across 100% of mobile phones', 'Zero data requirement for end users', 'Fast session initiation (<2 seconds)', 'Integration with MoMo and core banking'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.9%)'],
  },
  // ── 33. Vehicle Tracking (Converged) ──
  {
    id: 'PROD-CONV-VEHTRACK',
    name: 'Vehicle Tracking',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'IoT telematics solution providing vehicle hardware trackers and data SIMs with internet packages for fleet tracking.',
    fullDescription: 'A solution that provides a vehicle tracker and data SIMs with internet packages for the purpose of tracking, fuel monitoring, geo-fencing, and driver behavior analytics.',
    pricingModel: 'Fixed Pricing (Different packages per vehicle unit)',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'SME', 'Public Sector'],
    technicalRequirements: ['Vehicle tracker device installation', 'MTN IoT SIM with M2M data package'],
    status: 'Active',
    iconName: 'Truck',
    keyFeatures: ['Real-time GPS fleet location tracking', 'Geo-fencing alerts and speed violation monitoring', 'Fuel level sensing & anti-theft immobilization', 'Mobile app & web dashboard for fleet managers'],
    slaOptions: ['Gold (99.5%)'],
  },
  // ── 34. WebWiz (Digital) ──
  {
    id: 'PROD-DIG-WEBWIZ',
    name: 'WebWiz',
    serviceType: 'Digital',
    category: 'Digital',
    description: 'Prepaid solution allowing businesses to create websites or have websites created for them based on their requirements.',
    fullDescription: 'A prepaid solution that allows businesses to create their websites or have websites created for them based on their requirements, complete with domain name, business emails, and hosting.',
    pricingModel: 'Fixed Pricing (Different packages)',
    productOwner: 'Justin',
    targetSegments: ['SME', 'Large Enterprise'],
    technicalRequirements: ['Domain name registration (.com / .com.gh)', 'Content and branding assets'],
    status: 'Active',
    iconName: 'Monitor',
    keyFeatures: ['Custom website design & rapid deployment', 'Domain registration & corporate email hosting', 'SEO optimization and mobile responsiveness', 'Integrated MoMo payment gateway option'],
    slaOptions: ['Standard Web SLA (99.5%)'],
  },
  // ── 35. Wi-Fi(Public vs Direct) (Fixed) ──
  {
    id: 'PROD-FIXED-WIFI',
    name: 'Wi-Fi(Public vs Direct)',
    serviceType: 'Fixed',
    category: 'Fixed',
    description: 'Dedicated enterprise Wi-Fi or MTN-managed public Wi-Fi over dedicated bandwidth with access points, switches, and captive portal.',
    fullDescription: 'A solution that delivers Wi-Fi over a medium with dedicated bandwidth, Wireless connectivity such as Switches, Access points, wireless controller. Solution can be one-time project based and handed over to customer where customer pays MRC for bandwidth or solution can be MTN managed where billing packages are created.',
    pricingModel: 'Bandwidth, Number of APs, Installation (One time), Support Requirements, Captive Portal Access',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'Public Sector', 'SME'],
    technicalRequirements: ['Enterprise Wi-Fi Access Points (Cisco/Ruckus)', 'PoE Switch & Managed Gateway', 'Dedicated Internet Bandwidth'],
    status: 'Active',
    iconName: 'Wifi',
    keyFeatures: ['Custom branded captive portal login', 'Enterprise WPA3 security & guest isolation', 'Voucher & SMS OTP authentication', 'Centralized cloud controller management'],
    slaOptions: ['Platinum (99.9%)', 'Gold (99.5%)'],
  },
  // ── 36. Yello Biz/FWA (Converged) ──
  {
    id: 'PROD-CONV-YELLOBIZ',
    name: 'Yello Biz/FWA',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Integrated solution bundling 4G+ Router, Microsoft 365 subscription, Webwiz website, and Fixed voice service for businesses.',
    fullDescription: 'An integrated solution that bundles wireless connectivity, Microsoft 365 subscription, Webwiz and Fixed voice service for businesses. This is a prepaid solution with subscription packages.',
    pricingModel: 'Fixed Pricing (Different packages)',
    productOwner: 'Justin',
    targetSegments: ['SME', 'Large Enterprise'],
    technicalRequirements: ['4G+ wireless coverage', 'MTN Router + MS 365 tenant setup'],
    status: 'Active',
    iconName: 'Layers',
    keyFeatures: ['All-in-one business starter bundle', 'High-speed wireless broadband router', 'Microsoft 365 Business licenses included', 'Professional company website and landline voice'],
    slaOptions: ['Gold (99.0%)'],
  },
  // ── 37. SD WAN (Converged) ──
  {
    id: 'PROD-CONV-SDWAN',
    name: 'SD WAN',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Software-Defined Wide Area Network with intelligent multi-path steering and centralized orchestration for enterprise branches.',
    fullDescription: 'Software-Defined Wide Area Network connecting enterprise branch offices, datacenters and multi-cloud environments with dynamic traffic routing, zero-touch provisioning, and integrated security.',
    pricingModel: 'Medium (Direct Fiber, GPON Fiber, MW, Satellite, Mobile), Ownership type (MTN, Customer Owned), Bandwidth, Number of branches (Additional SD WAN router per branch and HQ), Location of head office and branches, Redundancy Requirements, Customer Type (Corporate, ISP, NGP), Contract Term',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'Multinational', 'Public Sector'],
    technicalRequirements: ['SD-WAN Edge Appliances', 'Underlay WAN links (Fiber/LTE)', 'Central Orchestrator Portal Access'],
    status: 'Active',
    iconName: 'Waypoints',
    keyFeatures: ['Application-aware dynamic path steering', 'Zero-touch remote branch deployment', 'Integrated next-generation security stack', 'Direct cloud SaaS breakout optimization'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.5%)'],
  },
  // ── 38. Starlink (Converged) ──
  {
    id: 'PROD-CONV-STARLINK',
    name: 'Starlink',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Satellite solution delivering high-speed low-latency broadband internet connectivity to businesses in remote locations.',
    fullDescription: 'A satellite solution that delivers internet connectivity to businesses. Ideal for mining, agriculture, maritime, and off-grid remote operations across Ghana.',
    pricingModel: 'Device Ownership Option (Outright, Amortized), Data Package, Installation, Contract Term',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'Public Sector', 'SME'],
    technicalRequirements: ['Clear line-of-sight to open sky', 'Starlink Enterprise Kit (Dish, Mount, Router)', 'Clean AC / Solar Power Supply'],
    status: 'Active',
    iconName: 'Radio',
    keyFeatures: ['High-speed low-earth orbit (LEO) satellite link (up to 220 Mbps)', 'Low latency (25-45ms)', 'Rapid installation anywhere in Ghana', 'Outright or amortized hardware financing'],
    slaOptions: ['Gold (99.0%)'],
  },
  // ── 39. Microsoft 365 (Converged) ──
  {
    id: 'PROD-CONV-M365',
    name: 'Microsoft 365',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Cloud productivity solution delivering Microsoft licenses (Word, Excel, Outlook, Teams, OneDrive) to businesses.',
    fullDescription: 'A productivity solution that delivers Microsoft licenses to businesses, supported with local billing in Ghana Cedis and dedicated enterprise onboarding support from MTN.',
    pricingModel: 'Fixed Pricing (Different license types: Business Basic, Standard, Premium, E3, E5)',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'SME', 'Multinational', 'Public Sector'],
    technicalRequirements: ['Internet connection', 'Microsoft Tenant Domain'],
    status: 'Active',
    iconName: 'Laptop',
    keyFeatures: ['Official Microsoft Cloud Solution Provider (CSP) licensing', 'Local GHS billing without foreign exchange risk', 'Exchange Online business email (50GB+)', 'Teams collaboration, SharePoint & 1TB OneDrive cloud storage'],
    slaOptions: ['Microsoft 99.9% Cloud SLA'],
  },
  // ── 40. Operator Connect (Converged) ──
  {
    id: 'PROD-CONV-OPCONNECT',
    name: 'Operator Connect',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Microsoft solution that allows for Teams calling on the local MTN voice network with direct PSTN dial-in and dial-out.',
    fullDescription: 'A Microsoft solution that allows for teams calling on the local MTN voice network, enabling employees to make and receive external phone calls directly inside Microsoft Teams.',
    pricingModel: 'Number of Users, Package Type (Basic/Plus), Microsoft Teams License, Number of voice calls',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'Multinational'],
    technicalRequirements: ['Microsoft 365 with Teams Phone licenses', 'MTN Operator Connect Tenant linking'],
    status: 'Active',
    iconName: 'Headphones',
    keyFeatures: ['Seamless PSTN calling inside Microsoft Teams app', 'Zero on-premise hardware / SBC required', 'Managed directly from Microsoft 365 Admin Center', 'Carrier-grade voice routing on MTN Ghana network'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.5%)'],
  },
  // ── 41. Virtual PBX (Converged) ──
  {
    id: 'PROD-CONV-VPBX',
    name: 'Virtual PBX',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Cloud-based VOIP solution delivering voice, conferencing and collaboration capabilities via an MTN Hosted platform.',
    fullDescription: 'A VOIP solution that delivers voice, conferencing and other communication and collaboration capabilities to customers via an MTN Hosted platform without on-site hardware investments.',
    pricingModel: 'Number of DIDs, Concurrent calls, Extensions, Number of voice calls',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'SME'],
    technicalRequirements: ['Broadband connectivity', 'SIP-compliant handsets / Softphones'],
    status: 'Active',
    iconName: 'PhoneCall',
    keyFeatures: ['Multi-branch extension dialling', 'Automated receptionist & call hunt groups', 'Voicemail to email and call forwarding', 'Web management portal for administrators'],
    slaOptions: ['Platinum (99.9%)', 'Gold (99.5%)'],
  },
  // ── 42. Call Center (Converged) ──
  {
    id: 'PROD-CONV-CALLCTR',
    name: 'Call Center',
    serviceType: 'Converged',
    category: 'Converged',
    description: 'Cloud contact center solution delivering voice, conferencing, queue management, agent scoring, and CRM integration.',
    fullDescription: 'A VOIP solution that delivers voice, conferencing and other communication and collaboration capabilities to customers via an MTN Hosted platform with omnichannel routing and supervisor monitoring.',
    pricingModel: 'Number of DIDs, Concurrent calls, Extensions, Number of voice calls',
    productOwner: 'Justin',
    targetSegments: ['Large Enterprise', 'Public Sector', 'Multinational'],
    technicalRequirements: ['Broadband / DIA connectivity', 'Agent USB Headsets & PC Softphones'],
    status: 'Active',
    iconName: 'Headphones',
    keyFeatures: ['Skill-based ACD call queuing', 'Real-time supervisor listen-in & whisper', 'Call recording & quality assurance scoring', 'CRM pop-up and ticketing integration'],
    slaOptions: ['Platinum (99.95%)', 'Gold (99.9%)'],
  },
];

// ================================================================
// MTN GHANA ENTERPRISE SEED DATA
// ================================================================
const LINKED_CUSTOMER_SEEDS: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Standard Chartered Bank Ghana PLC',
    tradingName: 'Stanchart Ghana',
    segment: 'Large Enterprise',
    industry: 'Banking & Financial Services',
    primaryContact: {
      id: 'CNT-CUST-001',
      customerId: 'CUST-001',
      name: 'Dr. Kwesi Appiah',
      role: 'Chief Information Officer',
      email: 'kwesi.appiah@sc.com.gh',
      phone: '+233 24 400 1122',
      isPrimary: true,
    },
    accountManager: 'Kwame Mensah',
    accountManagerEmail: 'kwame.mensah@mtn.com.gh',
    status: 'Active',
    activeServicesCount: 2,
    totalValueGHS: 36000,
    ghanaPostGps: 'GA-182-9021',
    location: 'High Street, Airport City, Accra',
    registrationNumber: 'CS1849202021',
    tin: 'C0003928192',
    establishedYear: 1896,
    website: 'https://www.sc.com/gh',
    email: 'info.gh@sc.com',
    phone: '+233 30 266 9688',
    creditRating: 'AAA',
    createdAt: '2025-01-15T00:00:00.000Z',
    address: 'High Street, Airport City, Accra',
    assignedKAM: 'Kwame Mensah',
    contactPerson: 'Dr. Kwesi Appiah',
    customPackageName: 'Dedicated Internet Access 100Mbps',
    customPriceGHS: 36000,
    contractValueGHS: 864000,
    serviceCategory: 'Fixed Connectivity',
  },
  {
    id: 'CUST-002',
    name: 'Newmont Ghana Gold Ltd',
    tradingName: 'Newmont Ghana',
    segment: 'Large Enterprise',
    industry: 'Mining & Natural Resources',
    primaryContact: {
      id: 'CNT-CUST-002',
      customerId: 'CUST-002',
      name: 'Ing. Emmanuel Mensah',
      role: 'Head of ICT Infrastructure & Automation',
      email: 'emmanuel.mensah@newmont.com',
      phone: '+233 24 330 9944',
      isPrimary: true,
    },
    accountManager: 'Afua Asantewaa',
    accountManagerEmail: 'afua.asantewaa@mtn.com.gh',
    status: 'Active',
    activeServicesCount: 1,
    totalValueGHS: 14200,
    ghanaPostGps: 'GA-492-1082',
    location: 'Ahafo & Akyem Mine Sites, Accra Regional HQ',
    registrationNumber: 'CS992012015',
    tin: 'C0009481920',
    establishedYear: 2006,
    website: 'https://www.newmont.com',
    email: 'contactghana@newmont.com',
    phone: '+233 30 274 0800',
    creditRating: 'A',
    createdAt: '2025-06-01T00:00:00.000Z',
    address: 'Ahafo & Akyem Mine Sites, Accra Regional HQ',
    assignedKAM: 'Afua Asantewaa',
    contactPerson: 'Ing. Emmanuel Mensah',
    customPackageName: 'SD-WAN Mining Interconnect 4 Sites',
    customPriceGHS: 14200,
    contractValueGHS: 340800,
    serviceCategory: 'Converged Solutions',
  },
  {
    id: 'CUST-003',
    name: 'Enterprise Insurance Ghana',
    tradingName: 'Enterprise Insurance',
    segment: 'Large Enterprise',
    industry: 'Banking & Financial Services',
    primaryContact: {
      id: 'CNT-CUST-003',
      customerId: 'CUST-003',
      name: 'Akua Osei-Bonsu',
      role: 'VP Digital Systems & Procurement',
      email: 'akua.osei@enterprisegroup.com.gh',
      phone: '+233 24 550 7711',
      isPrimary: true,
    },
    accountManager: 'Justin Kwabena',
    accountManagerEmail: 'justin.kwabena@mtn.com.gh',
    status: 'Active',
    activeServicesCount: 1,
    totalValueGHS: 3800,
    ghanaPostGps: 'GA-019-3382',
    location: 'Enterprise House, High Street, Accra',
    registrationNumber: 'CS339182012',
    tin: 'C0004819201',
    establishedYear: 1924,
    website: 'https://www.enterprisegroup.com.gh',
    email: 'info@enterprisegroup.com.gh',
    phone: '+233 30 266 6847',
    creditRating: 'AA',
    createdAt: '2025-03-01T00:00:00.000Z',
    address: 'Enterprise House, High Street, Accra',
    assignedKAM: 'Justin Kwabena',
    contactPerson: 'Akua Osei-Bonsu',
    customPackageName: 'Hosted PBX Cloud Extensions (40 Users)',
    customPriceGHS: 3800,
    contractValueGHS: 91200,
    serviceCategory: 'Converged Solutions',
  },
];

const INITIAL_SUBSCRIPTIONS_SEED: ServiceSubscription[] = [
  {
    id: 'SUB-FIX-001',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    serviceId: 'PROD-FIXED-DIA',
    serviceName: 'Dedicated Internet Access (DIA)',
    productName: 'Dedicated Internet 100Mbps',
    packageTitle: '100 Mbps Symmetrical CIR Fiber',
    category: 'Fixed',
    status: 'Active',
    startDate: '2025-01-15',
    endDate: '2028-01-14',
    renewalDate: '2027-12-15',
    quantity: 1,
    mrcPriceGHS: 22000,
    otcPriceGHS: 1500,
    currency: 'GHS',
    billingFrequency: 'Monthly Postpaid',
    accountManager: 'Kwame Mensah',
    circuitId: 'MTN-CKT-ACC-0192',
    ipAllocation: '154.160.10.32/29',
    bandwidthMbps: 100,
    location: 'High Street, Airport City, Accra',
    contractRef: 'MTN-CTR-2025-081',
    createdBy: 'Kwame Mensah',
    updatedAt: '2025-01-15',
  },
  {
    id: 'SUB-MOB-002',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    serviceId: 'PROD-MOB-CORPPOST',
    serviceName: 'Corporate Postpaid / CUG Voice & Data',
    productName: 'Executive CUG 120 Lines',
    packageTitle: '120 Pooled SIMs + Unlimited On-Net',
    category: 'Mobile',
    status: 'Active',
    startDate: '2025-02-01',
    endDate: '2027-01-31',
    renewalDate: '2026-12-31',
    quantity: 120,
    mrcPriceGHS: 14000,
    otcPriceGHS: 2400,
    currency: 'GHS',
    billingFrequency: 'Monthly Postpaid',
    accountManager: 'Kwame Mensah',
    circuitId: 'CUG-SCB-9921',
    simCount: 120,
    location: 'Nationwide Staff Fleet',
    contractRef: 'MTN-CTR-2025-082',
    createdBy: 'Kwame Mensah',
    updatedAt: '2025-02-01',
  },
  {
    id: 'SUB-CONV-003',
    customerId: 'CUST-002',
    customerName: 'Newmont Ghana Gold Ltd',
    serviceId: 'PROD-CONV-SDWAN',
    serviceName: 'SD WAN Enterprise Overlay',
    productName: 'SD WAN 4 Mining Sites',
    packageTitle: 'Dual-Path SD WAN with Satellite Backup',
    category: 'Converged',
    status: 'Active',
    startDate: '2025-06-01',
    endDate: '2028-05-31',
    renewalDate: '2028-04-30',
    quantity: 4,
    mrcPriceGHS: 14200,
    otcPriceGHS: 6000,
    currency: 'GHS',
    billingFrequency: 'Monthly Postpaid',
    accountManager: 'Afua Asantewaa',
    circuitId: 'MTN-CKT-9942',
    bandwidthMbps: 50,
    location: 'Ahafo & Akyem Mine Sites',
    contractRef: 'MTN-CTR-2025-219',
    createdBy: 'Afua Asantewaa',
    updatedAt: '2025-06-01',
  },
  {
    id: 'SUB-CONV-004',
    customerId: 'CUST-003',
    customerName: 'Enterprise Insurance Ghana',
    serviceId: 'PROD-CONV-HPBX',
    serviceName: 'Hosted PBX Cloud Extensions',
    productName: 'Hosted PBX (40 Users)',
    packageTitle: '40 Extensions + Cloud IVR Call Hunt',
    category: 'Converged',
    status: 'Active',
    startDate: '2025-03-01',
    endDate: '2027-02-28',
    renewalDate: '2027-01-31',
    quantity: 40,
    mrcPriceGHS: 3800,
    otcPriceGHS: 1200,
    currency: 'GHS',
    billingFrequency: 'Monthly Postpaid',
    accountManager: 'Justin Kwabena',
    circuitId: 'PBX-ENT-3310',
    location: 'Enterprise House, High Street, Accra',
    contractRef: 'MTN-CTR-2025-104',
    createdBy: 'Justin Kwabena',
    updatedAt: '2025-03-01',
  },
];

const INITIAL_NETWORK_CONFIGS_SEED: NetworkConfiguration[] = [
  {
    id: 'NET-CKT-8821',
    serviceId: 'PROD-FIXED-DIA',
    serviceName: 'Dedicated Internet 100Mbps',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    connectionType: 'Direct Dedicated Fiber',
    connectivityType: 'Direct Internet (DIA)',
    bandwidth: '100 Mbps Symmetrical (1:1 CIR)',
    ipAddress: '154.160.10.32/29',
    subnetMask: '255.255.255.248',
    gatewayIp: '154.160.10.33',
    vlanId: 1042,
    accessTechnology: 'DWDM Metro Ring / Cisco ASR 9000 Demarcation',
    routerCPE: 'Cisco Catalyst 8300-2N2S-6T Edge Router',
    installationLocation: 'Server Room 2, 4th Floor, High Street, Accra',
    gpsCoordinates: 'GA-182-9021',
    networkStatus: 'Operational',
    latencyMs: 4.2,
    packetLossPercent: 0.0,
    lastTestedAt: '2026-10-06 08:30 GMT',
    technicalNotes: 'Primary fiber route via Ridge Central Exchange. Dual path protection active.',
    relatedDocName: 'Stanchart_TFR_Final_Design.pdf',
    // Compatibility aliases
    circuitId: 'NET-CKT-8821',
    ipSubnet: '154.160.10.32/29',
    vlan: 1042,
    cpeRouterModel: 'Cisco Catalyst 8300-2N2S-6T Edge Router',
    lastPingLatency: '4.2ms',
  },
  {
    id: 'NET-CKT-9942',
    serviceId: 'PROD-CONV-SDWAN',
    serviceName: 'SD WAN Enterprise Overlay',
    customerId: 'CUST-002',
    customerName: 'Newmont Ghana Gold Ltd',
    connectionType: 'Microwave Radio',
    connectivityType: 'SD-WAN Overlay',
    bandwidth: '50 Mbps Redundant MW + LEO Starlink Backup',
    ipAddress: '154.160.44.16/29',
    subnetMask: '255.255.255.248',
    gatewayIp: '154.160.44.17',
    vlanId: 884,
    accessTechnology: 'SIAE Microelettronica High-Capacity MW & FortiGate 100F SD-WAN',
    routerCPE: 'Fortinet FortiGate 100F SD-WAN Appliance',
    installationLocation: 'Main Datacenter, Ahafo Mining Camp Site A',
    gpsCoordinates: 'GA-492-1082',
    networkStatus: 'Operational',
    latencyMs: 12.8,
    packetLossPercent: 0.0,
    lastTestedAt: '2026-10-06 10:15 GMT',
    technicalNotes: 'Direct microwave hop to Sunyani MTN Node with automated Starlink failover.',
    relatedDocName: 'Newmont_Mining_SDWAN_SLA_Signed.pdf',
    // Compatibility aliases
    circuitId: 'NET-CKT-9942',
    ipSubnet: '154.160.44.16/29',
    vlan: 884,
    cpeRouterModel: 'Fortinet FortiGate 100F SD-WAN Appliance',
    lastPingLatency: '12.8ms',
  },
  {
    id: 'NET-CKT-3312',
    serviceId: 'PROD-CONV-HPBX',
    serviceName: 'Hosted PBX Cloud Extensions',
    customerId: 'CUST-003',
    customerName: 'Enterprise Insurance Ghana',
    connectionType: 'GPON Fiber',
    connectivityType: 'SIP Trunk',
    bandwidth: '20 Mbps Dedicated Voice QoS CIR',
    ipAddress: '154.160.88.20/30',
    subnetMask: '255.255.255.252',
    gatewayIp: '154.160.88.21',
    vlanId: 302,
    accessTechnology: 'Huawei SmartAX GPON & AudioCodes Mediant SBC',
    routerCPE: 'AudioCodes Mediant 500L Session Border Controller',
    installationLocation: 'ICT Server Room, Ground Floor, High Street, Accra',
    gpsCoordinates: 'GA-019-3382',
    networkStatus: 'Operational',
    latencyMs: 5.1,
    packetLossPercent: 0.0,
    lastTestedAt: '2026-10-05 14:20 GMT',
    technicalNotes: 'Dedicated SIP Trunking gateway mapping 40 IP Phone extensions to MTN Softswitch.',
    relatedDocName: 'Enterprise_Insurance_SIP_Trunk_Config.pdf',
    // Compatibility aliases
    circuitId: 'NET-CKT-3312',
    ipSubnet: '154.160.88.20/30',
    vlan: 302,
    cpeRouterModel: 'AudioCodes Mediant 500L Session Border Controller',
    lastPingLatency: '5.1ms',
  },
];

const INITIAL_STANDARD_PRICES_SEED: StandardPriceItem[] = [
  {
    id: 'PRC-STD-001',
    productId: 'PROD-FIXED-DIA',
    productName: 'Dedicated Internet Access (DIA)',
    category: 'Fixed',
    standardPriceGHS: 85,
    setupFeeGHS: 1500,
    billingFrequency: 'Monthly Recurring (MRC)',
    unitType: 'Per Mbps Symmetrical (Min 10 Mbps)',
    effectiveDate: '2025-01-01',
    version: 'v2.4',
    status: 'Approved',
  },
  {
    id: 'PRC-STD-002',
    productId: 'PROD-MOB-CORPPOST',
    productName: 'Corporate Postpaid / CUG Voice & Data',
    category: 'Mobile',
    standardPriceGHS: 110,
    setupFeeGHS: 20,
    billingFrequency: 'Monthly Postpaid',
    unitType: 'Per Corporate SIM / Month',
    effectiveDate: '2025-01-01',
    version: 'v1.8',
    status: 'Approved',
  },
  {
    id: 'PRC-STD-003',
    productId: 'PROD-CONV-SDWAN',
    productName: 'SD WAN Managed Branch Overlay',
    category: 'Converged',
    standardPriceGHS: 3500,
    setupFeeGHS: 1500,
    billingFrequency: 'Monthly Recurring (MRC)',
    unitType: 'Per Branch Site / Month',
    effectiveDate: '2025-01-01',
    version: 'v3.0',
    status: 'Approved',
  },
  {
    id: 'PRC-STD-004',
    productId: 'PROD-CONV-HPBX',
    productName: 'Hosted PBX Cloud Extensions',
    category: 'Converged',
    standardPriceGHS: 95,
    setupFeeGHS: 500,
    billingFrequency: 'Monthly Recurring (MRC)',
    unitType: 'Per Extension / User',
    effectiveDate: '2025-02-01',
    version: 'v2.0',
    status: 'Approved',
  },
];

const INITIAL_CUSTOMER_PRICES_SEED: CustomerSpecificPrice[] = [
  {
    id: 'CSP-2025-001',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    productId: 'PROD-FIXED-DIA',
    productName: 'Dedicated Internet 100Mbps',
    standardPriceGHS: 25000,
    customerPriceGHS: 22000,
    discountPercent: 12.0,
    pricingReason: 'Strategic Tier 1 Banking Account / 3-Year Master Service Agreement',
    contractRef: 'MTN-CTR-2025-081',
    effectiveDate: '2025-01-15',
    expiryDate: '2028-01-14',
    approvalStatus: 'Approved',
    approvedBy: 'Kwame Asante (Chief Enterprise Officer)',
  },
  {
    id: 'CSP-2025-002',
    customerId: 'CUST-002',
    customerName: 'Newmont Ghana Gold Ltd',
    productId: 'PROD-CONV-SDWAN',
    productName: 'SD WAN 4 Mining Sites',
    standardPriceGHS: 16000,
    customerPriceGHS: 14200,
    discountPercent: 11.25,
    pricingReason: 'Multi-site mining operation with bundled redundant microwave backup',
    contractRef: 'MTN-CTR-2025-219',
    effectiveDate: '2025-06-01',
    expiryDate: '2028-05-31',
    approvalStatus: 'Approved',
    approvedBy: 'Afua Asantewaa (Head of Products)',
  },
];

const INITIAL_BILLING_ACCOUNTS_SEED: BillingAccount[] = [
  {
    id: 'DCLM-ACC-99214',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    billingCycle: 'Monthly (1st-30th)',
    currency: 'GHS',
    monthlyRecurringCharges: 36000,
    oneTimePendingCharges: 0,
    currentBalanceGHS: 0,
    status: 'Current',
    lastInvoiceDate: '2026-10-01',
    paymentStatus: 'Paid',
  },
  {
    id: 'DCLM-ACC-77412',
    customerId: 'CUST-002',
    customerName: 'Newmont Ghana Gold Ltd',
    billingCycle: 'Monthly (1st-30th)',
    currency: 'GHS',
    monthlyRecurringCharges: 14200,
    oneTimePendingCharges: 6000,
    currentBalanceGHS: 6000,
    status: 'Current',
    lastInvoiceDate: '2026-10-01',
    paymentStatus: 'Pending',
  },
  {
    id: 'DCLM-ACC-33109',
    customerId: 'CUST-003',
    customerName: 'Enterprise Insurance Ghana',
    billingCycle: 'Monthly (1st-30th)',
    currency: 'GHS',
    monthlyRecurringCharges: 3800,
    oneTimePendingCharges: 0,
    currentBalanceGHS: 3800,
    status: 'Overdue',
    lastInvoiceDate: '2026-09-01',
    paymentStatus: 'Overdue',
  },
];

const INITIAL_INVOICES_SEED: InvoiceRecord[] = [
  {
    id: 'INV-2026-0812',
    billingAccountId: 'DCLM-ACC-99214',
    customerId: 'CUST-001',
    customerName: 'Standard Chartered Bank Ghana PLC',
    period: 'September 2026',
    amountGHS: 36000,
    taxGHS: 7200,
    totalGHS: 43200,
    dueDate: '2026-10-15',
    status: 'Paid',
    paidDate: '2026-10-04',
  },
  {
    id: 'INV-2026-0813',
    billingAccountId: 'DCLM-ACC-77412',
    customerId: 'CUST-002',
    customerName: 'Newmont Ghana Gold Ltd',
    period: 'September 2026',
    amountGHS: 14200,
    taxGHS: 2840,
    totalGHS: 17040,
    dueDate: '2026-10-20',
    status: 'Unpaid',
  },
  {
    id: 'INV-2026-0704',
    billingAccountId: 'DCLM-ACC-33109',
    customerId: 'CUST-003',
    customerName: 'Enterprise Insurance Ghana',
    period: 'August 2026',
    amountGHS: 3800,
    taxGHS: 760,
    totalGHS: 4560,
    dueDate: '2026-09-15',
    status: 'Overdue',
  },
];

const INITIAL_AUDIT_LOGS_SEED: AuditLogEntry[] = [
  {
    id: 'AUD-2026-1092',
    user: 'Justin Boateng',
    userRole: 'Super Admin',
    action: 'CREATE',
    module: 'Technical Network',
    recordName: 'Standard Chartered Bank Ghana PLC',
    recordId: 'NET-CKT-8821',
    timestamp: '2026-10-06 14:32:00',
    details: 'Dedicated circuit BGP peering validated and 100Mbps symmetric throughput configured.',
    oldValue: 'Draft',
    newValue: 'Operational',
    ipAddress: '197.251.18.42',
  },
  {
    id: 'AUD-2026-1091',
    user: 'Kwame Asante',
    userRole: 'Chief Enterprise Officer',
    action: 'APPROVE',
    module: 'Commercial Pricing',
    recordName: 'Standard Chartered Bank Ghana PLC',
    recordId: 'CSP-2025-001',
    timestamp: '2026-10-04 11:20:15',
    details: 'Approved 3-Year strategic banking discount rate for 100Mbps Dedicated Internet Access.',
    oldValue: 'Pending Approval',
    newValue: 'Approved',
    ipAddress: '197.251.18.10',
  },
  {
    id: 'AUD-2026-1090',
    user: 'Kwame Mensah',
    userRole: 'Key Account Manager',
    action: 'CREATE',
    module: 'Customer Management',
    recordName: 'Standard Chartered Bank Ghana PLC',
    recordId: 'CUST-001',
    timestamp: '2025-01-15 09:00:00',
    details: 'Enterprise corporate master dossier initialized in EDB repository.',
    ipAddress: '197.251.18.55',
  },
];

const CUSTOMERS_SEEDED_KEY_V2 = 'mtn_hub_customers_seed_v4';

function loadCustomers(): Customer[] {
  const raw = localStorage.getItem(STORAGE_PREFIX + 'customers');
  const existing: Customer[] = raw ? JSON.parse(raw) : [];
  if (!localStorage.getItem(CUSTOMERS_SEEDED_KEY_V2)) {
    localStorage.setItem(CUSTOMERS_SEEDED_KEY_V2, 'true');
    const existingMap = new Map(existing.map((customer) => [customer.id, customer]));
    LINKED_CUSTOMER_SEEDS.forEach((seed) => {
      const current = existingMap.get(seed.id);
      if (!current || !current.tin || current.primaryContact?.name === 'Not provided') {
        existingMap.set(seed.id, { ...seed, ...(current || {}) });
      }
    });
    const merged = Array.from(existingMap.values());
    const finalCustomers = merged.length > 0 ? merged : LINKED_CUSTOMER_SEEDS;
    localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(finalCustomers));
    return finalCustomers;
  }
  return existing.length > 0 ? existing : LINKED_CUSTOMER_SEEDS;
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // 1. Initialize State with localStorage fallback
  const [customers, setCustomers] = useState<Customer[]>(loadCustomers);

  const [products, setProducts] = useState<EnterpriseProduct[]>(() => {
    if (localStorage.getItem(PRODUCTS_SEED_KEY) !== 'true') {
      localStorage.setItem(PRODUCTS_SEED_KEY, 'true');
      localStorage.setItem(STORAGE_PREFIX + 'products', JSON.stringify(MTN_GHANA_PRODUCTS_SEED));
      return MTN_GHANA_PRODUCTS_SEED;
    }
    const saved = localStorage.getItem(STORAGE_PREFIX + 'products');
    return saved ? JSON.parse(saved) : MTN_GHANA_PRODUCTS_SEED;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'leads');
    return saved ? JSON.parse(saved) : [];
  });

  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'opportunities');
    return saved ? JSON.parse(saved) : [];
  });

  const [presales, setPresales] = useState<PresalesRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'presales');
    return saved ? JSON.parse(saved) : [];
  });

  const [documents, setDocuments] = useState<EnterpriseDocument[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'documents');
    return saved ? JSON.parse(saved) : [];
  });

  const [approvals, setApprovals] = useState<EnterpriseApproval[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'approvals');
    return saved ? JSON.parse(saved) : [];
  });

  const [serviceDeliveries, setServiceDeliveries] = useState<ServiceDelivery[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'deliveries');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeServices, setActiveServices] = useState<ActiveService[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'active_services');
    return saved ? JSON.parse(saved) : [];
  });

  const [subscriptions, setSubscriptions] = useState<ServiceSubscription[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'subscriptions');
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTIONS_SEED;
  });

  const [networkConfigs, setNetworkConfigs] = useState<NetworkConfiguration[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'network_configs');
    return saved ? JSON.parse(saved) : INITIAL_NETWORK_CONFIGS_SEED;
  });

  const [standardPrices, setStandardPrices] = useState<StandardPriceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'standard_prices');
    return saved ? JSON.parse(saved) : INITIAL_STANDARD_PRICES_SEED;
  });

  const [customerPrices, setCustomerPrices] = useState<CustomerSpecificPrice[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'customer_prices');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_PRICES_SEED;
  });

  const [billingAccounts, setBillingAccounts] = useState<BillingAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'billing_accounts');
    return saved ? JSON.parse(saved) : INITIAL_BILLING_ACCOUNTS_SEED;
  });

  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES_SEED;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS_SEED;
  });

  const [tasks, setTasks] = useState<EnterpriseTask[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<EnterpriseNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<EnterpriseUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'users');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser] = useState<EnterpriseUser | null>(null);
  const [databaseSyncError, setDatabaseSyncError] = useState<string | null>(null);
  const [databaseSyncing, setDatabaseSyncing] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const hydrationUserRef = useRef<string | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingWritesRef = useRef(0);
  const sharedBaselineRef = useRef<Record<SharedCollection, Map<string, string>>>({
    customers: new Map(),
    subscriptions: new Map(),
    network_configs: new Map(),
    billing_accounts: new Map(),
    invoices: new Map(),
    customer_prices: new Map(),
    documents: new Map(),
    audit_logs: new Map(),
    tasks: new Map(),
  });

  const sharedRecords: Record<SharedCollection, unknown[]> = {
    customers,
    subscriptions,
    network_configs: networkConfigs,
    billing_accounts: billingAccounts,
    invoices,
    customer_prices: customerPrices,
    documents,
    audit_logs: auditLogs,
    tasks,
  };
  const sharedRecordsRef = useRef(sharedRecords);
  sharedRecordsRef.current = sharedRecords;

  const setSharedRecords = (collection: SharedCollection, records: Record<string, unknown>[]) => {
    switch (collection) {
      case 'customers': setCustomers(records as unknown as Customer[]); break;
      case 'subscriptions': setSubscriptions(records as unknown as ServiceSubscription[]); break;
      case 'network_configs': setNetworkConfigs(records as unknown as NetworkConfiguration[]); break;
      case 'billing_accounts': setBillingAccounts(records as unknown as BillingAccount[]); break;
      case 'invoices': setInvoices(records as unknown as InvoiceRecord[]); break;
      case 'customer_prices': setCustomerPrices(records as unknown as CustomerSpecificPrice[]); break;
      case 'documents': setDocuments(records as unknown as EnterpriseDocument[]); break;
      case 'audit_logs': setAuditLogs(records as unknown as AuditLogEntry[]); break;
      case 'tasks': setTasks(records as unknown as EnterpriseTask[]); break;
    }
  };

  const enqueueSharedChanges = (collection: SharedCollection, upserts: Record<string, unknown>[], deletes: string[]) => {
    if (upserts.length === 0 && deletes.length === 0) return;
    pendingWritesRef.current += 1;
    setDatabaseSyncing(true);
    writeQueueRef.current = writeQueueRef.current.then(async () => {
      if (upserts.length > 0) {
        const { error } = await supabase.from('shared_records').upsert(
          upserts.map((data) => ({
            collection,
            id: data.id as string,
            data,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'collection,id' },
        );
        if (error) throw error;
      }
      if (deletes.length > 0) {
        const { error } = await supabase.from('shared_records')
          .delete()
          .eq('collection', collection)
          .in('id', deletes);
        if (error) throw error;
      }
      setDatabaseSyncError(null);
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      setDatabaseSyncError(`Shared customer data could not be saved: ${message}`);
    }).finally(() => {
      pendingWritesRef.current -= 1;
      setDatabaseSyncing(pendingWritesRef.current > 0);
    });
  };

  // 2. Persist to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'opportunities', JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'presales', JSON.stringify(presales));
  }, [presales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'approvals', JSON.stringify(approvals));
  }, [approvals]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'deliveries', JSON.stringify(serviceDeliveries));
  }, [serviceDeliveries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'active_services', JSON.stringify(activeServices));
  }, [activeServices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'network_configs', JSON.stringify(networkConfigs));
  }, [networkConfigs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'standard_prices', JSON.stringify(standardPrices));
  }, [standardPrices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'customer_prices', JSON.stringify(customerPrices));
  }, [customerPrices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'billing_accounts', JSON.stringify(billingAccounts));
  }, [billingAccounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    let active = true;
    hydrationUserRef.current = null;

    if (!user?.id) {
      setDatabaseReady(false);
      setDatabaseSyncing(false);
      return () => { active = false; };
    }

    setDatabaseReady(false);
    setDatabaseSyncing(true);
    setDatabaseSyncError(null);
    void (async () => {
      const data: { collection: string; id: string; data: unknown }[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data: page, error } = await supabase
          .from('shared_records')
          .select('collection,id,data')
          .range(offset, offset + 999);
        if (error) throw error;
        data.push(...(page || []));
        if (!page || page.length < 1000) break;
      }
      if (!active) return;

      const remoteByCollection: Record<SharedCollection, Map<string, Record<string, unknown>>> = {
        customers: new Map(),
        subscriptions: new Map(),
        network_configs: new Map(),
        billing_accounts: new Map(),
        invoices: new Map(),
        customer_prices: new Map(),
        documents: new Map(),
        audit_logs: new Map(),
        tasks: new Map(),
      };
      for (const row of data || []) {
        if (!SHARED_COLLECTIONS.includes(row.collection as SharedCollection)) continue;
        const collection = row.collection as SharedCollection;
        if (!isValidSharedRecord(collection, row.data) || row.id !== row.data.id) continue;
        remoteByCollection[collection].set(row.id, row.data);
      }

      const seededIds: Record<SharedCollection, Set<string>> = {
        customers: new Set(LINKED_CUSTOMER_SEEDS.map((item) => item.id)),
        subscriptions: new Set(INITIAL_SUBSCRIPTIONS_SEED.map((item) => item.id)),
        network_configs: new Set(INITIAL_NETWORK_CONFIGS_SEED.map((item) => item.id)),
        billing_accounts: new Set(INITIAL_BILLING_ACCOUNTS_SEED.map((item) => item.id)),
        invoices: new Set(INITIAL_INVOICES_SEED.map((item) => item.id)),
        customer_prices: new Set(INITIAL_CUSTOMER_PRICES_SEED.map((item) => item.id)),
        documents: new Set(),
        audit_logs: new Set(INITIAL_AUDIT_LOGS_SEED.map((item) => item.id)),
        tasks: new Set(),
      };
      const localRecords = sharedRecordsRef.current;
      const knownCustomerIds = new Set(remoteByCollection.customers.keys());
      const localCustomers = localRecords.customers.filter((item): item is Record<string, unknown> & { id: string } =>
        isValidSharedRecord('customers', item) && !seededIds.customers.has(item.id)
          && !remoteByCollection.customers.has(item.id));
      localCustomers.forEach((customer) => knownCustomerIds.add(customer.id));

      for (const collection of SHARED_COLLECTIONS) {
        const remote = remoteByCollection[collection];
        const localOnly = localRecords[collection].filter((item): item is Record<string, unknown> & { id: string } => {
          if (!isValidSharedRecord(collection, item) || seededIds[collection].has(item.id) || remote.has(item.id)) {
            return false;
          }
          if (collection !== 'customers' && collection !== 'documents' && collection !== 'audit_logs' && collection !== 'tasks') {
            return typeof item.customerId === 'string' && knownCustomerIds.has(item.customerId);
          }
          if (collection === 'documents' && item.customerId) {
            return typeof item.customerId === 'string' && knownCustomerIds.has(item.customerId);
          }
          return true;
        });
        const merged = [...remote.values(), ...localOnly];
        sharedBaselineRef.current[collection] = new Map(
          Array.from(remote.entries()).map(([id, record]) => [id, serializeRecord(record)]),
        );
        setSharedRecords(collection, merged);
      }
      hydrationUserRef.current = user.id;
      setDatabaseReady(true);
      setDatabaseSyncing(false);
    })().catch((error: unknown) => {
      if (!active) return;
      const message = error instanceof Error ? error.message : String(error);
      setDatabaseSyncError(`Shared customer data could not be loaded. Apply the Supabase shared-records migration and verify authenticated table access. ${message}`);
      setDatabaseSyncing(false);
    });

    return () => { active = false; };
  // The state values are read through this render's closure so local entries made while loading are merged.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || hydrationUserRef.current !== user.id) return;
    for (const collection of SHARED_COLLECTIONS) {
      const current = sharedRecords[collection].filter((item): item is Record<string, unknown> & { id: string } =>
        isValidSharedRecord(collection, item));
      const next = new Map(current.map((record) => [record.id, serializeRecord(record)]));
      const baseline = sharedBaselineRef.current[collection];
      const upserts = current.filter((record) => baseline.get(record.id) !== next.get(record.id));
      const deletes = Array.from(baseline.keys()).filter((id) => !next.has(id));
      sharedBaselineRef.current[collection] = next;
      enqueueSharedChanges(collection, upserts, deletes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, customers, subscriptions, networkConfigs, billingAccounts, invoices, customerPrices, documents, auditLogs, tasks]);

  useEffect(() => {
    if (!user?.id) return;
    const mergeRealtimeRecord = (collection: SharedCollection, id: string, record: Record<string, unknown> | null) => {
      const baseline = sharedBaselineRef.current[collection];
      if (record) baseline.set(id, serializeRecord(record));
      else baseline.delete(id);
      const merge = <T extends { id: string }>(previous: T[]): T[] => record
        ? [record as unknown as T, ...previous.filter((item) => item.id !== id)]
        : previous.filter((item) => item.id !== id);
      switch (collection) {
        case 'customers': setCustomers(merge); break;
        case 'subscriptions': setSubscriptions(merge); break;
        case 'network_configs': setNetworkConfigs(merge); break;
        case 'billing_accounts': setBillingAccounts(merge); break;
        case 'invoices': setInvoices(merge); break;
        case 'customer_prices': setCustomerPrices(merge); break;
        case 'documents': setDocuments(merge); break;
        case 'audit_logs': setAuditLogs(merge); break;
        case 'tasks': setTasks(merge); break;
      }
    };

    const channel = supabase
      .channel(`shared-customer-records-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_records' }, (payload) => {
        const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
        if (!SHARED_COLLECTIONS.includes(row.collection as SharedCollection) || typeof row.id !== 'string') return;
        const collection = row.collection as SharedCollection;
        const record = payload.eventType === 'DELETE' ? null : row.data;
        if (record && !isValidSharedRecord(collection, record)) return;
        mergeRealtimeRecord(collection, row.id, record as Record<string, unknown> | null);
      })
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setDatabaseSyncError(`Live shared-record updates are unavailable: ${error?.message || status}`);
        }
      });
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void supabase.from('user_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setDatabaseSyncError(`Task notifications could not be loaded. Apply the task-assignment migration. ${error.message}`);
          return;
        }
        const incoming = (data || []).map(toEnterpriseNotification)
          .filter((notification): notification is EnterpriseNotification => notification !== null);
        setNotifications((previous) => {
          const incomingIds = new Set(incoming.map((notification) => notification.id));
          return [...incoming, ...previous.filter((notification) =>
            (!notification.recipientId || notification.recipientId === user.id) && !incomingIds.has(notification.id))];
        });
      });

    const channel = supabase
      .channel(`task-notifications-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_notifications',
        filter: `recipient_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const deletedId = String(payload.old.id || '');
          setNotifications((previous) => previous.filter((notification) => notification.id !== deletedId));
          return;
        }
        const incoming = toEnterpriseNotification(payload.new);
        if (!incoming) return;
        setNotifications((previous) => [incoming, ...previous.filter((notification) => notification.id !== incoming.id)]);
      })
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setDatabaseSyncError(`Live task notifications are unavailable: ${error?.message || status}`);
        }
      });
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ==========================================
  // HELPER: MANUAL COMPANY NAME RESOLVER
  // ==========================================
  const getOrCreateCustomerByName = (
    companyName: string,
    segment: CustomerSegment = 'Large Enterprise',
    industry: string = 'General Corporate'
  ): Customer => {
    const trimmed = companyName.trim();
    if (!trimmed) throw new Error('Company name is required.');

    const existing = customers.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() || (c.tradingName && c.tradingName.toLowerCase() === trimmed.toLowerCase())
    );

    if (existing) {
      return existing;
    }

    // Create a new Customer record dynamically from manual entry
    const newId = createRecordId('CUST');

    const newCustomer: Customer = {
      id: newId,
      name: trimmed,
      tradingName: trimmed,
      segment,
      industry,
      accountManager: currentUser?.name || 'Kwame Mensah',
      accountManagerEmail: currentUser?.email || 'kwame.mensah@mtn.com.gh',
      status: 'Active',
      activeServicesCount: 0,
      totalValueGHS: 0,
      ghanaPostGps: 'GA-000-2026',
      location: 'Greater Accra, Ghana',
      registrationNumber: `CS${Math.floor(100000000 + Math.random() * 900000000)}`,
      tin: `C${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      establishedYear: new Date().getFullYear(),
      website: `https://www.${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.gh`,
      email: `info@${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.gh`,
      phone: '+233 30 200 0000',
      creditRating: 'A',
      primaryContact: {
        id: createRecordId('CNT'),
        customerId: newId,
        name: `Lead Representative (${trimmed})`,
        role: 'Commercial Contact',
        email: `contact@${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.gh`,
        phone: '+233 24 000 0000',
        isPrimary: true,
      },
      createdAt: new Date().toISOString(),
      address: 'Greater Accra, Ghana',
      assignedKAM: currentUser?.name || 'Kwame Mensah',
      contactPerson: `Lead Representative (${trimmed})`,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  // ==========================================
  // CUSTOMER ACTIONS (CRUD)
  // ==========================================
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'activeServicesCount' | 'totalValueGHS'> & { activeServicesCount?: number; totalValueGHS?: number }): Customer => {
    const newId = createRecordId('CUST');

    const newCustomer: Customer = {
      ...customerData,
      id: newId,
      activeServicesCount: customerData.activeServicesCount ?? 0,
      totalValueGHS: customerData.totalValueGHS ?? 0,
      createdAt: new Date().toISOString(),
      primaryContact: {
        ...customerData.primaryContact,
        customerId: newId,
      },
      address: customerData.location,
      assignedKAM: customerData.accountManager,
      contactPerson: customerData.primaryContact?.name,
    };
    setCustomers((prev) => [newCustomer, ...prev]);

    // Create system notification
    const newNotif: EnterpriseNotification = {
      id: createRecordId('NOTIF'),
      title: 'New Customer Registered',
      message: `${newCustomer.name} was added to the enterprise repository.`,
      category: 'System',
      timestamp: 'Just now',
      read: false,
      link: `/customers/${newCustomer.id}`
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Create audit log entry
    const auditEntry: AuditLogEntry = {
      id: createRecordId('AUD'),
      user: user?.name || 'Authenticated user',
      userRole: user?.accessTier || 'staff',
      action: 'CREATE',
      module: 'Customer Management',
      recordName: newCustomer.name,
      recordId: newCustomer.id,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      details: `Created enterprise customer master record for ${newCustomer.name} (${newCustomer.segment}, ${newCustomer.industry}).`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const newName = updates.name?.trim();
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    if (newName) {
      setSubscriptions((prev) => prev.map((item) => item.customerId === id ? { ...item, customerName: newName } : item));
      setNetworkConfigs((prev) => prev.map((item) => item.customerId === id ? { ...item, customerName: newName } : item));
      setBillingAccounts((prev) => prev.map((item) => item.customerId === id ? { ...item, customerName: newName } : item));
      setInvoices((prev) => prev.map((item) => item.customerId === id ? { ...item, customerName: newName } : item));
      setCustomerPrices((prev) => prev.map((item) => item.customerId === id ? { ...item, customerName: newName } : item));
      setDocuments((prev) => prev.map((item) => item.customerId === id ? { ...item, customerName: newName } : item));
    }

    const auditEntry: AuditLogEntry = {
      id: createRecordId('AUD'),
      user: user?.name || 'Authenticated user',
      userRole: user?.accessTier || 'staff',
      action: 'UPDATE',
      module: 'Customer Management',
      recordName: updates.name || id,
      recordId: id,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      details: `Updated corporate master details for customer ID ${id}.`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  const deleteCustomer = (id: string) => {
    const custToDelete = customers.find(c => c.id === id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setSubscriptions((prev) => prev.filter((item) => item.customerId !== id));
    setNetworkConfigs((prev) => prev.filter((item) => item.customerId !== id));
    setBillingAccounts((prev) => prev.filter((item) => item.customerId !== id));
    setInvoices((prev) => prev.filter((item) => item.customerId !== id));
    setCustomerPrices((prev) => prev.filter((item) => item.customerId !== id));
    setDocuments((prev) => prev.filter((item) => item.customerId !== id));

    const auditEntry: AuditLogEntry = {
      id: createRecordId('AUD'),
      user: user?.name || 'Authenticated user',
      userRole: user?.accessTier || 'staff',
      action: 'DELETE',
      module: 'Customer Management',
      recordName: custToDelete?.name || id,
      recordId: id,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      details: `Removed customer ${custToDelete?.name || id} from enterprise repository.`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  // ==========================================
  // LEAD ACTIONS (CRUD)
  // ==========================================
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt'>): Lead => {
    const newId = `LEAD-2026-${String(leads.length + 1).padStart(3, '0')}`;
    const newLead: Lead = {
      ...leadData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const convertLeadToOpportunity = (leadId: string): Opportunity | null => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;

    // Check or create customer from lead company name
    const customer = getOrCreateCustomerByName(lead.company, lead.segment);

    // Find linked product or default
    const product = products.find((p) => p.id === lead.productId || p.name === lead.productInterest);
    if (!product) return null;

    const newOppId = `OPP-2026-${String(opportunities.length + 1).padStart(3, '0')}`;
    const newOpportunity: Opportunity = {
      id: newOppId,
      title: `${lead.company} — ${product.name} Solution`,
      customerId: customer.id,
      customerName: lead.company,
      productId: product.id,
      productName: product.name,
      category: product.category,
      stage: 'Qualification',
      valueGHS: lead.estimatedValueGHS || 150000,
      mrcGHS: Math.round((lead.estimatedValueGHS || 150000) * 0.08),
      otcGHS: Math.round((lead.estimatedValueGHS || 150000) * 0.2),
      owner: lead.owner || currentUser?.name || '',
      expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: lead.qualification === 'Hot' ? 'High' : 'Medium',
      probability: 40,
      status: 'Open',
      presalesRequired: true,
      description: lead.notes || `Opportunity converted from lead ${lead.id}. Client expressed interest in ${product.name}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update lead status to Converted
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: 'Converted' } : l)));
    // Add opportunity
    setOpportunities((prev) => [newOpportunity, ...prev]);

    // Create notification
    const newNotif: EnterpriseNotification = {
      id: `NOTIF-${Date.now()}`,
      title: 'Lead Converted to Opportunity',
      message: `${lead.company} (${product.name}) converted into opportunity ${newOppId}.`,
      category: 'Opportunity',
      timestamp: 'Just now',
      read: false,
      link: `/opportunities/${newOppId}`
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newOpportunity;
  };

  // ==========================================
  // OPPORTUNITY ACTIONS (CRUD)
  // ==========================================
  const addOpportunity = (oppData: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>): Opportunity => {
    const newId = `OPP-2026-${String(opportunities.length + 1).padStart(3, '0')}`;
    const newOpp: Opportunity = {
      ...oppData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOpportunities((prev) => [newOpp, ...prev]);
    return newOpp;
  };

  const updateOpportunityStage = (id: string, newStage: OpportunityStage) => {
    const opportunity = opportunities.find((item) => item.id === id);
    setOpportunities((prev) =>
      prev.map((opp) => {
        if (opp.id !== id) return opp;
        const isWon = newStage === 'Won';
        const isLost = newStage === 'Lost';
        return {
          ...opp,
          stage: newStage,
          status: isWon ? 'Won' : isLost ? 'Lost' : 'Open',
          probability: isWon ? 100 : isLost ? 0 : opp.probability,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    if (newStage === 'Won' && opportunity && !approvals.some((approval) => approval.opportunityId === id)) {
      const stageOrder: ApprovalStageName[] = [
        'Sales Operations',
        'Credit Control',
        'Quality Assurance',
        'CENO',
        'DCLM',
        'Service Delivery',
      ];
      const now = new Date().toISOString();
      setApprovals((previous) => {
        if (previous.some((approval) => approval.opportunityId === id)) return previous;
        return [{
          id: `APP-2026-${String(previous.length + 1).padStart(3, '0')}`,
          opportunityId: opportunity.id,
          opportunityTitle: opportunity.title,
          customerId: opportunity.customerId,
          customerName: opportunity.customerName,
          productName: opportunity.productName,
          totalValueGHS: opportunity.valueGHS,
          currentStage: stageOrder[0],
          status: 'Pending',
          stages: stageOrder.map((stage, index) => ({
            stageName: stage,
            role: `${stage} Approver`,
            approverName: `${stage} Queue`,
            status: index === 0 ? 'Pending' : 'Waiting',
          })),
          submittedBy: user?.name || 'Enterprise User',
          createdAt: now,
          updatedAt: now,
        }, ...previous];
      });
    }
  };

  const updateOpportunity = (id: string, updates: Partial<Opportunity>) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === id ? { ...opp, ...updates, updatedAt: new Date().toISOString() } : opp))
    );
  };

  const deleteOpportunity = (id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
  };

  // ==========================================
  // PRODUCT ACTIONS (CRUD)
  // ==========================================
  const addProduct = (productData: Omit<EnterpriseProduct, 'id'>): EnterpriseProduct => {
    const newId = `PROD-CUSTOM-${Date.now().toString().slice(-4)}`;
    const newProd: EnterpriseProduct = {
      ...productData,
      id: newId,
    };
    setProducts((prev) => [newProd, ...prev]);
    return newProd;
  };

  const updateProduct = (id: string, updates: Partial<EnterpriseProduct>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // ==========================================
  // PRESALES ACTIONS (CRUD)
  // ==========================================
  const addPresalesRequest = (presalesData: Omit<PresalesRequest, 'id' | 'createdAt'>): PresalesRequest => {
    const newId = `PRE-2026-${String(presales.length + 1).padStart(3, '0')}`;
    const newRequest: PresalesRequest = {
      ...presalesData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setPresales((prev) => [newRequest, ...prev]);

    // Link back to Opportunity
    if (newRequest.opportunityId) {
      updateOpportunity(newRequest.opportunityId, { presalesId: newId, stage: 'Presales' });
    }

    return newRequest;
  };

  const updatePresales = (id: string, updates: Partial<PresalesRequest>) => {
    setPresales((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePresalesRequest = (id: string) => {
    setPresales((prev) => prev.filter((p) => p.id !== id));
  };

  const submitPresalesAssessment = (id: string, assessmentData: Partial<PresalesRequest>) => {
    setPresales((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          ...assessmentData,
          status: 'Completed',
          completedAt: new Date().toISOString(),
        };
      })
    );
  };

  // ==========================================
  // DOCUMENT ACTIONS (CRUD)
  // ==========================================
  const addDocument = (docData: Omit<EnterpriseDocument, 'id' | 'date'>): EnterpriseDocument => {
    const newId = createRecordId('DOC');
    const newDoc: EnterpriseDocument = {
      ...docData,
      id: newId,
      date: new Date().toISOString().split('T')[0],
    };
    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  };

  const updateDocument = (id: string, updates: Partial<EnterpriseDocument>) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // ==========================================
  // APPROVAL ACTIONS (CRUD)
  // ==========================================
  const addApproval = (approvalData: Omit<EnterpriseApproval, 'id' | 'createdAt' | 'updatedAt'>): EnterpriseApproval => {
    const newId = `APP-2026-${String(approvals.length + 1).padStart(3, '0')}`;
    const newApproval: EnterpriseApproval = {
      ...approvalData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setApprovals((prev) => [newApproval, ...prev]);
    return newApproval;
  };

  const updateApproval = (id: string, updates: Partial<EnterpriseApproval>) => {
    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a)));
  };

  const deleteApproval = (id: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  };

  const signApprovalStep = (
    approvalId: string,
    stageName: ApprovalStageName,
    decision: 'Approved' | 'Rejected' | 'Returned',
    comments?: string
  ) => {
    setApprovals((prev) =>
      prev.map((app) => {
        if (app.id !== approvalId) return app;

        const stageOrder: ApprovalStageName[] = [
          'Sales Operations',
          'Credit Control',
          'Quality Assurance',
          'CENO',
          'DCLM',
          'Service Delivery',
        ];

        const currentIdx = stageOrder.indexOf(stageName);

        const updatedStages = app.stages.map((st) => {
          if (st.stageName === stageName) {
            return {
              ...st,
              status: decision,
              comments: comments || st.comments,
              signedAt: new Date().toISOString(),
            };
          }
          return st;
        });

        let nextStage: ApprovalStageName = stageName;
        let overallStatus = app.status;

        if (decision === 'Approved') {
          if (currentIdx < stageOrder.length - 1) {
            nextStage = stageOrder[currentIdx + 1];
            // set next stage to Pending
            const nextStageObj = updatedStages.find((s) => s.stageName === nextStage);
            if (nextStageObj && nextStageObj.status === 'Waiting') {
              nextStageObj.status = 'Pending';
            }
          } else {
            overallStatus = 'Approved';
          }
        } else if (decision === 'Rejected') {
          overallStatus = 'Rejected';
        } else if (decision === 'Returned') {
          overallStatus = 'Returned';
        }

        return {
          ...app,
          currentStage: nextStage,
          status: overallStatus,
          stages: updatedStages,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // ==========================================
  // SERVICE DELIVERY ACTIONS (CRUD)
  // ==========================================
  const addServiceDelivery = (deliveryData: Omit<ServiceDelivery, 'id'>): ServiceDelivery => {
    const newId = `DEL-2026-${String(serviceDeliveries.length + 1).padStart(3, '0')}`;
    const newDel: ServiceDelivery = {
      ...deliveryData,
      id: newId,
    };
    setServiceDeliveries((prev) => [newDel, ...prev]);
    return newDel;
  };

  const updateServiceDelivery = (id: string, updates: Partial<ServiceDelivery>) => {
    setServiceDeliveries((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  };

  const deleteServiceDelivery = (id: string) => {
    setServiceDeliveries((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDeliveryProgress = (id: string, progress: number, milestoneIndex?: number) => {
    setServiceDeliveries((prev) =>
      prev.map((del) => {
        if (del.id !== id) return del;

        let updatedMilestones = [...del.milestones];
        if (milestoneIndex !== undefined && updatedMilestones[milestoneIndex]) {
          updatedMilestones[milestoneIndex] = {
            ...updatedMilestones[milestoneIndex],
            status: progress >= 100 ? 'Completed' : 'In Progress',
          };
        }

        const newStatus = progress >= 100 ? 'Completed' : progress >= 80 ? 'Testing' : 'In Progress';

        return {
          ...del,
          progress,
          status: newStatus,
          milestones: updatedMilestones,
        };
      })
    );
  };

  // ==========================================
  // ACTIVE SERVICE ACTIONS (CRUD)
  // ==========================================
  const addActiveService = (serviceData: Omit<ActiveService, 'id'>): ActiveService => {
    const newId = `SRV-2026-${String(activeServices.length + 1).padStart(3, '0')}`;
    const newSrv: ActiveService = {
      ...serviceData,
      id: newId,
    };
    setActiveServices((prev) => [newSrv, ...prev]);
    return newSrv;
  };

  const updateActiveService = (id: string, updates: Partial<ActiveService>) => {
    setActiveServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteActiveService = (id: string) => {
    setActiveServices((prev) => prev.filter((s) => s.id !== id));
  };

  // ==========================================
  // SUBSCRIPTIONS (CRUD)
  // ==========================================
  const addSubscription = (subData: Omit<ServiceSubscription, 'id' | 'createdBy' | 'updatedAt'>): ServiceSubscription => {
    const newId = createRecordId('SUB');
    const newSub: ServiceSubscription = {
      ...subData,
      id: newId,
      createdBy: currentUser?.name || 'Enterprise Admin',
      updatedAt: new Date().toISOString(),
    };
    setSubscriptions((prev) => [newSub, ...prev]);
    return newSub;
  };

  const updateSubscription = (id: string, updates: Partial<ServiceSubscription>) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  // ==========================================
  // NETWORK CONFIGURATIONS (CRUD)
  // ==========================================
  const addNetworkConfig = (configData: Omit<NetworkConfiguration, 'id'>): NetworkConfiguration => {
    const newId = createRecordId('NET-CKT');
    const newConfig: NetworkConfiguration = {
      ...configData,
      id: newId,
    };
    setNetworkConfigs((prev) => [newConfig, ...prev]);
    return newConfig;
  };

  const updateNetworkConfig = (id: string, updates: Partial<NetworkConfiguration>) => {
    setNetworkConfigs((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const deleteNetworkConfig = (id: string) => {
    setNetworkConfigs((prev) => prev.filter((n) => n.id !== id));
  };

  // ==========================================
  // PRICING (CRUD)
  // ==========================================
  const addStandardPrice = (priceData: Omit<StandardPriceItem, 'id'>): StandardPriceItem => {
    const newId = `PRC-STD-${Date.now().toString().slice(-4)}`;
    const newPrice: StandardPriceItem = {
      ...priceData,
      id: newId,
    };
    setStandardPrices((prev) => [newPrice, ...prev]);
    return newPrice;
  };

  const updateStandardPrice = (id: string, updates: Partial<StandardPriceItem>) => {
    setStandardPrices((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteStandardPrice = (id: string) => {
    setStandardPrices((prev) => prev.filter((p) => p.id !== id));
  };

  const addCustomerPrice = (priceData: Omit<CustomerSpecificPrice, 'id'>): CustomerSpecificPrice => {
    const newId = createRecordId('PRC-CUST');
    const newPrice: CustomerSpecificPrice = {
      ...priceData,
      id: newId,
    };
    setCustomerPrices((prev) => [newPrice, ...prev]);
    return newPrice;
  };

  const updateCustomerPrice = (id: string, updates: Partial<CustomerSpecificPrice>) => {
    setCustomerPrices((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteCustomerPrice = (id: string) => {
    setCustomerPrices((prev) => prev.filter((p) => p.id !== id));
  };

  // ==========================================
  // BILLING & INVOICES (CRUD)
  // ==========================================
  const addBillingAccount = (accountData: Omit<BillingAccount, 'id'>): BillingAccount => {
    const newId = createRecordId('DCLM-ACC');
    const newAccount: BillingAccount = {
      ...accountData,
      id: newId,
    };
    setBillingAccounts((prev) => [newAccount, ...prev]);
    return newAccount;
  };

  const updateBillingAccount = (id: string, updates: Partial<BillingAccount>) => {
    setBillingAccounts((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBillingAccount = (id: string) => {
    setBillingAccounts((prev) => prev.filter((b) => b.id !== id));
    setInvoices((prev) => prev.filter((invoice) => invoice.billingAccountId !== id));
  };

  const addInvoice = (invoiceData: Omit<InvoiceRecord, 'id'>): InvoiceRecord => {
    const newId = createRecordId('INV');
    const newInvoice: InvoiceRecord = {
      ...invoiceData,
      id: newId,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<InvoiceRecord>) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)));
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  // ==========================================
  // AUDIT LOG (ACTION)
  // ==========================================
  const addAuditLog = (logData: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry => {
    const newEntry: AuditLogEntry = {
      ...logData,
      id: createRecordId('AUD'),
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  // ==========================================
  // TASK ACTIONS (CRUD)
  // ==========================================
  const addTask = (taskData: Omit<EnterpriseTask, 'id' | 'createdAt'>): EnterpriseTask => {
    const newId = createRecordId('TSK');
    const newTask: EnterpriseTask = {
      ...taskData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const notifyTaskAssignee = async (task: EnterpriseTask): Promise<void> => {
    const recipientId = task.assignedToUserId;
    if (!recipientId || !/^[0-9a-f-]{36}$/i.test(recipientId)) {
      throw new Error('The selected assignee does not have a registered login account to notify.');
    }
    const { data, error } = await supabase.rpc('create_task_assignment_notification', {
      p_task: task,
      p_notification_id: createRecordId('NOTIF'),
      p_title: 'New task assigned to you',
      p_message: `${user?.name || 'A team member'} assigned you "${task.title}".`,
      p_link: `/tasks?task=${encodeURIComponent(task.id)}`,
    }).single();
    if (error) throw new Error(`The task remains saved locally, but its assignee could not be notified: ${error.message}`);
    const notification = toEnterpriseNotification(data);
    if (!notification) throw new Error('The notification was saved but returned invalid data.');
    setNotifications((previous) => [
      notification,
      ...previous.filter((existing) => existing.id !== notification.id),
    ]);
  };

  const updateTask = (id: string, updates: Partial<EnterpriseTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'Completed' ? 'In Progress' : 'Completed' } : t))
    );
  };

  const importRecords = (
    collection: MutableTransferCollection,
    records: Array<Record<string, unknown>>,
  ): ImportSummary => {
    const summary = { added: 0, updated: 0 };
    const mergeRecords = <T extends { id: string }>(current: T[], incoming: T[]): T[] => {
      const byId = new Map(current.map((record) => [record.id, record]));
      for (const record of incoming) {
        byId.set(record.id, { ...byId.get(record.id), ...record });
      }
      const incomingIds = new Set(incoming.map((record) => record.id));
      return [...incoming.map((record) => byId.get(record.id)!), ...current.filter((record) => !incomingIds.has(record.id))];
    };
    const mergeIntoState = <T extends { id: string }>(
      current: T[],
      incoming: T[],
      setCollection: React.Dispatch<React.SetStateAction<T[]>>,
    ) => {
      const existingIds = new Set(current.map((record) => record.id));
      summary.added += incoming.filter((record) => !existingIds.has(record.id)).length;
      summary.updated += incoming.filter((record) => existingIds.has(record.id)).length;
      setCollection((previous) => mergeRecords(previous, incoming));
    };
    const imported = records.filter((record): record is Record<string, unknown> & { id: string } =>
      isObjectRecord(record) && typeof record.id === 'string' && record.id.trim().length > 0);

    switch (collection) {
      case 'customers':
        mergeIntoState(customers, imported as unknown as Customer[], setCustomers);
        break;
      case 'products':
        mergeIntoState(products, imported as unknown as EnterpriseProduct[], setProducts);
        break;
      case 'leads':
        mergeIntoState(leads, imported as unknown as Lead[], setLeads);
        break;
      case 'opportunities':
        mergeIntoState(opportunities, imported as unknown as Opportunity[], setOpportunities);
        break;
      case 'presales':
        mergeIntoState(presales, imported as unknown as PresalesRequest[], setPresales);
        break;
      case 'documents':
        mergeIntoState(documents, imported as unknown as EnterpriseDocument[], setDocuments);
        break;
      case 'approvals':
        mergeIntoState(approvals, imported as unknown as EnterpriseApproval[], setApprovals);
        break;
      case 'serviceDeliveries':
        mergeIntoState(serviceDeliveries, imported as unknown as ServiceDelivery[], setServiceDeliveries);
        break;
      case 'activeServices':
        mergeIntoState(activeServices, imported as unknown as ActiveService[], setActiveServices);
        break;
      case 'subscriptions':
        mergeIntoState(subscriptions, imported as unknown as ServiceSubscription[], setSubscriptions);
        break;
      case 'networkConfigs':
        mergeIntoState(networkConfigs, imported as unknown as NetworkConfiguration[], setNetworkConfigs);
        break;
      case 'standardPrices':
        mergeIntoState(standardPrices, imported as unknown as StandardPriceItem[], setStandardPrices);
        break;
      case 'customerPrices':
        mergeIntoState(customerPrices, imported as unknown as CustomerSpecificPrice[], setCustomerPrices);
        break;
      case 'billingAccounts':
        mergeIntoState(billingAccounts, imported as unknown as BillingAccount[], setBillingAccounts);
        break;
      case 'invoices':
        mergeIntoState(invoices, imported as unknown as InvoiceRecord[], setInvoices);
        break;
      case 'tasks':
        mergeIntoState(tasks, imported as unknown as EnterpriseTask[], setTasks);
        break;
    }
    return summary;
  };

  // ==========================================
  // USER ACTIONS (CRUD)
  // ==========================================
  const addUser = (userData: Omit<EnterpriseUser, 'id'>): EnterpriseUser => {
    const newId = `USR-${Date.now().toString().slice(-4)}`;
    const newUser: EnterpriseUser = {
      ...userData,
      id: newId,
    };
    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<EnterpriseUser>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // ==========================================
  // NOTIFICATION ACTIONS
  // ==========================================
  const markNotificationAsRead = (id: string) => {
    const notification = notifications.find((item) => item.id === id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (notification?.recipientId && user?.id === notification.recipientId) {
      void supabase.from('user_notifications').update({ read: true })
        .eq('id', id)
        .eq('recipient_id', user.id)
        .then(({ error }) => {
          if (error) setDatabaseSyncError(`Task notification read status could not be saved: ${error.message}`);
        });
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => (
      !n.recipientId || n.recipientId === user?.id ? { ...n, read: true } : n
    )));
    if (user?.id) {
      void supabase.from('user_notifications').update({ read: true })
        .eq('recipient_id', user.id)
        .eq('read', false)
        .then(({ error }) => {
          if (error) setDatabaseSyncError(`Task notification read status could not be saved: ${error.message}`);
        });
    }
  };

  return (
    <AppStateContext.Provider
      value={{
        customers,
        products,
        leads,
        opportunities,
        presales,
        documents,
        approvals,
        serviceDeliveries,
        activeServices,
        subscriptions,
        networkConfigs,
        standardPrices,
        customerPrices,
        billingAccounts,
        invoices,
        auditLogs,
        databaseSyncError,
        databaseSyncing,
        databaseReady,
        importRecords,
        tasks,
        notifications: notifications.filter((notification) =>
          !notification.recipientId || notification.recipientId === user?.id),
        users,
        currentUser,

        getOrCreateCustomerByName,

        addCustomer,
        updateCustomer,
        deleteCustomer,

        addLead,
        updateLead,
        deleteLead,
        convertLeadToOpportunity,

        addOpportunity,
        updateOpportunityStage,
        updateOpportunity,
        deleteOpportunity,

        addProduct,
        updateProduct,
        deleteProduct,

        addPresalesRequest,
        updatePresales,
        deletePresalesRequest,
        submitPresalesAssessment,

        addDocument,
        updateDocument,
        deleteDocument,

        addApproval,
        updateApproval,
        deleteApproval,
        signApprovalStep,

        addServiceDelivery,
        updateServiceDelivery,
        deleteServiceDelivery,
        updateDeliveryProgress,

        addActiveService,
        updateActiveService,
        deleteActiveService,

        addSubscription,
        updateSubscription,
        deleteSubscription,

        addNetworkConfig,
        updateNetworkConfig,
        deleteNetworkConfig,

        addStandardPrice,
        updateStandardPrice,
        deleteStandardPrice,

        addCustomerPrice,
        updateCustomerPrice,
        deleteCustomerPrice,

        addBillingAccount,
        updateBillingAccount,
        deleteBillingAccount,

        addInvoice,
        updateInvoice,
        deleteInvoice,

        addAuditLog,

        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        notifyTaskAssignee,

        addUser,
        updateUser,
        deleteUser,

        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {databaseSyncError && (
        <div role="alert" className="fixed top-3 right-3 z-[100] max-w-xl rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 shadow-lg">
          <p className="font-bold">Shared database synchronization failed</p>
          <p className="mt-1 break-words">{databaseSyncError}</p>
        </div>
      )}
      {children}
    </AppStateContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export function useAppState(): AppStateContextType {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
