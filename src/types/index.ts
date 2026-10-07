/**
 * MTN ENTERPRISE HUB - CORE DATA TYPES & INTERFACES
 * 
 * This file contains the complete TypeScript data contract for the MTN Ghana Enterprise Hub.
 * In a future phase, these interfaces will directly map to PostgreSQL / Supabase database schemas
 * and REST / GraphQL API response payloads.
 */

// ==========================================
// 1. CUSTOMER & CONTACT MANAGEMENT
// ==========================================

export type CustomerSegment = 'Large Enterprise' | 'SME' | 'Public Sector' | 'Multinational';

export type CustomerStatus = 'Active' | 'Prospect' | 'Suspended' | 'Dormant';

export interface Contact {
  id: string;                    // Maps to contacts.id (UUID in DB)
  customerId: string;            // Foreign key -> customers.id
  name: string;                  // Contact person full name
  role: string;                  // Job title (e.g., Chief Technology Officer, Head of Procurement)
  email: string;                 // Business email address
  phone: string;                 // Ghanaian phone number (+233...)
  isPrimary: boolean;            // Flag for main point of contact
}

export interface Customer {
  id: string;                    // Maps to customers.id (UUID in DB)
  name: string;                  // Company registered legal name
  tradingName?: string;          // Business operating name
  segment: CustomerSegment;      // Enterprise customer categorization
  industry: string;              // Industry vertical (e.g., Banking, Mining, Telecoms, FMCG)
  primaryContact: Contact;       // Embedded main contact person
  accountManager: string;        // Assigned MTN Key Account Manager (KAM)
  accountManagerEmail: string;   // KAM email address
  status: CustomerStatus;        // Operational lifecycle status
  activeServicesCount: number;   // Computed number of live contracted services
  totalValueGHS: number;         // Total annual or monthly contract value in GHS
  ghanaPostGps: string;          // Ghana digital address (e.g. GA-123-4567)
  location: string;              // Physical location (e.g., Airport City, Accra; Kumasi Central)
  registrationNumber: string;    // Registrar General Department registration number (e.g. CS123452021)
  tin: string;                   // Tax Identification Number (TIN)
  establishedYear: number;       // Year business was founded
  website: string;               // Company website
  email: string;                 // Corporate email
  phone: string;                 // Main corporate switchboard
  creditRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'Under Review'; // Credit score for billing approval
  logoUrl?: string;              // Company logo image URL or base64 data URL
  createdAt: string;             // ISO date string

  // Optional convenience / legacy compatibility accessors
  address?: string;              // Alias for location
  assignedKAM?: string;          // Alias for accountManager
  contactPerson?: string;        // Alias for primaryContact.name
  customPackageName?: string;    // Primary package name
  customPriceGHS?: number;       // Negotiated monthly price
  contractValueGHS?: number;     // Total contract value
  serviceCategory?: string;      // Category descriptor
}

// ==========================================
// 2. PRODUCT & SERVICE CATALOGUE
// Grounded in "Enterprise Products (3).xlsx"
// ==========================================

export type ProductCategory = 'Mobile' | 'Fixed' | 'Digital' | 'Converged';

export type ProductStatus = 'Active' | 'Coming Soon' | 'Maintenance';

export interface EnterpriseProduct {
  id: string;                    // Unique product code (e.g. "PROD-MPLS-01")
  name: string;                  // Commercial product name (e.g., "Dedicated Internet", "SD WAN")
  serviceType: string;           // Sub-type / commercial variant
  category: ProductCategory;     // Mobile | Fixed | Digital | Converged (From Excel Sheet 1)
  description: string;           // Core product summary
  fullDescription: string;       // Detailed capability breakdown
  pricingModel: string;          // Pricing structure (Fixed Pricing, Bandwidth Tier, MRC, etc.)
  productOwner: string;          // MTN Product Manager (e.g., Afua, Eunice, Justin from Excel)
  targetSegments: CustomerSegment[]; // Target enterprise segment tier
  technicalRequirements: string[]; // Specs (Medium: Fiber/MW, Bandwidth, DIDs, SIMs, etc.)
  status: ProductStatus;         // Availability state
  iconName: string;              // Lucide icon identifier
  keyFeatures: string[];         // Bullet points of competitive advantages
  slaOptions: string[];          // Service level agreements (e.g. 99.9% Platinum uptime)
  // Compatibility aliases
  standardPriceGHS?: number;
  owner?: string;
  specifications?: string[];
}

// ==========================================
// 3. LEAD & OPPORTUNITY PIPELINE
// Follows MTN Ghana AS-IS Enterprise Workflow
// ==========================================

export type LeadSource = 'CEX' | 'Virtual Sales' | 'Sales Agent' | 'Direct Inbound' | 'KAM Sourced';
export type LeadQualification = 'Hot' | 'Warm' | 'Cold';
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted';

export interface Lead {
  id: string;                    // Maps to leads.id
  leadName: string;              // Name of lead / business prospect
  company: string;               // Company name
  contactPerson: string;         // Name of contact
  email: string;                 // Email address
  phone: string;                 // Phone number
  source: LeadSource;            // Channel through which lead arrived
  productInterest: string;       // Desired enterprise solution
  productId?: string;            // Linked product catalogue ID
  segment: CustomerSegment;      // Customer segment
  owner: string;                 // Assigned Key Account Manager or Line Manager
  qualification: LeadQualification; // Cold, Hot, Warm (from Excel workflow line 7)
  status: LeadStatus;            // Lead status
  estimatedValueGHS: number;     // Projected deal size in GHS
  notes: string;                 // Qualification notes
  createdAt: string;             // ISO date string
}

export type OpportunityStage = 
  | 'New'
  | 'Qualification'
  | 'Discovery'
  | 'Presales'
  | 'Proposal'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Opportunity {
  id: string;                    // Maps to opportunities.id (e.g., "OPP-2026-081")
  title: string;                 // Deal title (e.g., "Ecobank National SD-WAN Interconnect")
  customerId: string;            // Foreign key -> customers.id
  customerName: string;          // Denormalized customer company name
  productId: string;             // Foreign key -> products.id
  productName: string;           // Denormalized product name
  category: ProductCategory;     // Mobile | Fixed | Digital | Converged
  stage: OpportunityStage;       // Current pipeline step
  valueGHS: number;              // Total contract value in GHS
  mrcGHS?: number;               // Monthly Recurring Charge
  otcGHS?: number;               // One-Time Setup Charge
  owner: string;                 // Key Account Manager (KAM)
  expectedCloseDate: string;     // ISO Date
  priority: PriorityLevel;       // Deal urgency
  probability: number;           // Probability percentage (0 - 100%)
  status: 'Open' | 'Won' | 'Lost';
  presalesRequired: boolean;     // Whether Presales & TEF form are needed (Excel line 11)
  presalesId?: string;           // Foreign key -> presales_requests.id
  approvalId?: string;           // Foreign key -> approvals.id
  serviceDeliveryId?: string;    // Foreign key -> service_deliveries.id
  description: string;           // Scope summary
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. PRESALES & TECHNICAL ASSESSMENT
// Technology Engagement Form (TEF) & Feasibility Report (TFR)
// ==========================================

export type PresalesStatus = 'Pending' | 'Assessment' | 'Technical Review' | 'Completed' | 'Returned';

export interface PresalesRequest {
  id: string;                    // e.g. "PRE-2026-004"
  opportunityId: string;         // Linked Opportunity ID
  opportunityTitle: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  assignedTeam: string;          // e.g., "Enterprise IP/MPLS Architecture"
  leadEngineer: string;          // Assigned Solution Architect (e.g. Justin, Eunice)
  status: PresalesStatus;
  dueDate: string;
  customerRequirements: string;  // Functional specifications
  proposedSolution: string;      // Proposed architecture & topology
  technicalRequirements: string[]; // Fiber route, GPON, MW, IP subnetting, Bandwidth
  dependencies: string[];        // Third party peering, power, tower access
  risks: string[];               // Identified project/feasibility risks
  implementationNotes: string;   // Technical notes for Service Delivery team
  tfrDocumentName?: string;      // Technology Feasibility Report file name
  solutionDesignSignOffUrl?: string; // Solution design approval doc
  createdAt: string;
  completedAt?: string;
}

// ==========================================
// 5. DOCUMENT REPOSITORY
// Centralized enterprise repository for compliance & solution docs
// ==========================================

export type DocumentType = 
  | 'Customer Documents'
  | 'Technical Documents'
  | 'Quotations'
  | 'Contracts'
  | 'Business Registration'
  | 'Identification'
  | 'Engagement Forms'
  | 'Solution Designs'
  | 'Other';

export type DocumentStatus = 'Verified' | 'Pending Review' | 'Rejected' | 'Archived';

export interface EnterpriseDocument {
  id: string;                    // Maps to documents.id
  name: string;                  // Display file name (e.g., "Ecobank_TFR_Solution_Design_Signed.pdf")
  type: DocumentType;            // Document category
  customerId?: string;           // Optional link to customer
  customerName?: string;
  opportunityId?: string;        // Optional link to opportunity
  opportunityTitle?: string;
  uploadedBy: string;            // Staff uploader name
  size: string;                  // Human readable file size (e.g., "3.4 MB")
  date: string;                  // Upload date
  status: DocumentStatus;
  fileFormat: 'pdf' | 'docx' | 'xlsx' | 'png' | 'zip';
  version: string;               // e.g., "v1.2"
  // Compatibility aliases
  title?: string;
  category?: string;
  tags?: string[];
}

// ==========================================
// 6. APPROVALS WORKFLOW
// 6-Tier Enterprise Chain: Sales Ops -> CC -> QA -> CENO -> DCLM -> Service Delivery
// ==========================================

export type ApprovalStageName = 
  | 'Sales Operations'
  | 'Credit Control'
  | 'Quality Assurance'
  | 'CENO'
  | 'DCLM'
  | 'Service Delivery';

export type StepStatus = 'Pending' | 'Approved' | 'Rejected' | 'Returned' | 'Waiting';

export interface ApprovalStageStep {
  stageName: ApprovalStageName;  // Step name in the MTN governance hierarchy
  role: string;                  // Role description
  approverName: string;          // Designated approver
  status: StepStatus;            // Step decision state
  comments?: string;             // Audit remarks
  signedAt?: string;             // Timestamp of action
}

export interface EnterpriseApproval {
  id: string;                    // e.g., "APP-2026-039"
  opportunityId: string;
  opportunityTitle: string;
  customerId: string;
  customerName: string;
  productName: string;
  totalValueGHS: number;
  currentStage: ApprovalStageName;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
  stages: ApprovalStageStep[];
  dclmAccountNumber?: string;    // Created by Credit Control / Billing (Excel line 27)
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 7. SERVICE DELIVERY & PROVISIONING
// ==========================================

export type DeliveryStatus = 'Not Started' | 'Planning' | 'In Progress' | 'Testing' | 'Completed' | 'Delayed';

export interface DeliveryMilestone {
  title: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  date: string;
}

export interface ServiceDelivery {
  id: string;                    // e.g., "DEL-2026-015"
  customerId: string;
  customerName: string;
  opportunityId: string;
  opportunityTitle: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  deliveryTeam: string;          // e.g., "Fiber Engineering & Last-Mile"
  projectManager: string;        // Delivery Engineer lead
  startDate: string;
  expectedCompletion: string;
  progress: number;              // 0 to 100 percentage
  status: DeliveryStatus;
  milestones: DeliveryMilestone[];
  siteLocation: string;
  notes: string;
}

// ==========================================
// 8. ACTIVE SERVICES INVENTORY
// Live provisioned services for post-sales management
// ==========================================

export type ServiceHealthStatus = 'Active' | 'Degraded' | 'Suspended' | 'Under Maintenance';

export interface ActiveService {
  id: string;                    // e.g., "SRV-2026-104"
  customerId: string;
  customerName: string;
  serviceName: string;
  category: ProductCategory;
  activationDate: string;
  serviceOwner: string;          // Service Manager
  status: ServiceHealthStatus;
  renewalDate: string;
  mrcGHS: number;                // Monthly recurring revenue
  bandwidthOrCapacity?: string;  // e.g. "100 Mbps Dedicated", "500 SIMs CUG"
  slaTier: 'Platinum (99.9%)' | 'Gold (99.5%)' | 'Silver (99.0%)';
  dclmAccountId: string;         // Billing reference account ID
  ipSubnetOrCircuitId?: string;  // Network Circuit identifier
}

// ==========================================
// 9. TASKS & NOTIFICATIONS
// ==========================================

export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'Overdue';
export type TaskCategory = 'Presales' | 'Sales Ops' | 'Credit Check' | 'Delivery' | 'Customer Care' | 'KAM Followup';

export interface EnterpriseTask {
  id: string;
  title: string;
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  assignedTo: string;
  priority: PriorityLevel;
  dueDate: string;
  status: TaskStatus;
  category: TaskCategory;
  createdAt: string;
}

export interface EnterpriseNotification {
  id: string;
  title: string;
  message: string;
  category: 'Opportunity' | 'Approval' | 'Document' | 'Delivery' | 'Task' | 'System';
  timestamp: string;
  read: boolean;
  link?: string;
}

// ==========================================
// 10. USERS, ROLES & ACCESS
// ==========================================

export type UserRole = 
  | 'Administrator'
  | 'Sales Agent'
  | 'Key Account Manager'
  | 'Segment Manager'
  | 'Presales'
  | 'Finance'
  | 'Sales Operations'
  | 'Credit Control'
  | 'Quality Assurance'
  | 'CENO'
  | 'DCLM'
  | 'Service Delivery';

export interface EnterpriseUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department: string;
  status: 'Active' | 'Away' | 'Inactive';
  lastActive: string;
  phone: string;
}

// ==========================================
// 11. AI CONVERSATION & ASSISTANT
// ==========================================

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionSuggestions?: {
    label: string;
    path: string;
    badge?: string;
  }[];
  referencedEntities?: {
    type: 'customer' | 'opportunity' | 'product' | 'approval' | 'document';
    name: string;
    id: string;
  }[];
}

// ==========================================
// 12. SERVICE SUBSCRIPTIONS (ENTERPRISE REPOSITORY)
// ==========================================

export type SubscriptionStatus = 'Active' | 'Pending Provisioning' | 'Suspended' | 'Expired' | 'Terminated';

export interface ServiceSubscription {
  id: string;                    // e.g. "SUB-FIXED-001"
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  productName: string;
  packageTitle: string;
  category: ProductCategory;     // Fixed | Mobile | Converged | Digital
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  renewalDate: string;
  quantity: number;
  mrcPriceGHS: number;           // Monthly Recurring Charge
  otcPriceGHS: number;           // One Time Charge
  currency: 'GHS' | 'USD';
  billingFrequency: 'Monthly Postpaid' | 'Quarterly' | 'Annual' | 'Prepaid';
  accountManager: string;
  circuitId?: string;
  ipAllocation?: string;
  bandwidthMbps?: number;
  simCount?: number;
  location: string;
  contractRef: string;
  notes?: string;
  createdBy: string;
  updatedAt: string;
  // Compatibility aliases
  packageName?: string;
  monthlyPriceGHS?: number;
}

// ==========================================
// 13. NETWORK CONFIGURATION REPOSITORY
// ==========================================

export type NetworkStatus = 'Operational' | 'Degraded' | 'Configuring' | 'Maintenance' | 'Offline';

export interface NetworkConfiguration {
  id: string;                    // e.g. "NET-CKT-8821"
  serviceId: string;
  serviceName: string;
  customerId: string;
  customerName: string;
  connectionType: 'Direct Dedicated Fiber' | 'GPON Fiber' | 'Microwave Radio' | 'Satellite / Starlink' | '4G/5G LTE' | 'Cloud Cross-Connect';
  connectivityType: 'Point-to-Point' | 'MPLS VPN' | 'Direct Internet (DIA)' | 'SD-WAN Overlay' | 'SIP Trunk';
  bandwidth: string;             // e.g. "100 Mbps Symmetrical"
  ipAddress: string;             // e.g. "154.160.22.45/29"
  subnetMask: string;            // e.g. "255.255.255.248"
  gatewayIp: string;             // e.g. "154.160.22.41"
  vlanId?: number;               // e.g. 1042
  accessTechnology: string;      // e.g. "DWDM / Cisco Carrier Ethernet"
  routerCPE: string;             // e.g. "Cisco Catalyst 8300 Series Edge Router"
  installationLocation: string;  // e.g. "Server Room 2, 4th Floor, Ridge, Accra"
  gpsCoordinates?: string;       // e.g. "GA-182-9021"
  networkStatus: NetworkStatus;
  latencyMs: number;
  packetLossPercent: number;
  lastTestedAt: string;
  technicalNotes: string;
  relatedDocName?: string;
  // Compatibility aliases
  circuitId?: string;
  ipSubnet?: string;
  vlan?: string | number;
  cpeRouterModel?: string;
  lastPingLatency?: string | number;
}

// ==========================================
// 14. COMMERCIAL PRICING & BILLING
// ==========================================

export interface StandardPriceItem {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  standardPriceGHS: number;
  setupFeeGHS: number;
  billingFrequency: string;
  unitType: string;              // e.g. "Per Mbps", "Per SIM / Month", "Per License"
  effectiveDate: string;
  version: string;
  status: 'Approved' | 'Draft' | 'Deprecated';
  // Compatibility aliases
  tier?: string;
  code?: string;
}

export interface CustomerSpecificPrice {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  standardPriceGHS: number;
  customerPriceGHS: number;
  discountPercent: number;
  pricingReason: string;         // e.g. "High volume enterprise discount", "Public Sector MOU"
  contractRef: string;
  effectiveDate: string;
  expiryDate: string;
  approvalStatus: 'Approved' | 'Pending Approval' | 'Rejected';
  approvedBy: string;
}

export interface PriceHistoryRecord {
  id: string;
  productName: string;
  customerName?: string;
  oldPriceGHS: number;
  newPriceGHS: number;
  changedBy: string;
  reason: string;
  changeDate: string;
}

export interface BillingAccount {
  id: string;                    // e.g. "DCLM-ACC-99214"
  customerId: string;
  customerName: string;
  billingCycle: 'Monthly (1st-30th)' | 'Quarterly' | 'Advance Annual';
  currency: 'GHS';
  monthlyRecurringCharges: number;
  oneTimePendingCharges: number;
  currentBalanceGHS: number;
  status: 'Current' | 'Overdue' | 'Suspended';
  lastInvoiceDate: string;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
}

export interface InvoiceRecord {
  id: string;                    // e.g. "INV-2026-0812"
  billingAccountId: string;
  customerId: string;
  customerName: string;
  period: string;                // e.g. "October 2026"
  amountGHS: number;
  taxGHS: number;
  totalGHS: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  paidDate?: string;
}

// ==========================================
// 15. AUDIT & ACTIVITY TRAIL
// ==========================================

export interface AuditLogEntry {
  id: string;
  user: string;
  userRole: string;
  action: string;
  module: string;
  recordName: string;
  recordId: string;
  timestamp: string;
  details?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

// ==========================================
// 16. DATA QUALITY CENTER
// ==========================================

export type QualityIssueSeverity = 'Critical' | 'Warning' | 'Info';

export interface DataQualityIssue {
  id: string;
  module: 'Customer' | 'Subscription' | 'Network' | 'Pricing' | 'Document' | 'Billing';
  title: string;
  description: string;
  recordId: string;
  recordName: string;
  severity: QualityIssueSeverity;
  status: 'Open' | 'Resolved' | 'Ignored';
  detectedAt: string;
  resolutionPath: string;
}
