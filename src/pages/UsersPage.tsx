/**
 * MTN ENTERPRISE HUB - USERS & ROLES DIRECTORY (CRUD)
 * 
 * Route: /users
 * Departmental personnel directory across all 12 enterprise governance roles.
 * Features:
 * - Add new enterprise staff member modal with phone, role, department, status
 * - Edit user role, department, status, phone, email modal
 * - Delete user confirmation modal
 * - Role filter toolbar and live user count
 */

import React, { useState } from 'react';
import {
  PlusCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  Phone,
  Mail,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { useAuth, type AccessTier } from '../context/AuthContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import type { EnterpriseUser, UserRole } from '../types';

const ENTERPRISE_ROLES: UserRole[] = [
  'Key Account Manager',
  'Sales Agent',
  'Segment Manager',
  'Presales',
  'Sales Operations',
  'Credit Control',
  'Quality Assurance',
  'CENO',
  'DCLM',
  'Service Delivery',
  'Finance',
  'Administrator',
];

export const UsersPage: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useAppState();
  const { allRegisteredUsers, updateUserAccessTier, deleteRegisteredUser, hasPermission } = useAuth();
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<EnterpriseUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<EnterpriseUser | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+233 24 ');
  const [role, setRole] = useState<UserRole>('Key Account Manager');
  const [accessTier, setAccessTier] = useState<AccessTier>('staff');
  const [department, setDepartment] = useState('Enterprise Business Unit (EBU)');
  const [status, setStatus] = useState<'Active' | 'Away' | 'Inactive'>('Active');

  const filteredUsers = users.filter((u) => {
    if (selectedRole !== 'ALL' && u.role !== selectedRole) return false;
    return true;
  });

  const getUserTier = (userEmail: string): AccessTier => {
    const found = allRegisteredUsers.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
    if (found) return found.accessTier;
    return 'staff';
  };

  const openAddModal = () => {
    setName('');
    setEmail('');
    setPhone('+233 24 000 0000');
    setRole('Key Account Manager');
    setAccessTier('staff');
    setDepartment('Enterprise Business Unit (EBU)');
    setStatus('Active');
    setIsAddModalOpen(true);
  };

  const openEditModal = (u: EnterpriseUser) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPhone(u.phone || '+233 24 000 0000');
    setRole(u.role);
    setAccessTier(getUserTier(u.email));
    setDepartment(u.department);
    setStatus(u.status);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('error', 'Validation Error', 'Name and corporate email are required.');
      return;
    }

    addUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+233 24 000 0000',
      role,
      department: department.trim() || 'Enterprise Business Unit (EBU)',
      status,
      lastActive: 'Just now',
    });

    if (accessTier !== 'staff' && hasPermission('manage_users')) {
      const account = allRegisteredUsers.find((registered) => registered.email.toLowerCase() === email.trim().toLowerCase());
      if (!account) {
        showToast('info', 'Access Tier Not Applied', 'The account must sign up and verify its email before its access tier can be changed.');
      } else {
        try {
          await updateUserAccessTier(account.id, accessTier);
        } catch (error) {
          showToast('error', 'Access Tier Update Failed', error instanceof Error ? error.message : 'Could not update this account.');
        }
      }
    }

    showToast('success', 'User Added', `${name} registered as ${role}.`);
    setIsAddModalOpen(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !name.trim()) return;

    const account = allRegisteredUsers.find((registered) => registered.email.toLowerCase() === editingUser.email.toLowerCase());
    if (hasPermission('manage_users') && account) {
      try {
        await updateUserAccessTier(account.id, accessTier);
      } catch (error) {
        showToast('error', 'User Update Failed', error instanceof Error ? error.message : 'Could not update this account.');
        return;
      }
    }

    updateUser(editingUser.id, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      department: department.trim(),
      status,
    });

    showToast('success', 'User Updated', `Permissions and details saved for ${name}.`);
    setEditingUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    const account = allRegisteredUsers.find((registered) => registered.email.toLowerCase() === userToDelete.email.toLowerCase());
    if (account) {
      try {
        await deleteRegisteredUser(account.id);
      } catch (error) {
        showToast('error', 'Delete Failed', error instanceof Error ? error.message : 'Could not delete this account.');
        return;
      }
    }
    deleteUser(userToDelete.id);
    showToast('info', 'User Removed', `${userToDelete.name} removed from enterprise directory and database.`);
    setUserToDelete(null);
  };

  const columns: Column<EnterpriseUser>[] = [
    {
      header: 'Staff Member',
      accessor: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-mtn-yellow flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm hover:text-amber-900 transition-colors">
              {u.name}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {u.email}</span>
              {u.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {u.phone}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Enterprise Role',
      accessor: (u) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
          {u.role}
        </span>
      ),
    },
    {
      header: 'Security Tier',
      accessor: (u) => {
        const tier = getUserTier(u.email);
        if (tier === 'super_admin') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <ShieldCheck className="w-3 h-3 text-purple-600" /> Super Admin
            </span>
          );
        }
        if (tier === 'admin') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              <Shield className="w-3 h-3 text-blue-600" /> Admin
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Staff
          </span>
        );
      },
    },
    {
      header: 'Department / Unit',
      accessor: (u) => <span className="text-xs text-slate-700 font-medium">{u.department}</span>,
    },
    {
      header: 'Status',
      accessor: (u) => <StatusBadge status={u.status} size="sm" />,
    },
    {
      header: 'Last Active',
      accessor: (u) => <span className="text-xs text-slate-500">{u.lastActive}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <PermissionGate action="edit">
            <button
              onClick={() => openEditModal(u)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit User"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <PermissionGate action="delete">
            <button
              onClick={() => setUserToDelete(u)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete User"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Enterprise Users & Departmental Roles"
        subtitle="Manage access permissions across Sales, Presales, Credit Control, QA, CENO, and Service Delivery"
        breadcrumbs={[{ label: 'Users & Roles' }]}
        actions={
          <PermissionGate action="add">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </PermissionGate>
        }
      />

      {/* Role Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Filter by Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
          >
            <option value="ALL">All Roles ({users.length})</option>
            {ENTERPRISE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r} ({users.filter((u) => u.role === r).length})
              </option>
            ))}
          </select>
        </div>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          Showing <strong>{filteredUsers.length}</strong> enterprise staff members
        </span>
      </div>

      {/* Users Directory Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        searchPlaceholder="Search users by name, role, or department..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return (
            item.name.toLowerCase().includes(q) ||
            item.role.toLowerCase().includes(q) ||
            item.department.toLowerCase().includes(q) ||
            item.email.toLowerCase().includes(q)
          );
        }}
      />

      {/* ADD USER MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Enterprise Staff Member"
        subtitle="Provision account for new MTN Ghana personnel"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ing. Abena Osei"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">MTN Corporate Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abena.osei@mtn.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghana Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 24 123 4567"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Enterprise Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                {ENTERPRISE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Away' | 'Inactive')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Active">Active</option>
                <option value="Away">Away</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department / Business Unit</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Enterprise Business Unit (EBU)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs transition-all"
            >
              Add User
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit Staff Member"
        subtitle={`Update role & permissions for ${editingUser?.name}`}
        maxWidth="md"
      >
        {editingUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Enterprise Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  {ENTERPRISE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Away' | 'Inactive')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Active">Active</option>
                  <option value="Away">Away</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* SUPER ADMIN ROLE ELEVATION */}
            {hasPermission('manage_users') && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <label className="block text-xs font-bold text-purple-950 uppercase mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  Security Access Tier (Super Admin Role Management)
                </label>
                <p className="text-[11px] text-purple-700 mb-2">
                  Elevate or restrict this user&apos;s system privileges across the platform.
                </p>
                <select
                  value={accessTier}
                  onChange={(e) => setAccessTier(e.target.value as AccessTier)}
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-semibold text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="staff">Staff (Standard operational access, cannot access Admin/Users settings)</option>
                  <option value="admin">Admin (Operational + user & settings management)</option>
                  <option value="super_admin">Super Admin (Full governance & role promotion power)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-mtn-yellow hover:bg-mtn-yellow-400 text-black rounded-xl shadow-xs transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Delete Staff Member"
        maxWidth="sm"
      >
        {userToDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs">
                Are you sure you want to remove <strong>{userToDelete.name}</strong> ({userToDelete.email}) from the system?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
