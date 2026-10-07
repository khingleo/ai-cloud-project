import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  User, 
  Eye, 
  CheckCircle, 
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { exportBrandedTablePdf } from '../utils/exportBrandedPdf';

export const AuditLogPage: React.FC = () => {
  const { auditLogs } = useAppState();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const modules = ['all', 'Customer Management', 'Commercial Pricing', 'Technical Network', 'Service Subscriptions', 'Billing & Revenue', 'Documents & Contracts'];
  const actions = ['all', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT'];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recordName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = selectedModule === 'all' || log.module === selectedModule;
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;

    return matchesSearch && matchesModule && matchesAction;
  });

  const exportAuditPdf = () => {
    const headers = ['Audit ID', 'Timestamp', 'User', 'Action', 'Module', 'Record Name', 'Details', 'IP Address'];
    const rows = filteredLogs.map((log) => [
      log.id, log.timestamp, log.user, log.action, log.module, log.recordName, log.details || '', log.ipAddress || 'N/A',
    ]);
    exportBrandedTablePdf({
      title: 'Enterprise Audit Ledger',
      filename: `MTN_EBD_Audit_Trail_${new Date().toISOString().slice(0, 10)}.pdf`,
      headers,
      rows,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
              IMMUTABLE AUDIT VAULT
            </span>
            <span className="text-xs text-gray-500">ISO 27001 & Sarbanes-Oxley Compliance</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Enterprise Audit & Activity Logs</h1>
          <p className="text-sm text-gray-600 mt-1">
            Complete tamper-resistant activity ledger tracking all record mutations, pricing modifications, approvals and document accesses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAuditPdf}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-gray-600" />
            Export Audit Ledger (PDF)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-gray-500">Total Audit Events</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{auditLogs.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Immutable stream
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-gray-500">Pricing Updates Tracked</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {auditLogs.filter(l => l.module === 'Commercial Pricing').length}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">With before/after delta</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-gray-500">Security & Roles</div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {auditLogs.filter(l => l.action === 'APPROVE' || l.action === 'DELETE').length}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Governance transactions</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-gray-500">Active Operators</div>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {new Set(auditLogs.map(l => l.user)).size}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Registered staff & admins</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user, record, audit ID or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Filter className="w-3.5 h-3.5" /> Module:
          </div>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:ring-yellow-400 focus:border-yellow-400"
          >
            {modules.map((m) => (
              <option key={m} value={m}>
                {m === 'all' ? 'All Modules' : m}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-2">
            Action:
          </div>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:ring-yellow-400 focus:border-yellow-400"
          >
            {actions.map((a) => (
              <option key={a} value={a}>
                {a === 'all' ? 'All Actions' : a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Audit Event ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Activity Description</th>
                <th className="px-4 py-3 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const isUpdate = log.action === 'UPDATE';
                const isCreate = log.action === 'CREATE';
                const isDelete = log.action === 'DELETE';
                const isApprove = log.action === 'APPROVE';

                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{log.id}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {log.user}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCreate ? 'bg-emerald-100 text-emerald-800' :
                        isUpdate ? 'bg-blue-100 text-blue-800' :
                        isDelete ? 'bg-rose-100 text-rose-800' :
                        isApprove ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium">{log.module}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{log.recordName}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.details}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Detailed Payload Diff"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Slideover / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-yellow-700">{selectedLog.id}</span>
                <h2 className="text-lg font-bold text-gray-900">Audit Record Inspection</h2>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                <div>
                  <div className="text-gray-500 uppercase font-semibold text-[10px]">Timestamp</div>
                  <div className="font-mono font-bold text-gray-900 mt-0.5">{selectedLog.timestamp}</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold text-[10px]">Operator</div>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedLog.user}</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold text-[10px]">Action Type</div>
                  <div className="font-bold text-yellow-700 mt-0.5">{selectedLog.action}</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold text-[10px]">Target Module</div>
                  <div className="font-bold text-gray-900 mt-0.5">{selectedLog.module}</div>
                </div>
              </div>

              <div>
                <div className="text-gray-500 uppercase font-semibold text-[10px] mb-1">Target Entity Identifier</div>
                <div className="p-2.5 bg-gray-100 rounded-lg font-bold text-gray-900">{selectedLog.recordName}</div>
              </div>

              <div>
                <div className="text-gray-500 uppercase font-semibold text-[10px] mb-1">Action Description</div>
                <div className="p-3 bg-white border border-gray-200 rounded-lg text-gray-800 leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>

              {selectedLog.oldValue && selectedLog.newValue && (
                <div>
                  <div className="text-gray-500 uppercase font-semibold text-[10px] mb-1">Data Mutation Diff</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="font-bold text-red-900 text-[11px] mb-1">Previous Value</div>
                      <div className="font-mono text-red-800">{selectedLog.oldValue}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <div className="font-bold text-emerald-900 text-[11px] mb-1">Updated Value</div>
                      <div className="font-mono text-emerald-800">{selectedLog.newValue}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-900 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Digitally signed and cryptographically hashed for EDB internal audit integrity.</span>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
