/**
 * MTN ENTERPRISE HUB - CENTRAL DOCUMENT REPOSITORY (CRUD & MANUAL ENTRY)
 * 
 * Route: /documents
 * Central repository for all enterprise artifacts: Ghana Cards, Business Registration certificates,
 * Technology Engagement Forms (TEF), Signed Solution Designs, Contracts, and Proforma Invoices.
 * Features:
 * - Free-text manual company entry on document creation & edit
 * - Add Document modal, Edit Document metadata modal, Delete Document modal
 * - Category filter pills, preview modal, download simulation
 */

import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Building2,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import type { EnterpriseDocument, DocumentType, DocumentStatus } from '../types';
import { formatDate } from '../utils/formatters';

const DOCUMENT_CATEGORIES: DocumentType[] = [
  'Customer Documents',
  'Technical Documents',
  'Quotations',
  'Contracts',
  'Business Registration',
  'Identification',
  'Engagement Forms',
  'Solution Designs',
  'Other',
];

export const DocumentsPage: React.FC = () => {
  const { documents, addDocument, updateDocument, deleteDocument, customers, getOrCreateCustomerByName } = useAppState();
  const { showToast } = useToast();

  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<EnterpriseDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<EnterpriseDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<EnterpriseDocument | null>(null);

  // Form states for Upload / Edit
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<DocumentType>('Technical Documents');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [fileFormat, setFileFormat] = useState<'pdf' | 'docx' | 'xlsx' | 'png' | 'zip'>('pdf');
  const [docVersion, setDocVersion] = useState('v1.0');
  const [docStatus, setDocStatus] = useState<DocumentStatus>('Pending Review');

  const filteredDocuments = documents.filter((d) => {
    if (selectedType !== 'ALL' && d.type !== selectedType) return false;
    return true;
  });

  const openUploadModal = () => {
    setDocName('');
    setDocType('Technical Documents');
    setCustomerNameInput(customers[0]?.name || '');
    setFileFormat('pdf');
    setDocVersion('v1.0');
    setDocStatus('Pending Review');
    setIsUploadModalOpen(true);
  };

  const openEditModal = (doc: EnterpriseDocument) => {
    setEditingDoc(doc);
    setDocName(doc.name);
    setDocType(doc.type);
    setCustomerNameInput(doc.customerName || '');
    setFileFormat(doc.fileFormat);
    setDocVersion(doc.version);
    setDocStatus(doc.status);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    let customerId: string | undefined = undefined;
    let customerName: string | undefined = undefined;

    if (customerNameInput.trim()) {
      const cust = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'Other');
      customerId = cust.id;
      customerName = cust.name;
    }

    addDocument({
      name: docName.endsWith(`.${fileFormat}`) ? docName.trim() : `${docName.trim()}.${fileFormat}`,
      type: docType,
      customerId,
      customerName,
      uploadedBy: 'Kwame Mensah (KAM)',
      size: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
      status: docStatus,
      fileFormat,
      version: docVersion.trim() || 'v1.0',
    });

    showToast('success', 'Document Uploaded', `${docName} added to the central repository.`);
    setIsUploadModalOpen(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !docName.trim()) return;

    let customerId: string | undefined = undefined;
    let customerName: string | undefined = undefined;

    if (customerNameInput.trim()) {
      const cust = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'Other');
      customerId = cust.id;
      customerName = cust.name;
    }

    updateDocument(editingDoc.id, {
      name: docName.trim(),
      type: docType,
      customerId,
      customerName,
      version: docVersion.trim() || editingDoc.version,
      status: docStatus,
      fileFormat,
    });

    showToast('success', 'Document Updated', `Changes to "${docName}" saved.`);
    setEditingDoc(null);
  };

  const handleDeleteConfirm = () => {
    if (!docToDelete) return;
    deleteDocument(docToDelete.id);
    showToast('info', 'Document Removed', `${docToDelete.name} deleted from repository.`);
    setDocToDelete(null);
  };

  const columns: Column<EnterpriseDocument>[] = [
    {
      header: 'Document Name',
      accessor: (d) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm hover:text-amber-900 transition-colors">
              {d.name}
            </span>
            <p className="text-[11px] text-slate-400 font-mono">
              Version: {d.version} • Size: {d.size} • {d.fileFormat.toUpperCase()}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Category Type',
      accessor: (d) => (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {d.type}
        </span>
      ),
    },
    {
      header: 'Linked Customer',
      accessor: (d) => (
        <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {d.customerName || 'General Repository'}
        </span>
      ),
    },
    {
      header: 'Uploaded By',
      accessor: (d) => (
        <div>
          <p className="font-medium text-slate-800 text-xs">{d.uploadedBy}</p>
          <p className="text-[10px] text-slate-400">{formatDate(d.date)}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (d) => <StatusBadge status={d.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (d) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setPreviewDoc(d)}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            title="Preview metadata"
          >
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGate action="edit">
            <button
              onClick={() => openEditModal(d)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit document"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <PermissionGate action="export">
            <button
              onClick={() => showToast('info', 'Download Started', `Downloading ${d.name}...`)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
          </PermissionGate>
          <PermissionGate action="delete">
            <button
              onClick={() => setDocToDelete(d)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete record"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Enterprise Document Repository"
        subtitle="Manage KYC, customer agreements, solutions architectures, TEFs, and verified compliance records"
        breadcrumbs={[{ label: 'Documents' }]}
        actions={
          <button
            onClick={openUploadModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        }
      />

      {/* Datalist for autocomplete suggestions */}
      <datalist id="doc-customer-suggestions">
        {customers.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

      {/* Filter Category Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSelectedType('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedType === 'ALL'
              ? 'bg-slate-900 text-mtn-yellow shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Categories ({documents.length})
        </button>
        {DOCUMENT_CATEGORIES.map((cat) => {
          const count = documents.filter((d) => d.type === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedType(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedType === cat
                  ? 'bg-slate-900 text-mtn-yellow shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{cat}</span>
              {count > 0 && <span className="text-[10px] px-1.5 rounded-full bg-slate-200 text-slate-800">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredDocuments}
        searchPlaceholder="Search documents by filename, customer, or uploader..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return (
            item.name.toLowerCase().includes(q) ||
            item.type.toLowerCase().includes(q) ||
            (item.customerName && item.customerName.toLowerCase().includes(q)) ||
            item.uploadedBy.toLowerCase().includes(q)
          );
        }}
      />

      {/* UPLOAD MODAL */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Enterprise Document"
        subtitle="Store new artifacts in the central secure repository with manual company association"
        maxWidth="lg"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Master Services Agreement & SLA"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Type *</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Associated Company (Type Any)</label>
              <input
                type="text"
                list="doc-customer-suggestions"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                placeholder="Type any enterprise customer name..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">File Format</label>
              <select
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="pdf">PDF Document (.pdf)</option>
                <option value="docx">Word Document (.docx)</option>
                <option value="xlsx">Excel Spreadsheet (.xlsx)</option>
                <option value="png">Scanned Image (.png)</option>
                <option value="zip">Archive Bundle (.zip)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Version Tag</label>
              <input
                type="text"
                value={docVersion}
                onChange={(e) => setDocVersion(e.target.value)}
                placeholder="v1.0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          {/* Drag and Drop Zone Simulation */}
          <div className="border-2 border-dashed border-slate-300 hover:border-mtn-yellow/80 rounded-2xl p-6 text-center bg-slate-50 cursor-pointer transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Drag & Drop file here or click to browse</p>
            <p className="text-[11px] text-slate-400 mt-1">Supports PDF, DOCX, XLSX up to 25MB with auto-SHA256 checksum</p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs transition-all"
            >
              Save & Upload
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={!!editingDoc}
        onClose={() => setEditingDoc(null)}
        title="Edit Document Metadata"
        subtitle={`Update attributes for ${editingDoc?.name}`}
        maxWidth="lg"
      >
        {editingDoc && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Title *</label>
              <input
                type="text"
                required
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Associated Company</label>
                <input
                  type="text"
                  list="doc-customer-suggestions"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={docStatus}
                  onChange={(e) => setDocStatus(e.target.value as DocumentStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Version</label>
                <input
                  type="text"
                  value={docVersion}
                  onChange={(e) => setDocVersion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
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

      {/* PREVIEW MODAL */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title="Document Metadata & Inspection"
        subtitle={previewDoc?.name}
        maxWidth="md"
      >
        {previewDoc && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Document ID:</span>
                <span className="font-mono font-bold text-slate-800">{previewDoc.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">File Name:</span>
                <span className="font-bold text-slate-800">{previewDoc.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-semibold text-slate-800">{previewDoc.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Linked Customer:</span>
                <span className="font-bold text-slate-900">{previewDoc.customerName || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Uploaded By:</span>
                <span className="font-medium text-slate-800">{previewDoc.uploadedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Upload Date:</span>
                <span className="font-medium text-slate-800">{formatDate(previewDoc.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Version:</span>
                <span className="font-mono font-bold text-slate-800">{previewDoc.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <StatusBadge status={previewDoc.status} size="sm" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  showToast('info', 'Download Started', `Downloading ${previewDoc.name}...`);
                  setPreviewDoc(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        title="Delete Document Record"
        maxWidth="sm"
      >
        {docToDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs">
                Are you sure you want to delete <strong>{docToDelete.name}</strong> from the repository?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
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
