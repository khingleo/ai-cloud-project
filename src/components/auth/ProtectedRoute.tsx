/**
 * MTN ENTERPRISE HUB - ROUTE PROTECTION & PERMISSION GUARD
 * 
 * ProtectedRoute: Wraps route elements to enforce authentication and tier-based access.
 * PermissionGate: Conditionally renders children based on the user's permission actions.
 * 
 * Usage:
 *   <ProtectedRoute requiredTier="admin">
 *     <UsersPage />
 *   </ProtectedRoute>
 * 
 *   <PermissionGate action="delete">
 *     <button>Delete</button>
 *   </PermissionGate>
 */

import React from 'react';
import { useAuth, type AccessTier, type PermissionAction } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

// ==========================================
// ROUTE GUARD — Protects entire pages
// ==========================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Minimum access tier required. Defaults to 'staff' (any authenticated user). */
  requiredTier?: AccessTier;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredTier = 'staff',
}) => {
  const { isAtLeast } = useAuth();

  if (!isAtLeast(requiredTier)) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
};

// ==========================================
// PERMISSION GATE — Hides/shows UI elements
// ==========================================

interface PermissionGateProps {
  /** The action to check (e.g., 'edit', 'delete', 'export'). Can also be an array — user must have ALL listed actions. */
  action: PermissionAction | PermissionAction[];
  children: React.ReactNode;
  /** Optional fallback to render when permission is denied */
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  action,
  children,
  fallback = null,
}) => {
  const { hasPermission } = useAuth();

  const actions = Array.isArray(action) ? action : [action];
  const allowed = actions.every((a) => hasPermission(a));

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// ==========================================
// ACCESS DENIED PAGE — Shown for unauthorized route access
// ==========================================

const AccessDeniedPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-heading mb-2">
          Access Denied
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Your current access tier does not have permission to view this page.
          Please contact your Super Admin to request elevated privileges.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-mtn-yellow hover:bg-mtn-yellow-400 text-black font-bold text-sm rounded-xl shadow-sm transition-colors"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};
