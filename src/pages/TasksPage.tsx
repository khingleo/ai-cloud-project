/**
 * MTN ENTERPRISE HUB - OPERATIONAL TASKS PAGE (CRUD & MANUAL ENTRY)
 * 
 * Route: /tasks
 * Cross-departmental task manager across Presales, Sales Ops, Credit Control, and Delivery.
 * Features:
 * - Free-text manual customer name entry
 * - Add Task, Edit Task modal, Delete Task modal
 * - Checkbox 1-click toggle status
 */

import React, { useMemo, useState } from 'react';
import {
  PlusCircle,
  Clock,
  Building2,
  CheckCircle2,
  User,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable, type Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { PermissionGate } from '../components/auth/ProtectedRoute';
import type { EnterpriseTask, PriorityLevel, TaskStatus, TaskCategory } from '../types';
import { formatDate, getPriorityColor } from '../utils/formatters';

export const TasksPage: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    notifyTaskAssignee,
    customers,
    users,
    getOrCreateCustomerByName,
  } = useAppState();
  const { user: authenticatedUser, allRegisteredUsers } = useAuth();
  const { showToast } = useToast();
  const assignees = useMemo(() => {
    const appUsersByEmail = new Map(users.map((enterpriseUser) => [
      enterpriseUser.email.trim().toLowerCase(),
      enterpriseUser,
    ]));
    const accounts = new Map<string, typeof authenticatedUser>();
    if (authenticatedUser) accounts.set(authenticatedUser.id, authenticatedUser);
    allRegisteredUsers.forEach((registered) => accounts.set(registered.id, registered));
    return Array.from(accounts.values()).flatMap((account) => {
      if (!account) return [];
      const appUser = appUsersByEmail.get(account.email.toLowerCase());
      if (appUser?.status === 'Inactive') return [];
      return [{
        key: account.id,
        id: account.id,
        name: account.name,
        email: account.email,
        detail: appUser ? `${appUser.role} · ${appUser.department}` : account.accessTier.replace('_', ' '),
      }];
    });
  }, [allRegisteredUsers, authenticatedUser, users]);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EnterpriseTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<EnterpriseTask | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [assignedToEmail, setAssignedToEmail] = useState('');
  const [assigneeKey, setAssigneeKey] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [dueDate, setDueDate] = useState('2026-10-05');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('To Do');
  const [category, setCategory] = useState<TaskCategory>('Presales');
  const selectedAssigneeExists = assignees.some((assignee) => assignee.key === assigneeKey);

  const handleAssigneeChange = (key: string) => {
    setAssigneeKey(key);
    const selected = assignees.find((assignee) => assignee.key === key);
    if (!selected) {
      setAssignedTo(key.startsWith('legacy:') ? key.slice('legacy:'.length) : key);
      setAssignedToUserId('');
      setAssignedToEmail('');
      return;
    }
    setAssignedTo(selected.name);
    setAssignedToUserId(selected.id);
    setAssignedToEmail(selected.email);
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
    return true;
  });

  const openAddModal = () => {
    setTitle('');
    setCustomerNameInput(customers[0]?.name || '');
    const defaultAssignee = assignees.find((assignee) => assignee.id === authenticatedUser?.id) || assignees[0];
    setAssignedTo(defaultAssignee?.name || '');
    setAssignedToUserId(defaultAssignee?.id || '');
    setAssignedToEmail(defaultAssignee?.email || '');
    setAssigneeKey(defaultAssignee?.key || '');
    setPriority('High');
    setDueDate('2026-10-05');
    setTaskStatus('To Do');
    setCategory('Presales');
    setIsAddModalOpen(true);
  };

  const openEditModal = (t: EnterpriseTask) => {
    setEditingTask(t);
    setTitle(t.title);
    setCustomerNameInput(t.customerName || '');
    const matchedAssignee = assignees.find((assignee) =>
      (t.assignedToUserId && assignee.id === t.assignedToUserId)
      || (t.assignedToEmail && assignee.email.toLowerCase() === t.assignedToEmail.toLowerCase())
      || assignee.name === t.assignedTo);
    setAssignedTo(matchedAssignee?.name || t.assignedTo);
    setAssignedToUserId(t.assignedToUserId || matchedAssignee?.id || '');
    setAssignedToEmail(t.assignedToEmail || matchedAssignee?.email || '');
    setAssigneeKey(matchedAssignee?.key || t.assignedToEmail || `legacy:${t.assignedTo}`);
    setPriority(t.priority);
    setDueDate(t.dueDate);
    setTaskStatus(t.status);
    setCategory(t.category);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let customerId: string | undefined = undefined;
    let customerName: string | undefined = undefined;

    if (customerNameInput.trim()) {
      const cust = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');
      customerId = cust.id;
      customerName = cust.name;
    }

    const task = addTask({
      title: title.trim(),
      customerId,
      customerName,
      assignedTo,
      assignedToUserId,
      assignedToEmail,
      priority,
      dueDate,
      status: taskStatus,
      category,
    });

    setIsAddModalOpen(false);
    void notifyTaskAssignee(task).then(() => {
      showToast('success', 'Task Created', `Task assigned to ${task.assignedTo}; they have been notified.`);
    }).catch((error: unknown) => {
      showToast('error', 'Task Saved, Notification Failed', error instanceof Error ? error.message : 'The assignee could not be notified.');
    });
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !title.trim()) return;

    let customerId: string | undefined = undefined;
    let customerName: string | undefined = undefined;

    if (customerNameInput.trim()) {
      const cust = getOrCreateCustomerByName(customerNameInput.trim(), 'Large Enterprise', 'General Corporate');
      customerId = cust.id;
      customerName = cust.name;
    }

    updateTask(editingTask.id, {
      title: title.trim(),
      customerId,
      customerName,
      assignedTo,
      assignedToUserId,
      assignedToEmail,
      priority,
      dueDate,
      status: taskStatus,
      category,
    });

    const wasReassigned = assignedToUserId && assignedToUserId !== editingTask.assignedToUserId;
    setEditingTask(null);
    if (wasReassigned) {
      const updatedTask = { ...editingTask, title: title.trim(), assignedTo, assignedToUserId, assignedToEmail };
      void notifyTaskAssignee(updatedTask).then(() => {
        showToast('success', 'Task Reassigned', `${assignedTo} has been notified.`);
      }).catch((error: unknown) => {
        showToast('error', 'Task Saved, Notification Failed', error instanceof Error ? error.message : 'The assignee could not be notified.');
      });
    } else {
      showToast('success', 'Task Updated', 'Changes saved successfully.');
    }
  };

  const handleDeleteConfirm = () => {
    if (!taskToDelete) return;
    deleteTask(taskToDelete.id);
    showToast('info', 'Task Deleted', `Task "${taskToDelete.title}" removed.`);
    setTaskToDelete(null);
  };

  const handleToggle = (task: EnterpriseTask) => {
    toggleTaskStatus(task.id);
    showToast(
      'info',
      task.status === 'Completed' ? 'Task Reopened' : 'Task Completed',
      `"${task.title}" updated.`
    );
  };

  const columns: Column<EnterpriseTask>[] = [
    {
      header: 'Status & Task Description',
      accessor: (t) => (
        <div className="flex items-start gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(t);
            }}
            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
              t.status === 'Completed'
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'border-slate-300 hover:border-slate-500'
            }`}
          >
            {t.status === 'Completed' && <CheckCircle2 className="w-4 h-4" />}
          </button>
          <div>
            <p
              className={`font-bold text-sm ${
                t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {t.title}
            </p>
            {t.customerName && (
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" /> {t.customerName}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Department / Category',
      accessor: (t) => (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
          {t.category}
        </span>
      ),
    },
    {
      header: 'Assigned To',
      accessor: (t) => {
        const assigneeEmail = t.assignedToEmail || assignees.find((assignee) =>
          (t.assignedToUserId && assignee.id === t.assignedToUserId) || assignee.name === t.assignedTo)?.email;
        return (
          <div className="flex items-start gap-1.5 text-xs text-slate-800">
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="font-bold">{t.assignedTo}</p>
              {assigneeEmail && <p className="truncate text-[11px] font-normal text-slate-500">{assigneeEmail}</p>}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Priority',
      accessor: (t) => {
        const pColor = getPriorityColor(t.priority);
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${pColor.bg} ${pColor.text}`}>
            {t.priority}
          </span>
        );
      },
    },
    {
      header: 'Due Date',
      accessor: (t) => (
        <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatDate(t.dueDate)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (t) => <StatusBadge status={t.status} size="sm" />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (t) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <PermissionGate action="edit">
            <button
              onClick={() => openEditModal(t)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
          <PermissionGate action="delete">
            <button
              onClick={() => setTaskToDelete(t)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Delete Task"
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
        title="Cross-Functional Action Tasks"
        subtitle="Manage cross-departmental operations, pre-feasibility reviews, and service delivery action items"
        breadcrumbs={[{ label: 'Tasks' }]}
        actions={
          <PermissionGate action="add">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-mtn-yellow hover:bg-mtn-yellow-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow-mtn-glow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Assign Task</span>
            </button>
          </PermissionGate>
        }
      />

      {/* Datalist for suggestions */}
      <datalist id="tasks-customer-suggestions">
        {customers.map((c) => (
          <option key={c.id} value={c.name} />
        ))}
      </datalist>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
          >
            <option value="ALL">All Categories</option>
            <option value="Presales">Presales</option>
            <option value="Sales Ops">Sales Ops</option>
            <option value="Credit Check">Credit Check</option>
            <option value="Delivery">Delivery</option>
            <option value="Customer Care">Customer Care</option>
            <option value="KAM Followup">KAM Followup</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
          >
            <option value="ALL">All Statuses ({tasks.length})</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          Showing <strong>{filteredTasks.length}</strong> operational tasks
        </span>
      </div>

      {/* Tasks DataTable */}
      <DataTable
        columns={columns}
        data={filteredTasks}
        searchPlaceholder="Search tasks by title, customer, or assignee..."
        searchFilter={(item, query) => {
          const q = query.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.assignedTo.toLowerCase().includes(q) ||
            (item.assignedToEmail ? item.assignedToEmail.toLowerCase().includes(q) : false) ||
            (item.customerName ? item.customerName.toLowerCase().includes(q) : false) ||
            item.category.toLowerCase().includes(q)
          );
        }}
      />

      {/* CREATE TASK MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Assign Operational Task"
        subtitle="Create workflow action item with manual customer association"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Perform Fiber Link Optical Budget Calculation"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Related Customer (Type Any)</label>
            <input
              type="text"
              list="tasks-customer-suggestions"
              value={customerNameInput}
              onChange={(e) => setCustomerNameInput(e.target.value)}
              placeholder="Type any enterprise client name..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Person</label>
              <select
                required
                value={assigneeKey}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                {!assignees.length && <option value="">No available users</option>}
                {assignedTo && !selectedAssigneeExists && (
                  <option value={assigneeKey}>{assignedTo}{assignedToEmail ? ` (${assignedToEmail})` : ' (no longer listed)'}</option>
                )}
                {assignees.map((assignee) => (
                  <option key={assignee.key} value={assignee.key}>
                    {assignee.name}{assignee.email ? ` — ${assignee.email}` : ''} ({assignee.detail})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-slate-500">Only registered login accounts can receive task notifications.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Presales">Presales</option>
                <option value="Sales Ops">Sales Ops</option>
                <option value="Credit Check">Credit Check</option>
                <option value="Delivery">Delivery</option>
                <option value="Customer Care">Customer Care</option>
                <option value="KAM Followup">KAM Followup</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              >
                <option value="Critical">🔴 Critical</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">⚪ Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>
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
              Save Task
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT TASK MODAL */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Operational Task"
        subtitle={`Update task #${editingTask?.id}`}
        maxWidth="md"
      >
        {editingTask && (
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Related Customer (Type Any)</label>
              <input
                type="text"
                list="tasks-customer-suggestions"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Person</label>
                <select
                  required
                  value={assigneeKey}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  {!assignees.length && <option value="">No available users</option>}
                  {assignedTo && !selectedAssigneeExists && (
                    <option value={assigneeKey}>{assignedTo}{assignedToEmail ? ` (${assignedToEmail})` : ' (no longer listed)'}</option>
                  )}
                  {assignees.map((assignee) => (
                    <option key={assignee.key} value={assignee.key}>
                      {assignee.name}{assignee.email ? ` — ${assignee.email}` : ''} ({assignee.detail})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500">Only registered login accounts can receive task notifications.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Presales">Presales</option>
                  <option value="Sales Ops">Sales Ops</option>
                  <option value="Credit Check">Credit Check</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Customer Care">Customer Care</option>
                  <option value="KAM Followup">KAM Followup</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                >
                  <option value="Critical">🔴 Critical</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">⚪ Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
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
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title="Delete Operational Task"
        maxWidth="sm"
      >
        {taskToDelete && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-xs">
                Are you sure you want to delete task <strong>"{taskToDelete.title}"</strong>?
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
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
