/**
 * MTN ENTERPRISE HUB - PAGE HEADER
 * 
 * Standard page header with title, subtitle, breadcrumb links, and action CTA buttons.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
}) => {
  return (
    <div className="mb-6 pb-4 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2 font-medium">
            <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
              Enterprise Hub
            </Link>
            {breadcrumbs.map((crumb, idx) => {
              const target = crumb.path || crumb.href;
              return (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {target ? (
                    <Link to={target} className="hover:text-slate-900 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-800 font-semibold">{crumb.label}</span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-heading">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-3xl">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
};
