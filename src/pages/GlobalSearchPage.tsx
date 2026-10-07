import React, { useState } from 'react';
import { 
  Search, 
  Building, 
  Server, 
  Tag, 
  SlidersHorizontal, 
  Check, 
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';

export const GlobalSearchPage: React.FC = () => {
  const { customers, products, subscriptions, networkConfigs, standardPrices, documents } = useAppState();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'search' | 'compare'>('search');

  // Compare mode selections (2 products)
  const [compareId1, setCompareId1] = useState<string>(products[0]?.id || '');
  const [compareId2, setCompareId2] = useState<string>(products[1]?.id || '');

  const p1 = products.find(p => p.id === compareId1) || products[0];
  const p2 = products.find(p => p.id === compareId2) || products[1];

  // Global search filtering across all entities
  const q = query.trim().toLowerCase();

  const matchedCustomers = !q ? [] : customers.filter((c: any) => 
    c.name?.toLowerCase().includes(q) ||
    c.id?.toLowerCase().includes(q) ||
    c.industry?.toLowerCase().includes(q) ||
    (c.assignedKAM && c.assignedKAM.toLowerCase().includes(q)) ||
    (c.accountManager && c.accountManager.toLowerCase().includes(q)) ||
    (c.address && c.address.toLowerCase().includes(q)) ||
    (c.location && c.location.toLowerCase().includes(q)) ||
    (c.customPackageName && c.customPackageName.toLowerCase().includes(q))
  );

  const matchedProducts = !q ? [] : products.filter((p: any) => 
    p.name?.toLowerCase().includes(q) ||
    p.category?.toLowerCase().includes(q) ||
    (p.owner && p.owner.toLowerCase().includes(q)) ||
    (p.fullDescription && p.fullDescription.toLowerCase().includes(q)) ||
    (p.description && p.description.toLowerCase().includes(q)) ||
    (p.specifications && p.specifications.some((s: string) => s.toLowerCase().includes(q)))
  );

  const matchedSubscriptions = !q ? [] : (subscriptions || []).filter(s => 
    s.id.toLowerCase().includes(q) ||
    (s.customerName && s.customerName.toLowerCase().includes(q)) ||
    (s.productName && s.productName.toLowerCase().includes(q)) ||
    (s.circuitId && s.circuitId.toLowerCase().includes(q)) ||
    (s.category && s.category.toLowerCase().includes(q))
  );

  const matchedNetwork = !q ? [] : (networkConfigs || []).filter(n => 
    (n.circuitId && n.circuitId.toLowerCase().includes(q)) ||
    (n.id && n.id.toLowerCase().includes(q)) ||
    (n.customerName && n.customerName.toLowerCase().includes(q)) ||
    (n.ipSubnet && n.ipSubnet.toLowerCase().includes(q)) ||
    (n.ipAddress && n.ipAddress.toLowerCase().includes(q)) ||
    (n.vlan && String(n.vlan).toLowerCase().includes(q)) ||
    (n.vlanId != null && String(n.vlanId).includes(q)) ||
    (n.cpeRouterModel && n.cpeRouterModel.toLowerCase().includes(q)) ||
    (n.routerCPE && n.routerCPE.toLowerCase().includes(q)) ||
    (n.installationLocation && n.installationLocation.toLowerCase().includes(q)) ||
    (n.serviceName && n.serviceName.toLowerCase().includes(q))
  );

  const matchedPricing = !q ? [] : (standardPrices || []).filter(pr => 
    (pr.productName && pr.productName.toLowerCase().includes(q)) ||
    (pr.tier && pr.tier.toLowerCase().includes(q)) ||
    (pr.category && pr.category.toLowerCase().includes(q)) ||
    (pr.code && pr.code.toLowerCase().includes(q)) ||
    (pr.id && pr.id.toLowerCase().includes(q))
  );

  const matchedDocuments = !q ? [] : (documents || []).filter(d => 
    (d.title && d.title.toLowerCase().includes(q)) ||
    (d.name && d.name.toLowerCase().includes(q)) ||
    (d.category && d.category.toLowerCase().includes(q)) ||
    (d.type && d.type.toLowerCase().includes(q)) ||
    (d.tags && d.tags.some((t: string) => t.toLowerCase().includes(q)))
  );

  const totalResults = 
    matchedCustomers.length + 
    matchedProducts.length + 
    matchedSubscriptions.length + 
    matchedNetwork.length + 
    matchedPricing.length + 
    matchedDocuments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300">
              GLOBAL REPOSITORY DISCOVERY
            </span>
            <span className="text-xs text-gray-500">Cross-Entity Knowledge Search & Comparison Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Universal Search & Service Compare</h1>
          <p className="text-sm text-gray-600 mt-1">
            Query across enterprise customers, product portfolios, active circuits, IP subnets, price books and contracts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'search' ? 'compare' : 'search')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-lg shadow-sm transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {viewMode === 'search' ? 'Switch to Compare Services' : 'Back to Universal Search'}
          </button>
        </div>
      </div>

      {/* Mode 1: Compare Services */}
      {viewMode === 'compare' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-yellow-600" />
              Side-by-Side Service & Tariff Comparison
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product 1 Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Primary Service (A)
                </label>
                <select
                  value={compareId1}
                  onChange={(e) => setCompareId1(e.target.value)}
                  className="w-full text-xs font-semibold border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-yellow-400 focus:border-yellow-400"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>[{p.category}] {p.name}</option>
                  ))}
                </select>
              </div>

              {/* Product 2 Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Select Comparison Service (B)
                </label>
                <select
                  value={compareId2}
                  onChange={(e) => setCompareId2(e.target.value)}
                  className="w-full text-xs font-semibold border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-yellow-400 focus:border-yellow-400"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>[{p.category}] {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Matrix Table */}
            {p1 && p2 && (
              <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-4 w-1/4">Specification / Dimension</th>
                      <th className="px-5 py-4 w-3/8 bg-yellow-50 text-yellow-950 border-r border-yellow-200">
                        {p1.name}
                      </th>
                      <th className="px-5 py-4 w-3/8 bg-blue-50 text-blue-950">
                        {p2.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-5 py-3.5 font-bold text-gray-600 bg-gray-50">Category</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900 border-r">{p1.category}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">{p2.category}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 font-bold text-gray-600 bg-gray-50">Pricing Structure</td>
                      <td className="px-5 py-3.5 font-mono text-gray-900 border-r">{p1.pricingModel}</td>
                      <td className="px-5 py-3.5 font-mono text-gray-900">{p2.pricingModel}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 font-bold text-gray-600 bg-gray-50">Standard Tariff Book</td>
                      <td className="px-5 py-3.5 font-bold text-yellow-800 border-r">{p1.standardPriceGHS ? `GHS ${p1.standardPriceGHS.toLocaleString()}` : 'Tariff on Request'}</td>
                      <td className="px-5 py-3.5 font-bold text-blue-800">{p2.standardPriceGHS ? `GHS ${p2.standardPriceGHS.toLocaleString()}` : 'Tariff on Request'}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 font-bold text-gray-600 bg-gray-50">Technical Owner / KAM</td>
                      <td className="px-5 py-3.5 text-gray-900 border-r">{p1.owner || p1.productOwner}</td>
                      <td className="px-5 py-3.5 text-gray-900">{p2.owner || p2.productOwner}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 font-bold text-gray-600 bg-gray-50">Scope & Architecture</td>
                      <td className="px-5 py-3.5 text-gray-700 leading-relaxed border-r">{p1.fullDescription || p1.description}</td>
                      <td className="px-5 py-3.5 text-gray-700 leading-relaxed">{p2.fullDescription || p2.description}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5 font-bold text-gray-600 bg-gray-50">Enterprise Features</td>
                      <td className="px-5 py-3.5 border-r">
                        <ul className="space-y-1">
                          {(p1.keyFeatures || p1.technicalRequirements || p1.specifications || []).map((s: string, i: number) => (
                            <li key={i} className="flex items-center gap-1.5 text-gray-800">
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> {s}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-5 py-3.5">
                        <ul className="space-y-1">
                          {(p2.keyFeatures || p2.technicalRequirements || p2.specifications || []).map((s: string, i: number) => (
                            <li key={i} className="flex items-center gap-1.5 text-gray-800">
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> {s}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mode 2: Universal Search */
        <div className="space-y-6">
          {/* Big Search Input Box */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="relative">
              <Search className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search by company name, circuit ID (CIR-ACC-...), IP address, product, manager or tariff..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 font-medium"
              />
            </div>

            {/* Entity filters */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
              {[
                { id: 'all', label: `All Entities (${totalResults})` },
                { id: 'customers', label: `Customers (${matchedCustomers.length})` },
                { id: 'products', label: `Products (${matchedProducts.length})` },
                { id: 'subscriptions', label: `Subscriptions (${matchedSubscriptions.length})` },
                { id: 'network', label: `Network / Circuits (${matchedNetwork.length})` },
                { id: 'pricing', label: `Tariffs & Pricing (${matchedPricing.length})` },
                { id: 'documents', label: `Documents (${matchedDocuments.length})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveCategory(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeCategory === f.id
                      ? 'bg-yellow-400 text-black shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Display */}
          {!q ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 text-yellow-800">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Type any keyword to query the repository</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                You can enter customer names like "Scancom", circuit IDs like "CIR-ACC-4491", IP addresses, or service names.
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No matching records found for "{query}"</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Check spelling or try searching by category or circuit identifier.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customers Group */}
              {(activeCategory === 'all' || activeCategory === 'customers') && matchedCustomers.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                      <Building className="w-4 h-4 text-yellow-600" />
                      Matching Enterprise Customers ({matchedCustomers.length})
                    </span>
                    <Link to="/customers" className="text-xs font-semibold text-yellow-800 hover:underline">
                      View all in Customer Directory →
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {matchedCustomers.map(c => (
                      <Link 
                        key={c.id} 
                        to={`/customers/${c.id}`}
                        className="p-4 flex items-center justify-between hover:bg-yellow-50/50 transition-colors block"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{c.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                              {c.id}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Industry: <span className="font-medium text-gray-700">{c.industry}</span> | 
                            KAM: <span className="font-medium text-gray-700">{(c as any).assignedKAM || c.accountManager}</span> | 
                            Active Service: <span className="font-semibold text-yellow-800">{(c as any).customPackageName || 'Standard Enterprise'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{(c as any).customPriceGHS ? `GHS ${(c as any).customPriceGHS.toLocaleString()}/mo` : ''}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Group */}
              {(activeCategory === 'all' || activeCategory === 'products') && matchedProducts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-600" />
                      Matching Products & Services ({matchedProducts.length})
                    </span>
                    <Link to="/products" className="text-xs font-semibold text-blue-800 hover:underline">
                      View all in Product Catalog →
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {matchedProducts.map(p => (
                      <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{p.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              {p.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 max-w-2xl">{p.fullDescription}</p>
                          <div className="text-[11px] text-gray-400 mt-1">Technical Owner: {(p as any).owner || 'Afua Mensah'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-900">{(p as any).standardPriceGHS || 'Tiered Price'}</div>
                          <div className="text-[11px] text-gray-500">{p.pricingModel}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Network Group */}
              {(activeCategory === 'all' || activeCategory === 'network') && matchedNetwork.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                      <Server className="w-4 h-4 text-purple-600" />
                      Matching Circuits & Network Configurations ({matchedNetwork.length})
                    </span>
                    <Link to="/network" className="text-xs font-semibold text-purple-800 hover:underline">
                      View all in Network Repository →
                    </Link>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {matchedNetwork.map((n: any) => (
                      <div key={n.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-sm text-purple-900">{n.circuitId || n.id}</span>
                            <span className="text-xs font-bold text-gray-800">({n.customerName})</span>
                            {n.serviceName && (
                              <span className="text-[10px] font-semibold bg-purple-50 text-purple-800 rounded-full px-2 py-0.5 border border-purple-200">
                                {n.serviceName}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-2 gap-y-1">
                            <span>IP: <span className="font-mono font-semibold">{n.ipSubnet || n.ipAddress}</span></span>
                            <span>| VLAN: <span className="font-mono font-semibold">{n.vlan ?? (n.vlanId != null ? n.vlanId : 'Untagged')}</span></span>
                            <span>| CPE: <span className="font-medium text-gray-800">{n.cpeRouterModel || n.routerCPE}</span></span>
                            <span>| Location: {n.installationLocation}</span>
                            {typeof n.gatewayIp === 'string' && (
                              <span>| GW: <span className="font-mono text-gray-700">{n.gatewayIp}</span></span>
                            )}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 self-start sm:self-center">
                          {n.networkStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
