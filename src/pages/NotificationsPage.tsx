/**
 * MTN ENTERPRISE HUB - NOTIFICATIONS CENTER
 * 
 * Route: /notifications
 * Centralized activity and alert center across approvals, tasks, deals, and documents.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  ShieldCheck,
  FileText,
  Truck,
  CheckSquare,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAppState();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UNREAD' | 'Approval' | 'Opportunity' | 'Delivery' | 'Task'>('ALL');

  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === 'UNREAD') return !n.read;
    if (selectedFilter !== 'ALL' && n.category !== selectedFilter) return false;
    return true;
  });

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    showToast('info', 'All Read', 'All notifications marked as read.');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Approval':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'Opportunity':
        return <Flame className="w-4 h-4 text-mtn-yellow-800" />;
      case 'Document':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'Delivery':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'Task':
        return <CheckSquare className="w-4 h-4 text-slate-700" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Notifications & Activity Log"
        subtitle="System alerts, pending approval reminders, and real-time delivery milestones"
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'UNREAD', label: 'Unread' },
          { id: 'Approval', label: 'Approvals' },
          { id: 'Opportunity', label: 'Opportunities' },
          { id: 'Delivery', label: 'Deliveries' },
          { id: 'Task', label: 'Tasks' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedFilter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm divide-y divide-slate-100">
        {filteredNotifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => {
              markNotificationAsRead(notif.id);
              if (notif.link) navigate(notif.link);
            }}
            className={`py-4 px-3 rounded-2xl transition-colors cursor-pointer flex items-start justify-between gap-4 ${
              !notif.read ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                {getCategoryIcon(notif.category)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-mtn-yellow ring-2 ring-white shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                <span className="text-[10px] text-slate-400 mt-2 block flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {notif.timestamp}
                </span>
              </div>
            </div>

            {notif.link && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markNotificationAsRead(notif.id);
                  navigate(notif.link!);
                }}
                className="text-xs font-bold text-mtn-yellow-800 hover:underline shrink-0 inline-flex items-center gap-1 p-1"
              >
                Open <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            No notifications in this view.
          </div>
        )}
      </div>
    </div>
  );
};
