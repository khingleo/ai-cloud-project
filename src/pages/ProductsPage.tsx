/**
 * MTN ENTERPRISE HUB - PRODUCTS & SERVICES CATALOGUE (FULL CRUD + UPLOAD/IMPORT)
 * 
 * Route: /products
 * Grounded in MTN Ghana Enterprise Business Unit (EBU) product & service portfolio.
 * Features:
 * - "+ Add Product" manual entry modal with enterprise specs & pricing models
 * - "Upload Services / Bulk Import" modal supporting CSV upload, pasted data, preview & sample template
 * - "Export CSV" catalogue downloader
 * - "Edit Product" modal to modify category, owner, technical specs, pricing
 * - "Delete Product" confirmation modal
 * - "Quick View" slide-over drawer with full technical specs and direct 360 link
 * - Category filtering (Fixed, Converged, Digital, Mobile), search, card grid, and table views
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  LayoutGrid,
  List,
  Globe,
  Network,
  Zap,
  Radio,
  Wifi,
  PhoneCall,
  Server,
  Cloud,
  ShieldCheck,
  Laptop,
  Headphones,
  PhoneForwarded,
  Lock,
  Truck,
  Compass,
  Briefcase,
  Wrench,
  MessageSquare,
  Hash,
  Code,
  Award,
  Store,
  Monitor,
  Megaphone,
  Smartphone,
  Share2,
  GraduationCap,
  PhoneIncoming,
  Sprout,
  TabletSmartphone,
  ArrowRight,
  Waypoints,
  PlusCircle,
  Upload,
  Download,
  Edit2,
  Trash2,
  AlertTriangle,
  Eye,
  X,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  Shield,
  Cpu,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import { getCategoryBadge } from '../utils/formatters';
import { exportBrandedTablePdf } from '../utils/exportBrandedPdf';
import type { EnterpriseProduct, ProductCategory, CustomerSegment } from '../types';

// Map icon names to Lucide icons
const ICON_MAP: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Globe, Network, Waypoints, Zap, Radio, Wifi, Layers, PhoneCall,
  Server, Cloud, ShieldCheck, Laptop, Headphones, PhoneForwarded,
  Lock, Truck, Compass, Briefcase, Wrench, MessageSquare, Hash,
  Code, Award, Store, Monitor, Megaphone, Smartphone, Share2,
  GraduationCap, PhoneIncoming, Sprout, TabletSmartphone, Cpu,
};

const SAMPLE_CSV_TEMPLATE = `Product Name,Category,Service Type,Pricing Model,Product Owner,Description,Target Segments,Technical Requirements
MTN Dedicated Internet 100Mbps,Fixed,Dedicated Bandwidth,Tiered MRC based on Bandwidth,Enterprise Solutions,High-speed dedicated symmetrical internet access for corporates.,"Large Enterprise, Multinational","Fiber last-mile, Managed Cisco CPE, Static IPs"
MTN Enterprise Cloud Backup,Digital,Cloud Storage & Disaster Recovery,Per GB / Monthly Tier,Cloud Infrastructure Team,Enterprise automated backup and cloud disaster recovery.,"Large Enterprise, SME, Public Sector","Broadband / DIA connectivity, Client Agent"
MTN Bulk SMS Gateway,Digital,Application-to-Person Messaging,Pay-per-SMS Volume Tiered,Digital Channels,High throughput enterprise SMS gateway with REST API.,"Large Enterprise, SME, Public Sector","HTTPS REST API / SMPP Protocol"
MTN Closed User Group (CUG),Mobile,Voice & Data Bundles,Postpaid Per Line Monthly,Mobile Enterprise Team,Free on-net calls and pooled mobile data for corporate staff.,"Large Enterprise, SME","MTN SIM Cards, Postpaid Master Account"`;

export const ProductsPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Slide-over Quick View State
  const [viewingProduct, setViewingProduct] = useState<EnterpriseProduct | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EnterpriseProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<EnterpriseProduct | null>(null);

  // Manual Add Form states
  const [prodName, setProdName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Fixed');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [pricingModel, setPricingModel] = useState('');
  const [productOwner, setProductOwner] = useState('Enterprise Solutions Architecture');
  const [targetSegmentsText, setTargetSegmentsText] = useState('Large Enterprise, SME');
  const [technicalReqsText, setTechnicalReqsText] = useState('Fiber drop / Microwave link, Managed CPE, Static Public IPs (/29 or /28)');
  const [slaText, setSlaText] = useState('Platinum 99.95%');

  // Upload/Import modal states
  const [uploadText, setUploadText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<Array<Omit<EnterpriseProduct, 'id'>>>([]);
  const [uploadStep, setUploadStep] = useState<'select' | 'preview'>('select');

  const CATEGORIES: { id: string; label: string; count: number }[] = [
    { id: 'ALL', label: 'All Products', count: products.length },
    { id: 'Fixed', label: 'Fixed Connectivity', count: products.filter((p) => p.category === 'Fixed').length },
    { id: 'Converged', label: 'Converged Solutions', count: products.filter((p) => p.category === 'Converged').length },
    { id: 'Digital', label: 'Digital Services', count: products.filter((p) => p.category === 'Digital').length },
    { id: 'Mobile', label: 'Mobile & CUG', count: products.filter((p) => p.category === 'Mobile').length },
  ];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.serviceType.toLowerCase().includes(q) ||
        p.productOwner.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openAddModal = () => {
    setProdName('');
    setCategory('Fixed');
    setServiceType('Dedicated Bandwidth & Internet');
    setDescription('');
    setPricingModel('Tiered Monthly Recurring Charge (MRC) based on Bandwidth (Mbps)');
    setProductOwner('Enterprise Solutions Architecture');
    setTargetSegmentsText('Large Enterprise, SME');
    setTechnicalReqsText('Fiber drop / Microwave link, Managed CPE, Static Public IPs (/29 or /28)');
    setSlaText('Platinum 99.95%');
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: EnterpriseProduct) => {
    setEditingProduct(p);
    setProdName(p.name);
    setCategory(p.category);
    setServiceType(p.serviceType);
    setDescription(p.description);
    setPricingModel(p.pricingModel);
    setProductOwner(p.productOwner);
    setTargetSegmentsText(p.targetSegments.join(', '));
    setTechnicalReqsText(p.technicalRequirements.join(', '));
    setSlaText(p.slaOptions?.[0] || 'Platinum 99.95%');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      showToast('error', 'Validation Error', 'Product name is required.');
      return;
    }

    const segments = targetSegmentsText.split(',').map((s) => s.trim()).filter(Boolean) as CustomerSegment[];
    const techReqs = technicalReqsText.split(',').map((s) => s.trim()).filter(Boolean);

    const newProd = addProduct({
      name: prodName.trim(),
      category,
      serviceType: serviceType.trim() || 'Enterprise Solution',
      description: description.trim() || 'MTN Ghana enterprise product solution.',
      fullDescription: description.trim() || 'MTN Ghana enterprise product solution with carrier-grade SLA guarantee.',
      pricingModel: pricingModel.trim() || 'Contractual MRC + OTC',
      targetSegments: segments.length > 0 ? segments : (['Large Enterprise'] as CustomerSegment[]),
      technicalRequirements: techReqs.length > 0 ? techReqs : ['Fiber/Radio last-mile'],
      productOwner: productOwner.trim() || 'Enterprise Solutions',
      iconName: category === 'Mobile' ? 'Smartphone' : category === 'Digital' ? 'Cloud' : category === 'Converged' ? 'Waypoints' : 'Network',
      status: 'Active',
      keyFeatures: ['Carrier-grade reliability', '24/7 Enterprise NOC monitoring', 'Redundant path protection'],
      slaOptions: [slaText || 'Platinum 99.95%', 'Gold 99.9%'],
    });

    showToast('success', 'Product Added', `Added "${newProd.name}" to enterprise catalogue.`);
    setIsAddModalOpen(false);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!prodName.trim()) {
      showToast('error', 'Validation Error', 'Product name is required.');
      return;
    }

    const segments = targetSegmentsText.split(',').map((s) => s.trim()).filter(Boolean) as CustomerSegment[];
    const techReqs = technicalReqsText.split(',').map((s) => s.trim()).filter(Boolean);

    updateProduct(editingProduct.id, {
      name: prodName.trim(),
      category,
      serviceType: serviceType.trim(),
      description: description.trim(),
      pricingModel: pricingModel.trim(),
      targetSegments: segments.length > 0 ? segments : editingProduct.targetSegments,
      technicalRequirements: techReqs,
      productOwner: productOwner.trim(),
      slaOptions: [slaText || 'Platinum 99.95%'],
    });

    showToast('success', 'Product Updated', `Changes saved for "${prodName.trim()}".`);
    if (viewingProduct?.id === editingProduct.id) {
      setViewingProduct((prev) =>
        prev
          ? {
              ...prev,
              name: prodName.trim(),
              category,
              serviceType: serviceType.trim(),
              description: description.trim(),
              pricingModel: pricingModel.trim(),
              targetSegments: segments.length > 0 ? segments : prev.targetSegments,
              technicalRequirements: techReqs,
              productOwner: productOwner.trim(),
              slaOptions: [slaText || 'Platinum 99.95%'],
            }
          : null
      );
    }
    setEditingProduct(null);
  };

  const handleDeleteProductConfirm = () => {
    if (!productToDelete) return;
    deleteProduct(productToDelete.id);
    showToast('info', 'Product Deleted', `Product "${productToDelete.name}" removed from catalogue.`);
    if (viewingProduct?.id === productToDelete.id) {
      setViewingProduct(null);
    }
    setProductToDelete(null);
  };

  // ── CSV Parsing / Upload Logic ──
  const parseCsvText = (csvContent: string) => {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Helper to parse CSV line respecting quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const parsed: Array<Omit<EnterpriseProduct, 'id'>> = [];
    // skip header line
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length >= 2 && cols[0].trim()) {
        const rawName = cols[0];
        const rawCat = cols[1] as ProductCategory;
        const validCat: ProductCategory = ['Fixed', 'Converged', 'Digital', 'Mobile'].includes(rawCat)
          ? rawCat
          : 'Fixed';
        const rawServiceType = cols[2] || 'Enterprise Service';
        const rawPricing = cols[3] || 'Monthly Recurring Charge (MRC)';
        const rawOwner = cols[4] || 'Enterprise Solutions Architecture';
        const rawDesc = cols[5] || 'MTN Ghana enterprise product offering.';
        const rawSegments = (cols[6] || 'Large Enterprise, SME')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean) as CustomerSegment[];
        const rawTech = (cols[7] || 'Carrier-grade connectivity')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        parsed.push({
          name: rawName,
          category: validCat,
          serviceType: rawServiceType,
          description: rawDesc,
          fullDescription: rawDesc,
          pricingModel: rawPricing,
          targetSegments: rawSegments.length > 0 ? rawSegments : ['Large Enterprise'],
          technicalRequirements: rawTech.length > 0 ? rawTech : ['Fiber/Microwave Link'],
          productOwner: rawOwner,
          iconName: validCat === 'Mobile' ? 'Smartphone' : validCat === 'Digital' ? 'Cloud' : validCat === 'Converged' ? 'Waypoints' : 'Network',
          status: 'Active',
          keyFeatures: ['Carrier-grade reliability', '24/7 Enterprise NOC monitoring', 'Redundant path protection'],
          slaOptions: ['Platinum 99.95%', 'Gold 99.9%'],
        });
      }
    }
    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setUploadText(content);
      const items = parseCsvText(content);
      setParsedItems(items);
      if (items.length > 0) {
        setUploadStep('preview');
      } else {
        showToast('error', 'Parse Error', 'Could not parse any valid product rows from file.');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessText = () => {
    if (!uploadText.trim()) {
      showToast('error', 'Empty Input', 'Please paste CSV content or select a file to upload.');
      return;
    }
    const items = parseCsvText(uploadText);
    if (items.length === 0) {
      showToast('error', 'Parse Error', 'No valid product records found. Check format.');
      return;
    }
    setParsedItems(items);
    setUploadStep('preview');
  };

  const handleConfirmBulkUpload = () => {
    if (parsedItems.length === 0) return;
    let count = 0;
    parsedItems.forEach((item) => {
      addProduct(item);
      count++;
    });
    showToast('success', 'Catalogue Uploaded', `Successfully imported ${count} enterprise services into catalogue.`);
    setIsUploadModalOpen(false);
    setUploadStep('select');
    setParsedItems([]);
    setUploadText('');
    setUploadedFile(null);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'MTN_Ghana_Enterprise_Products_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('info', 'Template Downloaded', 'Sample CSV template downloaded.');
  };

  const handleExportCataloguePdf = () => {
    const headers = ['ID', 'Product Name', 'Category', 'Service Type', 'Pricing Model', 'Product Owner', 'Description', 'Target Segments', 'Technical Requirements'];
    const rows = filteredProducts.map((p) => [
      p.id,
      p.name,
      p.category,
      p.serviceType,
      p.pricingModel,
      p.productOwner,
      p.description,
      p.targetSegments.join('; '),
      p.technicalRequirements.join('; '),
    ]);
    exportBrandedTablePdf({
      title: 'Enterprise Product Catalogue',
      filename: `MTN_EBD_Products_Catalogue_${new Date().toISOString().split('T')[0]}.pdf`,
      headers,
      rows,
    });
    showToast('success', 'PDF Export Complete', 'Product catalogue downloaded as a branded PDF.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Products & Services Catalogue"
        subtitle="Official MTN Ghana Enterprise Business Unit (EBU) connectivity, cloud, cyber security, and digital solutions"
        breadcrumbs={[{ label: 'Products & Services' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {/* Export CSV */}
            <PermissionGate action="export">
              <button
                onClick={handleExportCataloguePdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
                title="Export current catalogue to PDF"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            </PermissionGate>

            {/* Upload Services / Bulk Import */}
            <PermissionGate action="import">
              <button
                onClick={() => {
                  setUploadStep('select');
                  setIsUploadModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                <Upload className="w-4 h-4 text-mtn-yellow" />
                <span>Upload Services</span>
              </button>
            </PermissionGate>

            {/* Add Product Manual */}
            <PermissionGate action="add">
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </PermissionGate>
          </div>
        }
      />

      {/* Category Pills & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-mtn-yellow shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  selectedCategory === cat.id ? 'bg-mtn-yellow text-black' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, owners, descriptions..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50 transition-all"
          />
          <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Product Content: Grid vs Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const IconComponent = ICON_MAP[product.iconName] || Layers;
            return (
              <div
                key={product.id}
                onClick={() => setViewingProduct(product)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Top Bar: Icon + Category Badge + Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-mtn-yellow shrink-0 group-hover:scale-105 transition-transform">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getCategoryBadge(product.category)}`}>
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Title & Service Type */}
                  <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-amber-900 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs font-bold text-amber-900/80 mt-0.5">
                    {product.serviceType}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Target Segments Tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {product.targetSegments.map((seg) => (
                      <span
                        key={seg}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold"
                      >
                        {seg}
                      </span>
                    ))}
                  </div>

                  {/* Technical & SLA metadata */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[170px]" title={product.productOwner}>
                      {product.productOwner}
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {product.slaOptions?.[0] || '99.9% SLA'}
                    </span>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div
                  className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setViewingProduct(product)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Quick View</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Full Specifications Page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <PermissionGate action="edit">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </PermissionGate>
                    <PermissionGate action="delete">
                      <button
                        onClick={() => setProductToDelete(product)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </PermissionGate>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Pricing Model</th>
                  <th className="py-3 px-4">Product Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const IconComponent = ICON_MAP[p.iconName] || Layers;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setViewingProduct(p)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-mtn-yellow shrink-0">
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{p.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadge(p.category)}`}>
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{p.serviceType}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={p.pricingModel}>
                        {p.pricingModel}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.productOwner}</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Quick View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/products/${p.id}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Full Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <PermissionGate action="edit">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </PermissionGate>
                          <PermissionGate action="delete">
                            <button
                              onClick={() => setProductToDelete(p)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── QUICK VIEW SLIDE-OVER DRAWER ── */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setViewingProduct(null)}
          />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-mtn-yellow">
                  {React.createElement(ICON_MAP[viewingProduct.iconName] || Layers, { className: 'w-5 h-5' })}
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-sm leading-tight">{viewingProduct.name}</h2>
                  <p className="text-[11px] text-amber-900 font-bold">{viewingProduct.serviceType}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5">
              {/* Category & SLA Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryBadge(viewingProduct.category)}`}>
                  {viewingProduct.category}
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">
                  {viewingProduct.slaOptions?.[0] || '99.95% SLA Guarantee'}
                </span>
                <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  {viewingProduct.id}
                </span>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Overview</h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {viewingProduct.description}
                </p>
              </div>

              {/* Pricing Model */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Pricing Model</h4>
                <div className="flex items-start gap-2 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-xs text-slate-800">
                  <DollarSign className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span className="font-semibold">{viewingProduct.pricingModel}</span>
                </div>
              </div>

              {/* Target Segments */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Segments</h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingProduct.targetSegments.map((seg) => (
                    <span
                      key={seg}
                      className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200"
                    >
                      {seg}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technical Requirements */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Technical Requirements</h4>
                <ul className="space-y-1.5">
                  {viewingProduct.technicalRequirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Product Owner */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Product Ownership & Architecture</h4>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{viewingProduct.productOwner}</p>
                    <p className="text-[10px] text-slate-400">MTN Ghana Enterprise Business Unit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex gap-2 mt-auto">
              <button
                onClick={() => navigate(`/products/${viewingProduct.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-mtn-yellow" /> Full Specifications
              </button>
              <PermissionGate action="edit">
                <button
                  onClick={() => openEditModal(viewingProduct)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              </PermissionGate>
              <PermissionGate action="delete">
                <button
                  onClick={() => setProductToDelete(viewingProduct)}
                  className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </PermissionGate>
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD SERVICES / BULK IMPORT MODAL ── */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadStep('select');
          setParsedItems([]);
          setUploadText('');
          setUploadedFile(null);
        }}
        title="Upload & Import MTN Enterprise Services"
        subtitle="Bulk import services from CSV files or structured text directly into the catalogue"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {uploadStep === 'select' ? (
            <>
              <div className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-amber-700" />
                  <div>
                    <p className="text-xs font-bold text-amber-950">Download Standard CSV Template</p>
                    <p className="text-[11px] text-amber-800">Use official MTN Ghana columns: Product Name, Category, Service Type, Pricing Model, etc.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg transition-colors shadow-2xs inline-flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample</span>
                </button>
              </div>

              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/70 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {uploadedFile ? uploadedFile.name : 'Click to select or drag & drop CSV file here'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports .CSV and formatted text files</p>
              </div>

              {/* Paste Text Fallback */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Or Paste Raw CSV Data
                </label>
                <textarea
                  rows={4}
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  placeholder={`Product Name,Category,Service Type,Pricing Model,Product Owner,Description,Target Segments,Technical Requirements\nMTN DIA 50Mbps,Fixed,Internet,MRC,Enterprise Architect,Dedicated high-speed link,"Large Enterprise","Fiber Link"`}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessText}
                  className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Preview & Validate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            /* Preview Step */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Found <strong className="text-slate-900">{parsedItems.length}</strong> valid service records ready for import:
                </span>
                <button
                  type="button"
                  onClick={() => setUploadStep('select')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Back to selection
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {parsedItems.map((item, idx) => (
                  <div key={idx} className="p-3 text-xs bg-slate-50/50 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{item.serviceType} • {item.pricingModel}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getCategoryBadge(item.category)}`}>
                      {item.category}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadStep('select')}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkUpload}
                  className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-900" />
                  <span>Import All {parsedItems.length} Products</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── ADD PRODUCT MODAL (MANUAL ENTRY) ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Enterprise Product / Service"
        subtitle="Define new MTN Ghana enterprise connectivity, cloud, or digital solution"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. MTN Dedicated Internet 100Mbps"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Fixed">Fixed Connectivity</option>
                <option value="Converged">Converged Solutions</option>
                <option value="Digital">Digital Services</option>
                <option value="Mobile">Mobile & CUG</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Type</label>
              <input
                type="text"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Dedicated Bandwidth & Internet"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Owner</label>
              <input
                type="text"
                value={productOwner}
                onChange={(e) => setProductOwner(e.target.value)}
                placeholder="Enterprise Solutions Architecture"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="High-capacity symmetrical internet circuit backed by SLA guarantee..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pricing Model</label>
              <input
                type="text"
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value)}
                placeholder="Tiered Monthly Recurring Charge (MRC)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SLA Commitment</label>
              <input
                type="text"
                value={slaText}
                onChange={(e) => setSlaText(e.target.value)}
                placeholder="Platinum 99.95%"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Segments (comma separated)</label>
              <input
                type="text"
                value={targetSegmentsText}
                onChange={(e) => setTargetSegmentsText(e.target.value)}
                placeholder="Large Enterprise, SME, Multinational"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Technical Requirements</label>
              <input
                type="text"
                value={technicalReqsText}
                onChange={(e) => setTechnicalReqsText(e.target.value)}
                placeholder="Fiber drop, Managed CPE, Static IPs"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs transition-all"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT PRODUCT MODAL ── */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title={`Edit Product: ${editingProduct?.name || ''}`}
        subtitle="Update service specifications, ownership, and pricing models"
        maxWidth="xl"
      >
        {editingProduct && (
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Fixed">Fixed Connectivity</option>
                  <option value="Converged">Converged Solutions</option>
                  <option value="Digital">Digital Services</option>
                  <option value="Mobile">Mobile & CUG</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Type</label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Owner</label>
                <input
                  type="text"
                  value={productOwner}
                  onChange={(e) => setProductOwner(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pricing Model</label>
                <input
                  type="text"
                  value={pricingModel}
                  onChange={(e) => setPricingModel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">SLA Commitment</label>
                <input
                  type="text"
                  value={slaText}
                  onChange={(e) => setSlaText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Segments</label>
                <input
                  type="text"
                  value={targetSegmentsText}
                  onChange={(e) => setTargetSegmentsText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Technical Requirements</label>
                <input
                  type="text"
                  value={technicalReqsText}
                  onChange={(e) => setTechnicalReqsText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <Modal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Delete Catalogue Product"
        maxWidth="sm"
      >
        {productToDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs">
                Are you sure you want to delete <strong>{productToDelete.name}</strong> ({productToDelete.id}) from the product catalogue?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProductConfirm}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
