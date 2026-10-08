/**
 * MTN GHANA EBU — ENTERPRISE SIDEBAR
 *
 * Desktop: fixed-width sidebar with smooth slide-in/out collapse (w-64 ↔ w-16).
 * Mobile : full overlay drawer that slides in from the left over the page.
 * Both transitions use CSS `transition` so they animate correctly.
 */

import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Server,
  DollarSign,
  FileText,
  UploadCloud,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Compass,
  LogOut,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface SidebarProps {
  /** Mobile overlay: is the drawer open? */
  isMobileOpen?: boolean;
  /** Mobile overlay: callback to close */
  onMobileClose?: () => void;
  /** Desktop: is it collapsed to icon-only rail? */
  isCollapsed?: boolean;
  /** Desktop: toggle collapse state */
  onToggleCollapse?: () => void;
}

interface SubItem {
  label: string;
  path: string;
  badge?: string | number;
  badgeColor?: string;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultPath?: string;
  badge?: string | number;
  badgeColor?: string;
  requiredAdmin?: boolean;
  items?: SubItem[];
}

// ─── Sidebar Inner Content ───────────────────────────────────────────────────
const SidebarContent: React.FC<{
  collapsed: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  isDesktop?: boolean;
}> = ({ collapsed, onClose, onToggleCollapse, isDesktop }) => {
  const { approvals, notifications } = useAppState();
  const { isAtLeast, user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const pendingApprovals = approvals.filter((a) => a.status === 'Pending').length;
  const unreadNotifs     = notifications.filter((n) => !n.read).length;

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'customer-mgmt': true,
    'service-mgmt': false,
    'technical': false,
    'commercial': false,
    'operations': false,
    'data-mgmt': false,
    'insights': false,
    'system': false,
  });

  // When collapsed, treat every section as closed without mutating state
  const sectionIsOpen = (id: string) => !collapsed && !!openSections[id];

  const toggle = (id: string) => {
    if (collapsed) return;
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const SECTIONS: NavSection[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      defaultPath: '/dashboard',
    },
    {
      id: 'customer-mgmt',
      title: 'Customer Management',
      icon: Building2,
      items: [
        { label: 'Customers Directory', path: '/customers' },
        { label: 'Add New Customer', path: '/customers/new' },
      ],
    },
    {
      id: 'service-mgmt',
      title: 'Service Management',
      icon: Layers,
      items: [
        { label: 'Service Subscriptions', path: '/subscriptions' },
        { label: 'Products & Tariffs', path: '/products' },
        { label: 'Presales & Assessment', path: '/presales' },
        { label: 'Service Delivery', path: '/service-delivery' },
        { label: 'Active Services', path: '/active-services' },
      ],
    },
    {
      id: 'technical',
      title: 'Technical',
      icon: Server,
      items: [
        { label: 'Network Configuration', path: '/network' },
        { label: 'Circuit Connectivity', path: '/network' },
        { label: 'IP & Subnets', path: '/network' },
      ],
    },
    {
      id: 'commercial',
      title: 'Commercial',
      icon: DollarSign,
      items: [
        { label: 'Tariff Price Book', path: '/pricing' },
        { label: 'Billing & Invoices', path: '/billing' },
        { label: 'Enterprise Revenue', path: '/revenue' },
      ],
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: FileText,
      defaultPath: '/documents',
    },
    {
      id: 'operations',
      title: 'Operations',
      icon: Compass,
      items: [
        { label: 'Universal Search', path: '/search' },
        {
          label: 'Approvals & Reviews',
          path: '/approvals',
          badge: pendingApprovals > 0 ? pendingApprovals : undefined,
          badgeColor: 'bg-yellow-400 text-black',
        },
        { label: 'Tasks', path: '/tasks' },
        { label: 'Leads', path: '/leads' },
        { label: 'Opportunities', path: '/opportunities' },
      ],
    },
    {
      id: 'data-mgmt',
      title: 'Data Management',
      icon: UploadCloud,
      items: [
        { label: 'Excel & CSV Import', path: '/import' },
        { label: 'Data Quality Center', path: '/data-quality' },
      ],
    },
    {
      id: 'insights',
      title: 'Insights & AI',
      icon: BarChart3,
      items: [
        { label: 'Reports & Analytics', path: '/reports' },
        {
          label: 'AI Knowledge Assistant',
          path: '/ai-assistant',
          badge: 'AI',
          badgeColor: 'bg-yellow-400 text-black',
        },
      ],
    },
    {
      id: 'system',
      title: 'System & Security',
      icon: ShieldCheck,
      requiredAdmin: false,
      items: [
        {
          label: 'Notifications',
          path: '/notifications',
          badge: unreadNotifs > 0 ? unreadNotifs : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        { label: 'Audit Log', path: '/audit' },
        ...(isAtLeast('admin')
          ? [
              { label: 'Admin Console', path: '/admin' },
              { label: 'Users & Roles', path: '/users' },
              { label: 'Settings', path: '/settings' },
            ]
          : []),
      ],
    },
  ];

  const handleLogout = async () => {
    const error = await logout();
    if (error) showToast('error', 'Sign-out activity issue', error);
    navigate('/login');
  };

  const userInitials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U';

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f] border-r border-white/6 overflow-hidden">

      {/* ── Brand Header ─────────────────────────────────────── */}
      <div className={`flex items-center shrink-0 border-b border-white/6 bg-black/30 transition-all duration-300 ${collapsed ? 'px-3 py-4 justify-center' : 'px-4 py-3.5 gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center font-black text-black text-[11px] tracking-tight shadow-md shrink-0">
          MTN
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="text-[11px] font-extrabold text-white uppercase tracking-widest leading-tight truncate font-heading">
              EBU Repository
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <p className="text-[10px] text-slate-500 truncate">Enterprise Data Vault</p>
            </div>
          </div>
        )}

        {/* Mobile close */}
        {!isDesktop && onClose && (
          <button
            onClick={onClose}
            className="ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-lg p-1.5 text-slate-500 transition shrink-0 hover:bg-white/8 hover:text-white"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Desktop collapse toggle */}
        {isDesktop && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition shrink-0 ${collapsed ? 'mt-0' : 'ml-auto'}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* ── User Role Pill ───────────────────────────────────── */}
      {!collapsed && user && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-yellow-400/8 border border-yellow-400/15 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-800 text-yellow-400 flex items-center justify-center font-bold text-[10px] shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">{user.name}</p>
            <p className="text-[10px] text-slate-500 truncate leading-tight">{user.department}</p>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-yellow-400 text-black shrink-0">
            {user.accessTier.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Collapsed avatar */}
      {collapsed && user && (
        <div className="flex justify-center mt-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800 text-yellow-400 flex items-center justify-center font-bold text-[10px]">
            {userInitials}
          </div>
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overscroll-contain py-3 px-2 space-y-0.5 no-scrollbar">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = sectionIsOpen(section.id);
          const hasChildren = !!(section.items?.length);
          const isActive = section.defaultPath
            ? location.pathname === section.defaultPath
            : section.items?.some((item) => location.pathname.startsWith(item.path)) ?? false;

          if (!hasChildren) {
            return (
              <NavLink
                key={section.id}
                to={section.defaultPath || '/'}
                onClick={onClose}
                title={collapsed ? section.title : undefined}
                className={({ isActive: a }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    a
                      ? 'bg-yellow-400 text-black font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-white/6'
                  } ${!isDesktop ? 'min-h-11' : ''} ${collapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{section.title}</span>}
              </NavLink>
            );
          }

          return (
            <div key={section.id}>
              {/* Section header button */}
              <button
                type="button"
                onClick={() => toggle(section.id)}
                title={collapsed ? section.title : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive && !isOpen
                    ? 'text-yellow-400 bg-yellow-400/8'
                    : isOpen
                    ? 'text-yellow-400 bg-white/4'
                    : 'text-slate-400 hover:text-white hover:bg-white/6'
                } ${!isDesktop ? 'min-h-11' : ''} ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{section.title}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </>
                )}
              </button>

              {/* Animated sub-items */}
              {!collapsed && (
                <div
                  className={`overflow-hidden transition-all duration-250 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="ml-4 pl-3 border-l border-white/6 my-1 space-y-0.5">
                    {section.items!.map((sub, idx) => (
                      <NavLink
                        key={`${sub.path}-${idx}`}
                        to={sub.path}
                        onClick={onClose}
                        className={({ isActive: a }) =>
                          `flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                            a
                              ? 'text-yellow-400 font-bold bg-yellow-400/8'
                              : 'text-slate-500 hover:text-slate-200 hover:bg-white/4'
                          } ${!isDesktop ? 'min-h-11' : ''}`
                        }
                      >
                        <span className="truncate">{sub.label}</span>
                        {sub.badge !== undefined && (
                          <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ${sub.badgeColor || 'bg-slate-700 text-white'}`}>
                            {sub.badge}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── AI Footer Banner ─────────────────────────────────── */}
      {!collapsed && (
        <div className="m-3 p-3 rounded-xl bg-gradient-to-br from-yellow-950/50 to-black border border-yellow-500/15 shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            <span className="text-xs font-bold text-white">EBU Knowledge AI</span>
            <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 bg-yellow-400/15 text-yellow-300 rounded font-bold">v4.2</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug mb-2">
            Instant search across tariffs, pricing & customer circuits.
          </p>
          <NavLink
            to="/ai-assistant"
            onClick={onClose}
            className="block text-center py-1.5 rounded-lg text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-black transition-colors"
          >
            Launch AI Assistant
          </NavLink>
        </div>
      )}

      {/* ── Sign Out ─────────────────────────────────────────── */}
      <div className={`shrink-0 border-t border-white/6 p-2 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-400 hover:bg-rose-500/6 transition-colors ${
            !isDesktop ? 'min-h-11' : ''
          } ${collapsed ? 'justify-center w-10' : 'w-full'}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

// ─── Exported Sidebar ────────────────────────────────────────────────────────
export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const mobileCloseRef = useRef(onMobileClose);
  mobileCloseRef.current = onMobileClose;

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') mobileCloseRef.current?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen]);

  return (
    <>
      {/* ── Desktop: slide-in/out rail ─────────────────────── */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent
          collapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
          isDesktop
        />
      </aside>

      {/* ── Mobile: overlay drawer ─────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={onMobileClose}
        className={`lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overscroll-contain transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent
          collapsed={false}
          onClose={onMobileClose}
          isDesktop={false}
        />
      </div>
    </>
  );
};
