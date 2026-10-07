/**
 * MTN ENTERPRISE HUB - GLOBAL ENTERPRISE SEARCH MODAL
 * 
 * Instant search across Customers, Products, Opportunities, Documents, and Active Services.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  Layers,
  Flame,
  FileText,
  Activity,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';

const matchesQuery = (query: string, ...values: unknown[]) => {
  const normalizedQuery = query.toLowerCase();
  return values.some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery));
};

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { customers, products, opportunities, documents, activeServices } = useAppState();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      return () => {
        setQuery('');
      };
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingCustomers = q
    ? customers.filter((customer) => matchesQuery(q, customer?.name, customer?.industry, customer?.location))
    : [];

  const matchingProducts = q
    ? products.filter((product) => matchesQuery(q, product?.name, product?.category, product?.description))
    : [];

  const matchingOpportunities = q
    ? opportunities.filter((opportunity) => matchesQuery(q, opportunity?.title, opportunity?.customerName, opportunity?.productName))
    : [];

  const matchingDocuments = q
    ? documents.filter((document) => matchesQuery(q, document?.name, document?.type, document?.customerName))
    : [];

  const matchingServices = q
    ? activeServices.filter((service) => matchesQuery(q, service?.serviceName, service?.customerName, service?.category))
    : [];

  const totalResults =
    matchingCustomers.length +
    matchingProducts.length +
    matchingOpportunities.length +
    matchingDocuments.length +
    matchingServices.length;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:p-6 sm:pt-20">
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/70">
            <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customers, products, opportunities, documents, services..."
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1 mr-1"
                aria-label="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-200 rounded border border-slate-300">
              ESC
            </kbd>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-4 divide-y divide-slate-100">
            {query && totalResults === 0 && (
              <div className="py-10 text-center text-slate-500">
                <p className="font-semibold text-slate-700">No matching enterprise records found</p>
                <p className="text-xs text-slate-400 mt-1">Try searching by company name, product title, or keyword.</p>
              </div>
            )}

            {!query && (
              <div className="py-6 px-2 text-xs text-slate-500">
                <p className="font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Search Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {['Apex Bank', 'SD-WAN', 'GoldRidge', 'Dedicated Internet', 'Starlink', 'Heritage University', 'TFR Feasibility'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 transition-colors text-slate-700 font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customers Section */}
            {matchingCustomers.length > 0 && (
              <div className="py-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  Customers ({matchingCustomers.length})
                </h4>
                <div className="space-y-1">
                  {matchingCustomers.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelect(`/customers/${c.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/60 cursor-pointer transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-950">
                          {c.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {c.segment} • {c.industry} • {c.location}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-mtn-yellow-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Section */}
            {matchingProducts.length > 0 && (
              <div className="py-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Products & Services ({matchingProducts.length})
                </h4>
                <div className="space-y-1">
                  {matchingProducts.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelect(`/products/${p.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/60 cursor-pointer transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-950">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Category: {p.category} • Owner: {p.productOwner}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-mtn-yellow-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities Section */}
            {matchingOpportunities.length > 0 && (
              <div className="py-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-slate-500" />
                  Opportunities ({matchingOpportunities.length})
                </h4>
                <div className="space-y-1">
                  {matchingOpportunities.slice(0, 4).map((o) => (
                    <div
                      key={o.id}
                      onClick={() => handleSelect(`/opportunities/${o.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/60 cursor-pointer transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-950">
                          {o.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          Stage: {o.stage} • Customer: {o.customerName}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-mtn-yellow-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents Section */}
            {matchingDocuments.length > 0 && (
              <div className="py-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Documents ({matchingDocuments.length})
                </h4>
                <div className="space-y-1">
                  {matchingDocuments.slice(0, 3).map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleSelect(`/documents`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/60 cursor-pointer transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-950">
                          {d.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Type: {d.type} • {d.size} • {d.uploadedBy}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-mtn-yellow-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Services Section */}
            {matchingServices.length > 0 && (
              <div className="py-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-500" />
                  Active Services ({matchingServices.length})
                </h4>
                <div className="space-y-1">
                  {matchingServices.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelect(`/active-services`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/60 cursor-pointer transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-950">
                          {s.serviceName}
                        </p>
                        <p className="text-xs text-slate-500">
                          Client: {s.customerName} • {s.slaTier}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-mtn-yellow-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
