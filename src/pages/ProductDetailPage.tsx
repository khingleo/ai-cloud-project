/**
 * MTN ENTERPRISE HUB - PRODUCT DETAIL & TECHNICAL SPECIFICATIONS (CRUD)
 * 
 * Route: /products/:id
 * Grounded in Excel Sheet 1 details: technical requirements, pricing decision, target segments.
 * Features:
 * - Edit Product specifications modal
 * - Delete Product action with catalogue redirect
 * - "+ Create Deal from Product" with free-text manual company entry
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { formatCurrencyGHS } from '../utils/formatters';
import type { ProductCategory, CustomerSegment } from '../types';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    products,
    opportunities,
    customers,
    addOpportunity,
    updateProduct,
    deleteProduct,
    getOrCreateCustomerByName,
  } = useAppState();
  const { showToast } = useToast();

  const [isNewOppModalOpen, setIsNewOppModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // New Deal form states
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [oppTitle, setOppTitle] = useState('');
  const [oppValue, setOppValue] = useState(280000);

  // Edit Product form states
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ProductCategory>('Fixed');
  const [editServiceType, setEditServiceType] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPricingModel, setEditPricingModel] = useState('');
  const [editProductOwner, setEditProductOwner] = useState('');
  const [editTargetSegments, setEditTargetSegments] = useState('');
  const [editTechReqs, setEditTechReqs] = useState('');

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="py-16 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Product Not Found</h3>
        <p className="text-sm text-slate-500">The requested product code does not exist in the catalogue.</p>
        <button
          onClick={() => navigate('/products')}
          className="px-4 py-2 bg-mtn-yellow font-bold text-xs rounded-xl shadow-xs"
        >
          Return to Catalogue
        </button>
      </div>
    );
  }

  const relatedOpportunities = opportunities.filter((o) => o.productId === product.id);

  const openEditModal = () => {
    setEditName(product.name);
    setEditCategory(product.category);
    setEditServiceType(product.serviceType);
    setEditDescription(product.description);
    setEditPricingModel(product.pricingModel);
    setEditProductOwner(product.productOwner);
    setEditTargetSegments(product.targetSegments.join(', '));
    setEditTechReqs(product.technicalRequirements.join(', '));
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('error', 'Validation Error', 'Product name is required.');
      return;
    }

    const segments = editTargetSegments.split(',').map((s) => s.trim()).filter(Boolean) as CustomerSegment[];
    const techReqs = editTechReqs.split(',').map((s) => s.trim()).filter(Boolean);

    updateProduct(product.id, {
      name: editName.trim(),
      category: editCategory,
      serviceType: editServiceType.trim(),
      description: editDescription.trim(),
      pricingModel: editPricingModel.trim(),
      productOwner: editProductOwner.trim(),
      targetSegments: segments.length > 0 ? segments : (['Large Enterprise'] as CustomerSegment[]),
      technicalRequirements: techReqs,
    });

    showToast('success', 'Product Updated', `Saved changes for "${editName.trim()}".`);
    setIsEditModalOpen(false);
  };

  const handleDeleteProductConfirm = () => {
    deleteProduct(product.id);
    showToast('info', 'Product Deleted', `Removed "${product.name}" from catalogue.`);
    setIsDeleteModalOpen(false);
    navigate('/products');
  };

  const handleCreateOpp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNameInput.trim()) {
      showToast('error', 'Validation Error', 'Customer company name is required.');
      return;
    }

    const customer = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');

    const newOpp = addOpportunity({
      title: oppTitle.trim() || `${customer.name} — ${product.name}`,
      customerId: customer.id,
      customerName: customer.name,
      productId: product.id,
      productName: product.name,
      category: product.category,
      stage: 'Qualification',
      valueGHS: Number(oppValue),
      mrcGHS: Math.round(Number(oppValue) * 0.08),
      otcGHS: Math.round(Number(oppValue) * 0.2),
      owner: 'Kwame Mensah',
      expectedCloseDate: '2026-12-31',
      priority: 'High',
      probability: 50,
      status: 'Open',
      presalesRequired: true,
      description: `Opportunity generated from ${product.name} catalogue profile.`,
    });

    showToast('success', 'Opportunity Created', `Deal initiated for ${customer.name}.`);
    setIsNewOppModalOpen(false);
    navigate(`/opportunities/${newOpp.id}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title={product.name}
        subtitle={`${product.category} Connectivity • Code: ${product.id} • Unit: ${product.productOwner}`}
        breadcrumbs={[
          { label: 'Products & Services', path: '/products' },
          { label: product.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
              <span>Edit Product</span>
            </button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              onClick={() => setIsNewOppModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs font-bold rounded-xl shadow-mtn-glow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Deal from Product</span>
            </button>
          </div>
        }
      />

      {/* Datalist for autocomplete suggestions */}
      <datalist id="prod-detail-customer-suggestions">
        {customers.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Solution Overview Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solution Profile</span>
              <h3 className="text-xl font-extrabold text-slate-900 font-heading mt-0.5">{product.name}</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">{product.serviceType}</p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Technical Description & Architecture</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Technical Requirements List */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Pre-Requisites & Technical Specifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.technicalRequirements.map((req, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-mtn-yellow-900 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700 font-medium">{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commercial Pricing Structure */}
            <div className="pt-4 border-t border-slate-100 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">Commercial & Pricing Decision Matrix</h4>
              <p className="text-xs text-slate-700 font-medium">
                {product.pricingModel}
              </p>
            </div>
          </div>

          {/* Active Deals using this Product */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Active Deals in Pipeline ({relatedOpportunities.length})</h4>
            </div>

            {relatedOpportunities.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {relatedOpportunities.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{opp.title}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opp.customerName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={opp.stage} size="sm" />
                      <span className="text-xs font-extrabold text-slate-900">{formatCurrencyGHS(opp.valueGHS)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs italic">
                No active opportunities currently linked to this product.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xs border border-slate-800 space-y-4 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-mtn-yellow">Target Customer Segments</h4>
            <div className="flex flex-wrap gap-1.5">
              {product.targetSegments.map((seg, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200">
                  {seg}
                </span>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Solution Category:</span>
                <strong className="text-white">{product.category}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Product Owner:</span>
                <strong className="text-white">{product.productOwner}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Catalogue ID:</span>
                <strong className="text-white">{product.id}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE OPPORTUNITY MODAL */}
      <Modal
        isOpen={isNewOppModalOpen}
        onClose={() => setIsNewOppModalOpen(false)}
        title={`Create Deal: ${product.name}`}
        subtitle="Initiate a commercial sales deal with manual company name entry"
        maxWidth="md"
      >
        <form onSubmit={handleCreateOpp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Customer / Company * (Type Any)</label>
            <input
              type="text"
              required
              list="prod-detail-customer-suggestions"
              value={customerNameInput}
              onChange={(e) => setCustomerNameInput(e.target.value)}
              placeholder="Type any enterprise client name..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deal Title</label>
            <input
              type="text"
              value={oppTitle}
              onChange={(e) => setOppTitle(e.target.value)}
              placeholder={`e.g. Standard Chartered Bank — ${product.name}`}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Contract Value (GHS) *</label>
            <input
              type="number"
              min={5000}
              step={5000}
              value={oppValue}
              onChange={(e) => setOppValue(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewOppModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs transition-all"
            >
              Initiate Deal
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PRODUCT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product Specification"
        subtitle={`Update ${product.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
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
                value={editServiceType}
                onChange={(e) => setEditServiceType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Owner</label>
              <input
                type="text"
                value={editProductOwner}
                onChange={(e) => setEditProductOwner(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pricing Model</label>
            <input
              type="text"
              value={editPricingModel}
              onChange={(e) => setEditPricingModel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Segments (Comma separated)</label>
              <input
                type="text"
                value={editTargetSegments}
                onChange={(e) => setEditTargetSegments(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Technical Requirements (Comma separated)</label>
              <input
                type="text"
                value={editTechReqs}
                onChange={(e) => setEditTechReqs(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
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
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Catalogue Product"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs">
              Are you sure you want to remove <strong>{product.name}</strong> from the enterprise portfolio?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
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
      </Modal>
    </div>
  );
};
