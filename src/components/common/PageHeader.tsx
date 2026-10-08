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
    <div className="mb-5 flex min-w-0 flex-col gap-3 border-b border-slate-200/80 pb-4 sm:mb-6 sm:gap-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-medium text-slate-500">
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
        <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 font-heading sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 max-w-3xl break-words text-sm text-slate-500">{subtitle}</p>}
      </div>

      {actions && (
        <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3 md:w-auto md:shrink-0 [&>*]:min-w-0 [&>*]:max-w-full [&>*]:flex-1 sm:[&>*]:flex-initial">
          {actions}
        </div>
      )}
    </div>
  );
};
