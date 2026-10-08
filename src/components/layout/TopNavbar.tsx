/**
 * MTN ENTERPRISE HUB - TOP NAVIGATION NAVBAR
 *
 * Includes Global Search trigger, Quick notification drawer, and User Profile menu.
 * Integrates with AuthContext for role display, logout, and permission-based link visibility.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  User,
  LogOut,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface TopNavbarProps {
  onMobileMenuClick: () => void;
  onOpenGlobalSearch: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onMobileMenuClick,
  onOpenGlobalSearch,
}) => {
  const { notifications, markNotificationAsRead } = useAppState();
  const { user: authUser, tierLabel, logout, hasPermission, isAtLeast } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Keyboard shortcut: Ctrl+K or Cmd+K opens global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenGlobalSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenGlobalSearch]);

  // Derive human friendly page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Enterprise Dashboard';
    if (path.startsWith('/admin')) return 'Admin Command Center & Governance';
    if (path.startsWith('/customers')) return 'Enterprise Customers';
    if (path.startsWith('/leads')) return 'Lead Management';
    if (path.startsWith('/opportunities')) return 'Opportunities Pipeline';
    if (path.startsWith('/products')) return 'Products & Services Catalogue';
    if (path.startsWith('/presales')) return 'Presales & Technical Assessments';
    if (path.startsWith('/documents')) return 'Document Repository';
    if (path.startsWith('/approvals')) return 'Approval Workflow Desk';
    if (path.startsWith('/service-delivery')) return 'Service Delivery & Provisioning';
    if (path.startsWith('/active-services')) return 'Active Services Inventory';
    if (path.startsWith('/tasks')) return 'Operational Tasks';
    if (path.startsWith('/ai-assistant')) return 'AI Knowledge Assistant';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    if (path.startsWith('/notifications')) return 'Notifications Center';
    if (path.startsWith('/users')) return 'Users & Access Control';
    if (path.startsWith('/settings')) return 'System Settings';
    return 'MTN Enterprise Hub';
  };

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false);
    try {
      const error = await logout();
      if (error) showToast('error', 'Sign out issue', error);
    } catch (error) {
      showToast(
        'error',
        'Sign out failed',
        error instanceof Error ? error.message : 'An unexpected error occurred.',
      );
    } finally {
      navigate('/login');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm px-3 sm:px-6 py-2.5 sm:py-3 transition-colors">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Mobile Toggle & Page Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onMobileMenuClick}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:block min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                MTN Ghana EBU
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate font-heading leading-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Center: Global Search Bar Button */}
          <div className="flex-1 min-w-0 max-w-lg mx-1 sm:mx-6">
            <button
              type="button"
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-2.5 sm:px-3.5 py-2 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 transition-all group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-mtn-yellow-600 shrink-0" />
                <span className="truncate">Search customers, products, opportunities, documents...</span>
              </div>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-white rounded border border-slate-300 shadow-xs">
                <span>⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Right: Actions, Notifications & Profile */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Help Button */}
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Architecture & Help Guide"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  setIsProfileDropdownOpen(false);
                }}
                className="relative p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {isNotifDropdownOpen && (
                <div className="fixed left-2 right-2 top-[4.25rem] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96 sm:max-h-none sm:overflow-visible">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      {unreadCount} unread
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                          !n.read ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-slate-900 leading-snug">{n.title}</p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-normal">{n.message}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-2 border-t border-slate-100 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setIsNotifDropdownOpen(false)}
                      className="text-xs font-bold text-mtn-yellow-800 hover:underline inline-flex items-center gap-1"
                    >
                      View All Notifications <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileDropdownOpen(!isProfileDropdownOpen);
                  setIsNotifDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-950 text-mtn-yellow flex items-center justify-center font-bold text-xs shadow-xs">
                  {authUser?.name.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U'}
                </div>
                <div className="hidden xl:block">
                  <p className="text-xs font-bold text-slate-900 leading-none">{authUser?.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{tierLabel}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
              </button>

              {isProfileDropdownOpen && (
                <div className="fixed left-2 right-2 top-[4.25rem] max-h-[calc(100dvh-5rem)] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-64 sm:max-h-none sm:overflow-visible">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-sm font-bold text-slate-900">{authUser?.name}</p>
                    <p className="text-xs text-slate-500">{authUser?.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Online
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800">
                        <Shield className="w-3 h-3" />
                        {tierLabel}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    {isAtLeast('admin') && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50"
                      >
                        <Shield className="w-4 h-4 text-purple-600" /> Admin Command Center
                      </Link>
                    )}
                    {hasPermission('manage_settings') && (
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <User className="w-4 h-4 text-slate-400" /> Profile & Account
                      </Link>
                    )}
                    {hasPermission('manage_users') && (
                      <Link
                        to="/users"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-400" /> Departmental Roles
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Architecture & Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            onClick={() => setIsHelpModalOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-left">
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-mtn-yellow-800">
                    Academic Research Demonstration
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 font-heading mt-0.5">
                    MTN Ghana Enterprise Hub
                  </h3>
                </div>
                <button
                  onClick={() => setIsHelpModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[65vh] overflow-y-auto pr-2">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <h4 className="font-bold text-amber-950 text-sm mb-1">Project Context</h4>
                  <p className="text-amber-900">
                    <strong>"Development of an AI-Powered Cloud Central Repository for Enterprise Service and Customer Management"</strong> is a proposed university prototype designed for MTN Ghana Enterprise Business Unit.
                  </p>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">Key Enterprise Workflow Journey</h4>
                <ol className="list-decimal pl-5 space-y-1.5 font-medium text-slate-700">
                  <li><strong>Customer</strong> ➔ Registered Ghanaian enterprise account.</li>
                  <li><strong>Lead</strong> ➔ Sourced via CEX/Sales & qualified (Cold/Warm/Hot).</li>
                  <li><strong>Opportunity</strong> ➔ 8 stages from New to Closed Won.</li>
                  <li><strong>Product</strong> ➔ 28+ solutions from Excel catalogue (Mobile, Fixed, Digital, Converged).</li>
                  <li><strong>Presales</strong> ➔ Technical scoping & Technology Feasibility Report (TFR).</li>
                  <li><strong>Documentation</strong> ➔ Ghana Cards, signed solution designs, and invoices.</li>
                  <li><strong>6-Tier Approval</strong> ➔ Sales Ops ➔ Credit Control ➔ QA ➔ CENO ➔ DCLM ➔ Service Delivery.</li>
                  <li><strong>Service Delivery</strong> ➔ Field engineering, fiber pulling, and UAT.</li>
                  <li><strong>Active Service</strong> ➔ Live contracted circuit with 24/7 SLA monitoring.</li>
                </ol>

                <h4 className="font-bold text-slate-900 text-sm mt-4">Frontend Architecture</h4>
                <p>
                  Built entirely in React + TypeScript + Vite + Tailwind CSS with decoupled service layers, ready for seamless PostgreSQL/Supabase database and AI API integration in subsequent phases.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsHelpModalOpen(false)}
                  className="px-5 py-2 text-xs sm:text-sm font-bold bg-mtn-yellow text-black rounded-xl hover:bg-mtn-yellow-400 transition-colors shadow-sm"
                >
                  Got It, Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
