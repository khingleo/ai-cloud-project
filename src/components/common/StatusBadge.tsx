/**
 * MTN ENTERPRISE HUB - STATUS BADGE COMPONENT
 * 
 * Provides consistent status styling for Customer, Opportunity, Lead, Approval, and Service health.
 */

import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  variant?: 'stage' | 'priority' | 'approval' | 'health' | 'default';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
}) => {
  const getBadgeStyle = (): string => {
    switch (status) {
      // General / Customer / Active Service
      case 'Active':
      case 'Completed':
      case 'Won':
      case 'Approved':
      case 'Verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'In Progress':
      case 'Testing':
      case 'Negotiation':
      case 'Proposal':
        return 'bg-blue-50 text-blue-700 border-blue-200';

      case 'Pending':
      case 'Qualification':
      case 'Discovery':
      case 'Presales':
      case 'Contacted':
      case 'Assessment':
      case 'Technical Review':
      case 'Planning':
      case 'Pending Review':
        return 'bg-amber-50 text-amber-800 border-amber-300';

      case 'New':
      case 'Not Started':
      case 'Prospect':
      case 'To Do':
      case 'Waiting':
        return 'bg-slate-100 text-slate-700 border-slate-200';

      case 'Suspended':
      case 'Delayed':
      case 'Degraded':
      case 'Overdue':
      case 'Returned':
      case 'Critical':
      case 'High':
        return 'bg-orange-50 text-orange-800 border-orange-200';

      case 'Lost':
      case 'Rejected':
      case 'Unqualified':
      case 'Dormant':
      case 'Under Maintenance':
        return 'bg-rose-50 text-rose-700 border-rose-200';

      case 'Converted':
        return 'bg-purple-50 text-purple-700 border-purple-200';

      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${sizeClasses} ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
};
