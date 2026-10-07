/**
 * MTN ENTERPRISE HUB - SYSTEM SETTINGS
 * 
 * Route: /settings
 * Profile, visual appearance preferences, alert subscriptions, and database reset controls.
 */

import React, { useState } from 'react';
import { Moon } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/common/PageHeader';

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAppState();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'system'>('profile');

  // Form states
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [department, setDepartment] = useState(currentUser?.department || '');

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [approvalAlerts, setApprovalAlerts] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Profile Updated', 'Your user preferences have been saved locally.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Hub Settings & Preferences"
        subtitle="Manage account profile, appearance themes, alert subscriptions, and prototype data state"
        breadcrumbs={[{ label: 'Settings' }]}
      />

      {/* Tabs bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'profile', label: 'User Profile' },
          { id: 'appearance', label: 'Appearance & Brand' },
          { id: 'notifications', label: 'Alert Preferences' },
          { id: 'system', label: 'System & Architecture' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 font-heading mb-4">
            Personal Information
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mtn-yellow/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Enterprise Role</label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.role || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Corporate Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-mtn-yellow hover:bg-mtn-yellow-400 font-bold text-xs text-black rounded-xl shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Appearance */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Visual Theme & Brand Identity
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              MTN-inspired aesthetic tokens (MTN Yellow, Dark Charcoal, Slate)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border-2 border-mtn-yellow bg-amber-50/20 text-center cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-mtn-yellow text-black font-black flex items-center justify-center mx-auto mb-2 shadow-xs">
                MTN
              </div>
              <h4 className="text-sm font-bold text-slate-900">Enterprise Standard</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">MTN Yellow Accent & Dark Navy</p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-center opacity-60">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center mx-auto mb-2">
                <Moon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Dark Corporate Mode</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Coming in backend phase</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm max-w-2xl space-y-5">
          <h3 className="text-base font-bold text-slate-900 font-heading">
            Alert & Notification Subscriptions
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-slate-900">Approval Stage Reminders</p>
                <p className="text-xs text-slate-500">Notify when deals reach Credit Control or CENO sign-off</p>
              </div>
              <input
                type="checkbox"
                checked={approvalAlerts}
                onChange={(e) => setApprovalAlerts(e.target.checked)}
                className="w-4 h-4 accent-mtn-yellow rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-slate-900">Email Digest</p>
                <p className="text-xs text-slate-500">Receive daily summary of pipeline progress</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-mtn-yellow rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-slate-900">SMS Flash Alerts</p>
                <p className="text-xs text-slate-500">Instant SMS dispatch on urgent SLA escalations</p>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 accent-mtn-yellow rounded"
              />
            </label>
          </div>
        </div>
      )}

      {/* Tab 4: System */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Business Data
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              No sample records are loaded. New records are saved in this browser.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs space-y-2">
            <h4 className="font-bold text-mtn-yellow text-sm">Data Connection</h4>
            <p className="text-slate-300">
              Shared records are not connected. Configure a data provider to load records across devices.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
