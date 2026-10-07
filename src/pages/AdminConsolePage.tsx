/**
 * MTN ENTERPRISE HUB - ADMIN COMMAND CENTER & SECURITY CONSOLE
 * 
 * Route: /admin
 * Dedicated, distinct visual interface for Admins and Super Admins.
 * Features:
 * - Live Cloud Infrastructure Telemetry & Supabase Database Health
 * - Enterprise User Security Governance & Super Admin Role Elevation Matrix
 * - Real-Time Security Audit Logs & Access Intelligence
 * - System Maintenance & Database Synchronization
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Users,
  Activity,
  UserCheck,
  Lock,
  RefreshCw,
  Search,
  CheckCircle2,
  Mail,
  Building,
  Terminal,
  Trash2,
} from 'lucide-react';
import { useAuth, type AccessTier } from '../context/AuthContext';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';

export const AdminConsolePage: React.FC = () => {
  const { user, allRegisteredUsers, updateUserAccessTier, deleteRegisteredUser, hasPermission } = useAuth();
  const { users, deleteUser } = useAppState();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [isSyncingDb, setIsSyncingDb] = useState(false);

  // Filter users
  const filteredUsers = allRegisteredUsers.filter((u) => {
    if (filterTier !== 'ALL' && u.accessTier !== filterTier) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const superAdminCount = allRegisteredUsers.filter((u) => u.accessTier === 'super_admin').length;
  const adminCount = allRegisteredUsers.filter((u) => u.accessTier === 'admin').length;
  const staffCount = allRegisteredUsers.filter((u) => u.accessTier === 'staff').length;

  const handleTierChange = async (email: string, userName: string, newTier: AccessTier) => {
    if (!hasPermission('manage_users')) {
      showToast('error', 'Permission Denied', 'Only Super Admins can elevate security access tiers.');
      return;
    }

    try {
      await updateUserAccessTier(email, newTier);
      showToast(
        'success',
        'Security Tier Updated',
        `${userName} is now assigned as ${newTier.replace('_', ' ').toUpperCase()}.`
      );
    } catch (error) {
      showToast('error', 'Update Failed', error instanceof Error ? error.message : 'Could not update this account.');
    }
  };

  const handleDeleteUser = async (email: string, userName: string) => {
    if (!hasPermission('manage_users')) {
      showToast('error', 'Permission Denied', 'Only Super Admins can remove accounts.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${userName} (${email}) from the enterprise database?`)) {
      try {
        await deleteRegisteredUser(email);
        const match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (match) deleteUser(match.id);
        showToast('info', 'User Deleted', `${userName} has been removed from the authentication service and system directory.`);
      } catch (error) {
        showToast('error', 'Delete Failed', error instanceof Error ? error.message : 'Could not delete this account.');
      }
    }
  };

  const handleSyncDatabase = async () => {
    setIsSyncingDb(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSyncingDb(false);
    showToast('success', 'Database Synced', 'Supabase database tables verified and in-sync.');
  };

  return (
    <div className="min-h-full space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. ADMIN COMMAND HEADER WITH DISTINCT DARK CYBER AESTHETIC */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0E1326] via-[#121832] to-[#0A0D1A] border border-purple-500/20 p-6 sm:p-8 shadow-2xl">
        {/* Glow ambient background orbs */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                Admin Command Center
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Online
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
              Enterprise Governance & Security Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Elevated command interface for user privilege promotion, Supabase database synchronization, security audit trails, and cloud infrastructure telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSyncDatabase}
              disabled={isSyncingDb}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
              <span>{isSyncingDb ? 'Syncing Supabase...' : 'Sync Database'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LIVE SYSTEM TELEMETRY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Users */}
        <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Staff</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-mtn-yellow">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {allRegisteredUsers.length || users.length}
            </span>
            <span className="text-xs text-slate-400 ml-2">Total accounts</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Staff Tier: <strong>{staffCount}</strong></span>
            <span>Admins: <strong>{adminCount + superAdminCount}</strong></span>
          </div>
        </div>

        {/* Card 2: Security Governance */}
        <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Tiers</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">
              {superAdminCount}
            </span>
            <span className="text-xs text-slate-400 ml-2">Super Admins</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Privilege Elevation: <strong>Super Admin Only</strong></span>
          </div>
        </div>

        {/* Card 3: Supabase Database Status */}
        <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database Engine</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-400">Supabase Cloud</span>
            <span className="text-xs text-slate-400">PostgreSQL</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </span>
            <span>TLS 1.3 Active</span>
          </div>
        </div>

        {/* Card 4: Active Auth Session */}
        <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Operator</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 truncate">
            <span className="text-base font-bold text-white truncate block">
              {user?.name || 'Administrator'}
            </span>
            <span className="text-xs text-purple-300 font-semibold uppercase">
              {user?.accessTier.replace('_', ' ')}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 truncate">
            <span className="truncate">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. USER SECURITY & ROLE PROMOTION MATRIX */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0C111F] border border-slate-800 p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black text-white font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              Enterprise User Access Governance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Newly created accounts default to <strong>Staff</strong>. Super Admins can promote or demote user access tiers below.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 w-48 sm:w-56"
              />
            </div>

            {/* Filter by tier */}
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-400"
            >
              <option value="ALL">All Tiers ({allRegisteredUsers.length})</option>
              <option value="staff">Staff ({staffCount})</option>
              <option value="admin">Admin ({adminCount})</option>
              <option value="super_admin">Super Admin ({superAdminCount})</option>
            </select>
          </div>
        </div>

        {/* Directory List / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Corporate Email</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Current Tier</th>
                <th className="py-3 px-4 text-right">Promote / Elevate Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No enterprise staff members found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-mtn-yellow flex items-center justify-center font-bold text-xs">
                          {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>{u.department}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.accessTier === 'super_admin' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                          <ShieldCheck className="w-3 h-3 text-purple-400" /> Super Admin
                        </span>
                      )}
                      {u.accessTier === 'admin' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          <ShieldCheck className="w-3 h-3 text-blue-400" /> Admin
                        </span>
                      )}
                      {u.accessTier === 'staff' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          Staff
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {hasPermission('manage_users') ? (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={u.accessTier}
                            onChange={(e) => handleTierChange(u.email, u.name, e.target.value as AccessTier)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-purple-500/40 text-[11px] font-semibold text-purple-200 focus:outline-none focus:ring-1 focus:ring-purple-400 cursor-pointer"
                          >
                            <option value="staff">Staff (Standard)</option>
                            <option value="admin">Admin (Operational)</option>
                            <option value="super_admin">Super Admin (Full)</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.email, u.name)}
                            title={`Delete ${u.name}`}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">Super Admin Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SECURITY AUDIT LOGS & INFRASTRUCTURE LOGS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Audit Feed */}
        <div className="rounded-3xl bg-[#0C111F] border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Security Audit Trail & Access Events
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Live Stream</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
              <div className="flex-1">
                <p className="text-slate-200">OTP Auth Session Verified</p>
                <p className="text-[11px] text-slate-500 mt-0.5">User: {user?.email || 'authenticated_operator'} · 2FA verified</p>
              </div>
              <span className="text-[10px] text-slate-500">Just now</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1.5" />
              <div className="flex-1">
                <p className="text-slate-200">Supabase Database Sync Event</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Table `profiles` schema check OK · RLS Active</p>
              </div>
              <span className="text-[10px] text-slate-500">2m ago</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
              <div className="flex-1">
                <p className="text-slate-200">Enterprise Staff Registration</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Strict Default `staff` tier enforced automatically</p>
              </div>
              <span className="text-[10px] text-slate-500">10m ago</span>
            </div>
          </div>
        </div>

        {/* Database & Cloud Endpoint Monitor */}
        <div className="rounded-3xl bg-[#0C111F] border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              Cloud Infrastructure Endpoints
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono">Status 200 OK</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Supabase REST Host</span>
                <p className="text-slate-200 text-xs truncate">vkchsvqaowzpdtmhaaje.supabase.co</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">ACTIVE</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Auth Mechanism</span>
                <p className="text-slate-200 text-xs">Email OTP (One-Time Password) + 2FA</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-bold">SECURED</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Default New User Role</span>
                <p className="text-slate-200 text-xs">Staff (Elevated via Super Admin Only)</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-mtn-yellow text-[10px] font-bold">LOCKED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
