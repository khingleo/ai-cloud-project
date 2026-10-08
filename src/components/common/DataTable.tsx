/**
 * MTN ENTERPRISE HUB - DATA TABLE WRAPPER
 * 
 * Clean corporate table layout with search, filters, pagination, and responsive horizontal scrolling.
 */

import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  filterSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchFilter,
  filterSlot,
  actionsSlot,
  pageSize = 8,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search criteria or filters.',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, searchQuery));
  }, [data, searchQuery, searchFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-3 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/40">
        <div className="flex flex-wrap flex-1 items-center gap-3 min-w-0 w-full sm:w-auto">
          {searchFilter && (
            <div className="relative flex-1 min-w-[min(100%,14rem)] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full min-h-11 pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50 focus:border-mtn-yellow transition-all"
              />
            </div>
          )}
          {filterSlot}
        </div>

        {actionsSlot && <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 self-end sm:self-auto max-w-full">{actionsSlot}</div>}
      </div>

      {/* Table Body */}
      <div
        className="overflow-x-auto overscroll-x-contain"
        role="region"
        aria-label="Data table"
        tabIndex={0}
      >
        <table className="w-max min-w-full text-left border-collapse sm:w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`py-3.5 px-4 sm:px-6 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`hover:bg-amber-50/30 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`py-3.5 px-4 sm:px-6 ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : col.accessor
                        ? (item[col.accessor] as unknown as React.ReactNode)
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto">
                    <p className="font-semibold text-slate-700">{emptyTitle}</p>
                    <p className="text-xs text-slate-500 mt-1">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredData.length > pageSize && (
        <div className="p-3 sm:p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/30">
          <span className="min-w-0 flex-1 basis-40">
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * pageSize, filteredData.length)}</strong> of{' '}
            <strong>{filteredData.length}</strong> results
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
