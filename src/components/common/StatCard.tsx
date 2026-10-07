/**
 * MTN ENTERPRISE HUB - KPI STAT CARD
 * 
 * Clean corporate KPI card with MTN yellow accent bar and optional trend indicator.
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  accentColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  trend,
  icon: Icon,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top MTN Yellow Accent Strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-mtn-yellow via-mtn-yellow-400 to-amber-400" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 font-heading tracking-tight">
            {value}
          </h3>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900 text-mtn-yellow shadow-inner">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(description || trend) && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
          {description && <span>{description}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-semibold px-2 py-0.5 rounded-full ${
                trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
