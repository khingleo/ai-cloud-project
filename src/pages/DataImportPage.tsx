import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  History, 
  Database,
  ArrowRight,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DataImportPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'templates'>('upload');
  const [importType, setImportType] = useState<'customers' | 'products' | 'subscriptions' | 'pricing'>('customers');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'analyzing' | 'ready' | 'importing' | 'completed' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Sample historical imports
  const [importHistory, setImportHistory] = useState([
    {
      id: 'IMP-2026-089',
      filename: 'MTN_Q3_Enterprise_Accounts_Final.xlsx',
      type: 'Customers & Subscriptions',
      recordsTotal: 142,
      recordsSuccess: 140,
      recordsFailed: 2,
      importedBy: 'Afua Mensah (Admin)',
      timestamp: '2026-10-04 14:22:10',
      status: 'Completed with warnings'
    },
    {
      id: 'IMP-2026-088',
      filename: 'MPLS_CPE_Circuit_Database_Sep2026.csv',
      type: 'Network Configuration',
      recordsTotal: 84,
      recordsSuccess: 84,
      recordsFailed: 0,
      importedBy: 'Justin K. Boateng (Super Admin)',
      timestamp: '2026-09-28 09:15:33',
      status: 'Success'
    },
    {
      id: 'IMP-2026-087',
      filename: 'Approved_Standard_Tariffs_V4.2.xlsx',
      type: 'Standard Pricing Book',
      recordsTotal: 42,
      recordsSuccess: 42,
      recordsFailed: 0,
      importedBy: 'Eunice Aryee (Admin)',
      timestamp: '2026-09-15 16:40:02',
      status: 'Success'
    }
  ]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setUploadedFile(file);
    setImportStatus('analyzing');
    setStatusMessage(`Parsing and validating structure of ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (_e) => {
      setTimeout(() => {
        if (importType === 'customers') {
          const sampleRows = [
            { id: '1', name: 'Absa Bank Ghana Ltd', industry: 'Banking & Financial', segment: 'Enterprise Key Account', manager: 'Afua Mensah', plan: 'Dedicated Internet 100Mbps', price: 'GHS 18,500/mo' },
            { id: '2', name: 'Gold Fields Tarkwa Mine', industry: 'Mining & Natural Resources', segment: 'Large Corporate', manager: 'Justin Boateng', plan: 'MPLS VPN & SD-WAN', price: 'GHS 32,000/mo' },
            { id: '3', name: 'University of Ghana Legon', industry: 'Education', segment: 'Public Sector / EdTech', manager: 'Eunice Aryee', plan: 'Campus WiFi & 1Gbps DIA', price: 'GHS 45,000/mo' }
          ];
          setParsedPreview(sampleRows);
        } else if (importType === 'products') {
          const sampleRows = [
            { id: '1', name: 'MTN SD-WAN Managed Flex', category: 'Fixed Data', pricingModel: 'Tiered Bandwidth', standardPrice: 'GHS 4,200', owner: 'Afua Mensah' },
            { id: '2', name: 'Enterprise Cloud Backup 10TB', category: 'Digital & Cloud', pricingModel: 'Capacity Based', standardPrice: 'GHS 6,500', owner: 'Justin Boateng' }
          ];
          setParsedPreview(sampleRows);
        } else {
          const sampleRows = [
            { id: '1', field1: 'Entry Row A', field2: 'Valid', field3: 'Active', field4: 'GHS 12,000' },
            { id: '2', field1: 'Entry Row B', field2: 'Valid', field3: 'Active', field4: 'GHS 8,400' }
          ];
          setParsedPreview(sampleRows);
        }
        setImportStatus('ready');
        setStatusMessage(`Validated ${file.name}. 3 mock records detected and formatted.`);
      }, 700);
    };

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      // For binary xlsx mock parse
      setTimeout(() => {
        setImportStatus('ready');
        setStatusMessage(`Analyzed Excel workbook "${file.name}". Ready to commit.`);
        setParsedPreview([
          { id: '1', name: 'Fidelity Bank HQ', tier: 'Enterprise Tier 1', region: 'Greater Accra', assignedKAM: 'Afua Mensah' },
          { id: '2', name: 'Stanbic Bank Ridge', tier: 'Enterprise Tier 1', region: 'Greater Accra', assignedKAM: 'Justin Boateng' }
        ]);
      }, 900);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const executeImport = () => {
    setImportStatus('importing');
    setStatusMessage('Committing records to EDB Enterprise Database...');
    setTimeout(() => {
      setImportStatus('completed');
      setStatusMessage(`Successfully imported records from ${uploadedFile?.name || 'Dataset'}!`);
      
      // Prepend to history
      setImportHistory(prev => [
        {
          id: `IMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          filename: uploadedFile?.name || 'Data_Ingest.csv',
          type: importType === 'customers' ? 'Customer Master' : importType === 'products' ? 'Product Catalog' : 'Subscriptions',
          recordsTotal: parsedPreview.length || 12,
          recordsSuccess: parsedPreview.length || 12,
          recordsFailed: 0,
          importedBy: `${currentUser?.name || 'Enterprise User'} (${currentUser?.accessTier || 'staff'})`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          status: 'Success'
        },
        ...prev
      ]);
    }, 1200);
  };

  const downloadSampleTemplate = (type: string) => {
    let headers = '';
    let sample = '';
    if (type === 'customers') {
      headers = 'Organization Name,Contact Person,Email,Phone,Industry,Address,Account Manager,Status,Service Category,Custom Package,Price GHS\n';
      sample = 'Stanbic Bank Ghana,Kwame Asante,k.asante@stanbic.com.gh,+233 24 400 1122,Banking & Financial,Ridge West Accra,Afua Mensah,active,Fixed Data,Dedicated Internet 100Mbps,18500\n';
    } else if (type === 'products') {
      headers = 'Product Name,Category,Pricing Model,Standard Price GHS,Owner,Description\n';
      sample = 'MTN Cyber Defence Managed SOC,Digital & Cloud,Per Endpoint / Monthly,12500,Justin K. Boateng,Real-time security monitoring and automated incident mitigation.\n';
    } else {
      headers = 'Subscription ID,Customer Name,Circuit ID,Bandwidth,Subnet,VLAN,Monthly Charge GHS\n';
      sample = 'SUB-2026-901,AngloGold Ashanti,CIR-ACC-4491,150 Mbps,197.251.18.0/29,VLAN-402,28000\n';
    }

    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MTN_EDB_Template_${type.toUpperCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
              DATA MANAGEMENT CENTER
            </span>
            <span className="text-xs text-gray-500">ETL & Bulk Ingestion Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Excel & CSV Data Import</h1>
          <p className="text-sm text-gray-600 mt-1">
            Import, validate and batch-update customer portfolios, standard price books, subscriptions and network records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('templates')}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-gray-500" />
            Download Templates
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <History className="w-4 h-4 text-gray-500" />
            Import History
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'upload' 
              ? 'border-yellow-500 text-yellow-800 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Import Pipeline
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'history' 
              ? 'border-yellow-500 text-yellow-800 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-4 h-4" />
          Audit & Import History
          <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
            {importHistory.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'templates' 
              ? 'border-yellow-500 text-yellow-800 font-semibold' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Standard Excel/CSV Schemas
        </button>
      </div>

      {/* Upload View */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Ingestion Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Entity Type */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center text-xs font-black">1</span>
                Target Entity Dataset
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'customers', label: 'Customers Master', icon: Database, desc: 'Clients, KAM, Accounts' },
                  { id: 'products', label: 'Products & Tariffs', icon: FileText, desc: 'Services, Models, Base Price' },
                  { id: 'subscriptions', label: 'Subscriptions', icon: FileSpreadsheet, desc: 'Circuits, Fixed/Mobile' },
                  { id: 'pricing', label: 'Customer Pricing', icon: AlertTriangle, desc: 'Discounts, Approvals' }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = importType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setImportType(item.id as any);
                        setUploadedFile(null);
                        setImportStatus('idle');
                        setParsedPreview([]);
                      }}
                      className={`p-3 text-left rounded-lg border transition-all ${
                        isSelected 
                          ? 'border-yellow-500 bg-yellow-50 ring-1 ring-yellow-400 text-gray-900' 
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-yellow-700' : 'text-gray-400'}`} />
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[11px] text-gray-500">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Upload Box */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center text-xs font-black">2</span>
                Upload File (.xlsx, .xls, .csv)
              </h2>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-300 bg-gray-50/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-yellow-100 rounded-full text-yellow-800">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Drag and drop your spreadsheet here, or <label className="text-yellow-700 hover:underline cursor-pointer">browse file<input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={handleFileChange} className="hidden" /></label>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports UTF-8 CSV, Microsoft Excel (.xlsx/.xls) up to 25MB
                </p>

                {uploadedFile && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg shadow-sm text-xs font-medium text-gray-800">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>{uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
                    <button 
                      onClick={() => { setUploadedFile(null); setImportStatus('idle'); setParsedPreview([]); }} 
                      className="ml-2 text-red-500 hover:text-red-700 font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Validation & Preview */}
            {importStatus !== 'idle' && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-yellow-400 text-black flex items-center justify-center text-xs font-black">3</span>
                    Data Validation & Schema Match
                  </h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
                    importStatus === 'ready' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : importStatus === 'completed' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {importStatus === 'analyzing' && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {importStatus === 'ready' && <CheckCircle2 className="w-3 h-3" />}
                    {statusMessage}
                  </span>
                </div>

                {parsedPreview.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 border-b border-gray-200 flex justify-between items-center">
                      <span>Previewing top {parsedPreview.length} extracted records</span>
                      <span className="text-emerald-700 font-semibold">100% Schema Compatibility</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100/75 text-gray-600 font-semibold uppercase tracking-wider">
                          <tr>
                            {Object.keys(parsedPreview[0]).map((key) => (
                              <th key={key} className="px-3 py-2">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {parsedPreview.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              {Object.values(row).map((val: any, j) => (
                                <td key={j} className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => { setUploadedFile(null); setImportStatus('idle'); setParsedPreview([]); }}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={importStatus === 'importing' || importStatus === 'completed'}
                    onClick={executeImport}
                    className={`flex items-center gap-2 px-5 py-2 text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-500 rounded-lg shadow-sm transition-all ${
                      importStatus === 'importing' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {importStatus === 'importing' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Writing to Repository...
                      </>
                    ) : importStatus === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-900" />
                        Import Finished
                      </>
                    ) : (
                      <>
                        Confirm & Import to Repository
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Guidelines & Security */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-amber-600" />
                Enterprise Ingestion Rules
              </h3>
              <ul className="space-y-2.5 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                  <span><strong>No Overwrite:</strong> Historical pricing records will be archived into version history rather than deleted.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                  <span><strong>Automatic Audit:</strong> All batch rows are tagged with user identity: <code>{currentUser?.name || 'Enterprise User'}</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                  <span><strong>Data Quality Checks:</strong> Rows with missing Account Manager or unformatted currency will trigger automated alerts in the Data Quality Center.</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50/70 border border-yellow-200 rounded-xl p-5">
              <h3 className="text-xs font-bold text-yellow-900 uppercase tracking-wider mb-2">
                Quick Download Templates
              </h3>
              <p className="text-xs text-yellow-800 mb-3">
                Pre-configured CSV templates matching MTN Ghana EDB repository fields:
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => downloadSampleTemplate('customers')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-yellow-200 text-xs font-semibold text-gray-800 hover:bg-yellow-100/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Customer Portfolio Template
                  </span>
                  <Download className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button
                  onClick={() => downloadSampleTemplate('products')}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-yellow-200 text-xs font-semibold text-gray-800 hover:bg-yellow-100/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    Product & Tariff Master Template
                  </span>
                  <Download className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History View */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Ingestion Logs & Run History</h2>
              <p className="text-xs text-gray-500">Historical records of all bulk uploads to the EDB repository</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Batch ID</th>
                  <th className="px-4 py-3">Filename</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Records (Total / Success / Failed)</th>
                  <th className="px-4 py-3">Executed By</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {importHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{item.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      {item.filename}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.type}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900">{item.recordsTotal}</span> total | 
                      <span className="text-emerald-700 font-semibold ml-1">{item.recordsSuccess} ok</span> | 
                      <span className={`ml-1 font-semibold ${item.recordsFailed > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                        {item.recordsFailed} failed
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.importedBy}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">{item.timestamp}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        item.status === 'Success' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Templates View */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Customer Master Directory Template',
              format: 'CSV / Excel',
              desc: 'For mass registering corporate clients, key account managers, billing addresses, and initial subscription links.',
              type: 'customers'
            },
            {
              title: 'Approved Tariff & Services Catalog',
              format: 'CSV / Excel',
              desc: 'Official standard catalog for Fixed, Mobile, Converge and Digital offerings with tier descriptions and product ownership.',
              type: 'products'
            },
            {
              title: 'Circuits & Technical Network Map',
              format: 'CSV / Excel',
              desc: 'Circuit IDs, IP subnets, VLAN mappings, bandwidth specifications, and CPE hardware assignments.',
              type: 'subscriptions'
            }
          ].map((t, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <FileSpreadsheet className="w-6 h-6 text-yellow-600" />
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-mono text-[10px] rounded font-bold uppercase">
                    {t.format}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{t.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{t.desc}</p>
              </div>
              <button
                onClick={() => downloadSampleTemplate(t.type)}
                className="flex items-center justify-center gap-2 w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download Sample File
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
