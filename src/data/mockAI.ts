/**
 * MTN ENTERPRISE HUB - AI ASSISTANT MOCK RAG SERVICE
 * 
 * Simulates intelligent AI Knowledge Retrieval and Enterprise Workflow Automation.
 * In a future phase, this module connects directly to a Python FastAPI / LangChain RAG backend
 * or Vertex AI / Gemini API with vector embeddings over the PostgreSQL database.
 */

export interface AIResponsePayload {
  text: string;
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

export const SUGGESTED_AI_PROMPTS = [
  "What services are available for mining & resource customers?",
  "Which opportunities are currently awaiting approval?",
  "What documents are required for an enterprise contract signoff?",
  "Recommend a connectivity solution for Apex Universal Bank.",
  "What is the complete MTN Ghana enterprise workflow?",
  "Show me all delayed or in-progress service deliveries."
];

/**
 * Intelligent mock processor matching keywords in the prompt to provide realistic enterprise answers.
 */
export function queryEnterpriseAI(userPrompt: string): AIResponsePayload {
  const query = userPrompt.toLowerCase().trim();

  if (query.includes('mining') || query.includes('goldridge') || query.includes('remote') || query.includes('pit')) {
    return {
      text: `Based on MTN Ghana Enterprise catalogue and customer profile for GoldRidge Resources Ghana PLC (Mining sector):\n\n` +
        `Recommended Solutions:\n` +
        `1. **Starlink for Enterprise (Satellite)**: High-throughput LEO satellite connectivity ideal for exploration sites, pit communication, and remote worker camps outside cellular coverage.\n` +
        `2. **Global MPLS / Leased Lines**: Dedicated, private uncontended link between Takoradi/Tarkwa mine offices and Accra Headquarters.\n` +
        `3. **Private APN (Access Point Name)**: For secure real-time sensor telemetry, fuel monitoring, and heavy hauling truck tracking.\n` +
        `4. **Data Center Colocation**: Secure Tier III hosting in Tema for mining ERP servers with dual 15kVA power feeds.`,
      actionSuggestions: [
        { label: 'View Starlink Details', path: '/products/PROD-CONV-011', badge: 'Satellite' },
        { label: 'View GoldRidge Profile', path: '/customers/CUST-GH-002', badge: 'Mining' },
        { label: 'View Presales Assessment', path: '/presales/PRE-2026-002', badge: 'TFR' }
      ],
      referencedEntities: [
        { type: 'product', name: 'Starlink for Enterprise (Satellite)', id: 'PROD-CONV-011' },
        { type: 'customer', name: 'GoldRidge Resources Ghana PLC', id: 'CUST-GH-002' }
      ]
    };
  }

  if (query.includes('approval') || query.includes('awaiting') || query.includes('ceno') || query.includes('credit')) {
    return {
      text: `Here is the current status of pending approvals in the 6-stage enterprise governance chain:\n\n` +
        `• **Volta Prime Nationwide Logistics (APP-2026-003)**: GHS 180,000 — Currently awaiting **CENO (Chief Enterprise Officer)** executive signoff after Sales Ops, Credit Control, and QA verified the file.\n` +
        `• **Apex Universal Bank SD-WAN (APP-2026-002)**: GHS 420,000 — Currently in **Credit Control** review with analyst Ama Boateng for 45-branch consolidated billing limits.\n\n` +
        `Heritage University (APP-2026-001) is fully **Approved** and has advanced to Service Delivery.`,
      actionSuggestions: [
        { label: 'Open Approvals Desk', path: '/approvals', badge: '2 Pending' },
        { label: 'View Volta Prime Deal', path: '/opportunities/OPP-2026-003' }
      ],
      referencedEntities: [
        { type: 'approval', name: 'APP-2026-003 (Volta Prime)', id: 'APP-2026-003' },
        { type: 'approval', name: 'APP-2026-002 (Apex Bank)', id: 'APP-2026-002' }
      ]
    };
  }

  if (query.includes('document') || query.includes('require') || query.includes('ghana card') || query.includes('compliance')) {
    return {
      text: `Under MTN Ghana EBU standard contracting governance, the following mandatory documents are required before an opportunity can be moved to Closed Won and submitted for internal sign-off:\n\n` +
        `1. **Customer Legal Identification**: Ghana Card of Company Directors / Authorized Signatories.\n` +
        `2. **Business Registration Certificate**: Certificate of Incorporation from Registrar General's Department.\n` +
        `3. **Technology Engagement Form (TEF)**: Scoping document from KAM initiating technical feasibility.\n` +
        `4. **Signed Solution Design & TFR**: Formal customer acceptance of architecture and technical quote.\n` +
        `5. **Proforma Invoice & Bank Payment Advise**: Proof of one-time installation / setup fee deposit.\n` +
        `6. **Master Service Agreement (MSA)**: Executed via Adobe Sign for Credit Control & CENO sign-off.`,
      actionSuggestions: [
        { label: 'Open Document Repository', path: '/documents', badge: '10 Files' },
        { label: 'Upload Document', path: '/documents' }
      ],
      referencedEntities: [
        { type: 'document', name: 'Apex_Bank_Business_Registration_CS849102014.pdf', id: 'DOC-2026-001' }
      ]
    };
  }

  if (query.includes('workflow') || query.includes('process') || query.includes('lifecycle') || query.includes('step')) {
    return {
      text: `The MTN Ghana Enterprise Management Architecture follows a 9-stage end-to-end lifecycle:\n\n` +
        `1. **CUSTOMER**: Master business profile with tax TIN, GPS address, and financial records.\n` +
        `2. **LEAD**: Sourced via CEX, Virtual Sales, or KAM; qualified as Cold, Warm, or Hot.\n` +
        `3. **OPPORTUNITY**: Deals tracked through 8 pipeline stages (New to Closed Won).\n` +
        `4. **PRODUCT / SERVICE**: Matched from official catalogue (Mobile, Fixed, Digital, Converged).\n` +
        `5. **PRESALES & TEF**: Solution architecture, route survey, and Technology Feasibility Report (TFR).\n` +
        `6. **DOCUMENTATION**: Legal verification (Ghana Card, Reg Cert, Signed Solution Design, Payment Advise).\n` +
        `7. **6-TIER APPROVAL**: Sales Ops ➔ Credit Control ➔ QA ➔ CENO ➔ DCLM ➔ Service Delivery.\n` +
        `8. **SERVICE DELIVERY**: Civil works, fiber blowing, circuit commissioning, and UAT.\n` +
        `9. **ACTIVE SERVICE**: Live provisioned circuit in DCLM billing with 24/7 NOC SLA monitoring.`,
      actionSuggestions: [
        { label: 'Explore Dashboard Overview', path: '/dashboard' },
        { label: 'View Pipeline Workflow', path: '/opportunities' }
      ]
    };
  }

  if (query.includes('delivery') || query.includes('progress') || query.includes('heritage') || query.includes('fiber')) {
    return {
      text: `Service Delivery Status Summary:\n\n` +
        `• **Heritage University (DEL-2026-001)**: 90% Completed (Testing Phase). 24-core armored fiber blown into Kumasi campus data center; 48hr RFC 2544 testing ongoing.\n` +
        `• **Volta Prime Logistics (DEL-2026-004)**: 50% Completed (In Progress). 40/80 trucks fitted with GPS trackers and ultrasonic fuel probes.\n` +
        `• **Apex Bank SD-WAN (DEL-2026-002)**: 35% Completed (In Progress). Central FortiManager hub provisioned; 10 Greater Accra branches in staging.\n` +
        `• **GoldRidge Starlink (DEL-2026-003)**: 15% Completed (Planning Phase). Solar power foundations preparing in Tarkwa pit.`,
      actionSuggestions: [
        { label: 'Open Service Delivery Board', path: '/service-delivery', badge: '4 Active' },
        { label: 'View Heritage Project', path: '/service-delivery' }
      ],
      referencedEntities: [
        { type: 'opportunity', name: 'Heritage University 10Gbps Dedicated Fiber Internet', id: 'OPP-2026-004' }
      ]
    };
  }

  // Fallback contextual enterprise response
  return {
    text: `I've analyzed the MTN Ghana Enterprise Central Repository for: "${userPrompt}".\n\n` +
      `You can navigate between customers, opportunities, technical presales, documents, and service delivery records.\n\n` +
      `What specific detail would you like to explore? You can ask about product recommendations, approval stages, active service SLAs, or document compliance.`,
    actionSuggestions: [
      { label: 'Browse Products Catalogue', path: '/products' },
      { label: 'View Active Customers', path: '/customers' },
      { label: 'Review Opportunity Pipeline', path: '/opportunities' }
    ]
  };
}
