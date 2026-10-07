/**
 * MTN ENTERPRISE HUB - EMPTY STATE COMPONENT
 */

import React from 'react';
import { FolderSearch, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderSearch,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-mtn-yellow-600 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-base sm:text-lg font-bold text-slate-800 font-heading">{title}</h4>
      <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-900 bg-mtn-yellow hover:bg-mtn-yellow-400 rounded-xl transition-all duration-150 shadow-sm hover:shadow"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
