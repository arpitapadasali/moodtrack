import React, { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { useAuth } from '../hooks/useAuth';
import authService from '../services/authService';
import reminderService from '../services/reminderService';
import exportService from '../services/exportService';
import { useToast } from '../hooks/useToast';
import {
  Settings,
  User,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  Bell,
  Clock,
  Globe,
  Check,
  Download,
  FileJson,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';

const AVATAR_PRESETS = [
  { name: 'Initials', urlPrefix: 'https://api.dicebear.com/7.x/initials/svg?seed=' },
  { name: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
  { name: 'Joy Emoji', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Joy' },
  { name: 'Calm Sage', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Avery' },
  { name: 'Friendly Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Spark' },
  { name: 'Minimalist', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Zen' }
];

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland'
];

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Reminder Form State
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [timezone, setTimezone] = useState(detectedTimezone);
  const [reminderInitialLoading, setReminderInitialLoading] = useState(true);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState('');
  const [reminderError, setReminderError] = useState('');

  // Data Export State
  const [exportJsonLoading, setExportJsonLoading] = useState(false);
  const [exportCsvLoading, setExportCsvLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');
  const [exportError, setExportError] = useState('');

  // Account Deletion State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Sync profile state when user is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  // Load reminder settings from API
  useEffect(() => {
    async function loadReminders() {
      setReminderInitialLoading(true);
      try {
        const data = await reminderService.getReminderSettings();
        if (data) {
          setReminderEnabled(Boolean(data.enabled));
          setReminderTime(data.reminderTime || '20:00');
          setTimezone(data.timezone || detectedTimezone);
        }
      } catch (err) {
        console.warn('Could not load reminder settings:', err.message);
      } finally {
        setReminderInitialLoading(false);
      }
    }

    loadReminders();
  }, [detectedTimezone]);

  // Auto-dismiss success banners
  useEffect(() => {
    if (profileSuccess) {
      const timer = setTimeout(() => setProfileSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccess]);

  useEffect(() => {
    if (passwordSuccess) {
      const timer = setTimeout(() => setPasswordSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccess]);

  useEffect(() => {
    if (reminderSuccess) {
      const timer = setTimeout(() => setReminderSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [reminderSuccess]);

  useEffect(() => {
    if (exportSuccess) {
      const timer = setTimeout(() => setExportSuccess(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [exportSuccess]);

  const toast = useToast();

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedAvatar = avatar.trim();

    if (!trimmedName || trimmedName.length < 2) {
      const msg = 'Name must be at least 2 characters long.';
      setProfileError(msg);
      toast.error(msg);
      return;
    }
    if (trimmedName.length > 50) {
      const msg = 'Name cannot exceed 50 characters.';
      setProfileError(msg);
      toast.error(msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      const msg = 'Please provide a valid email address.';
      setProfileError(msg);
      toast.error(msg);
      return;
    }

    setProfileLoading(true);

    try {
      const updatedUser = await authService.updateProfile({
        name: trimmedName,
        email: trimmedEmail,
        avatar: trimmedAvatar || null
      });

      updateUser(updatedUser);
      const successMsg = 'Profile updated successfully!';
      setProfileSuccess(successMsg);
      toast.success(successMsg);
    } catch (err) {
      console.error('Profile update failed:', err);
      const errMsg = err.message || 'Failed to update profile. Please try again.';
      setProfileError(errMsg);
      toast.error(errMsg);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      const successMsg = 'Password changed successfully!';
      setPasswordSuccess(successMsg);
      toast.success(successMsg);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change failed:', err);
      const errMsg = err.message || 'Failed to change password. Please check your credentials.';
      setPasswordError(errMsg);
      toast.error(errMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Reminder Settings Update
  const handleUpdateReminders = async (e) => {
    e.preventDefault();
    setReminderError('');
    setReminderSuccess('');

    setReminderSaving(true);

    try {
      const updated = await reminderService.updateReminderSettings({
        enabled: reminderEnabled,
        reminderTime,
        timezone
      });

      setReminderEnabled(Boolean(updated.enabled));
      setReminderTime(updated.reminderTime);
      setTimezone(updated.timezone);
      const successMsg = 'Daily reminder preferences saved successfully!';
      setReminderSuccess(successMsg);
      toast.success(successMsg);
    } catch (err) {
      console.error('Failed to update reminders:', err);
      const errMsg = err.message || 'Failed to save reminder preferences.';
      setReminderError(errMsg);
      toast.error(errMsg);
    } finally {
      setReminderSaving(false);
    }
  };

  // Handle Export JSON
  const handleExportJson = async () => {
    setExportError('');
    setExportSuccess('');
    setExportJsonLoading(true);
    try {
      const filename = await exportService.exportMoodsAsJson();
      const successMsg = `Successfully downloaded JSON export (${filename}).`;
      setExportSuccess(successMsg);
      toast.success(successMsg);
    } catch (err) {
      console.error('Export JSON error:', err);
      const errMsg = err.message || 'Failed to export mood data as JSON.';
      setExportError(errMsg);
      toast.error(errMsg);
    } finally {
      setExportJsonLoading(false);
    }
  };

  // Handle Export CSV
  const handleExportCsv = async () => {
    setExportError('');
    setExportSuccess('');
    setExportCsvLoading(true);
    try {
      const filename = await exportService.exportMoodsAsCsv();
      const successMsg = `Successfully downloaded CSV export (${filename}).`;
      setExportSuccess(successMsg);
      toast.success(successMsg);
    } catch (err) {
      console.error('Export CSV error:', err);
      const errMsg = err.message || 'Failed to export mood data as CSV.';
      setExportError(errMsg);
      toast.error(errMsg);
    } finally {
      setExportCsvLoading(false);
    }
  };

  // Handle Irreversible Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await authService.deleteAccount();
      toast.success('Your account and all data have been permanently deleted.');
      logout();
      window.location.href = '/';
    } catch (err) {
      console.error('Account deletion error:', err);
      const errMsg = err.message || 'Failed to delete account. Please try again.';
      setDeleteError(errMsg);
      toast.error(errMsg);
      setDeleteLoading(false);
    }
  };

  const previewAvatar =
    avatar.trim() ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Layout */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Header */}
        <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Main Settings Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto">
          {/* Page Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-brand-600" />
              <span>Account Settings</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage your profile credentials, avatar preferences, daily reminders, and security.
            </p>
          </div>

          {/* 1. Profile Information Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Profile Information
                </h3>
                <p className="text-xs text-slate-500">
                  Update your display name, avatar, and contact email.
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              {/* Avatar Preview & URL Input */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Profile Avatar
                </label>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="relative shrink-0">
                    <img
                      src={previewAvatar}
                      alt={name || 'Avatar Preview'}
                      className="w-16 h-16 rounded-2xl bg-white border border-slate-200 object-cover shadow-2xs"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`;
                      }}
                    />
                    <span className="absolute -bottom-1 -right-1 p-1 bg-brand-600 text-white rounded-full">
                      <Sparkles className="w-2.5 h-2.5" />
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <input
                        type="url"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://example.com/avatar.jpg or preset URL"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Enter an image URL or choose from quick presets below.
                      </span>
                    </div>

                    {/* Quick Avatar Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                        Presets:
                      </span>
                      {AVATAR_PRESETS.map((preset) => {
                        const targetUrl = preset.url || `${preset.urlPrefix}${encodeURIComponent(name || 'User')}`;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setAvatar(targetUrl)}
                            className="text-[11px] font-medium bg-white hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                          >
                            {preset.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full text-sm pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
              </div>

              {/* Email Address Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full text-sm pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
                <span className="text-[11px] text-slate-400">
                  Changing your email will update your login credentials.
                </span>
              </div>

              {/* Submit Profile */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {profileLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <span>Save Profile Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 2. Daily Reminders Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Daily Check-in Reminders
                </h3>
                <p className="text-xs text-slate-500">
                  Scheduled notifications to remind you if today's mood hasn't been logged yet.
                </p>
              </div>
            </div>

            {reminderSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{reminderSuccess}</span>
              </div>
            )}

            {reminderError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{reminderError}</span>
              </div>
            )}

            {reminderInitialLoading ? (
              <div className="py-6 flex items-center justify-center space-x-2 text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
                <span>Loading reminder settings...</span>
              </div>
            ) : (
              <form onSubmit={handleUpdateReminders} className="space-y-5">
                {/* Enable / Disable Switch */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-900 block">
                      Daily Reminders Status
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {reminderEnabled
                        ? 'Reminders are active and monitored by the scheduler.'
                        : 'Reminders are paused. No notifications will be dispatched.'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReminderEnabled(!reminderEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      reminderEnabled ? 'bg-brand-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Reminder Time and Timezone Controls (visible when enabled) */}
                {reminderEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Time Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                        Reminder Time (24h)
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="time"
                          required
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="w-full text-sm pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Recommended: 20:00 (evening reflection).
                      </span>
                    </div>

                    {/* Timezone Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Your Timezone
                        </label>
                        {timezone !== detectedTimezone && (
                          <button
                            type="button"
                            onClick={() => setTimezone(detectedTimezone)}
                            className="text-[10px] text-brand-600 hover:text-brand-700 font-semibold cursor-pointer"
                          >
                            Detect local ({detectedTimezone})
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full text-sm pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none cursor-pointer"
                        >
                          {!COMMON_TIMEZONES.includes(timezone) && (
                            <option value={timezone}>{timezone} (Current)</option>
                          )}
                          {COMMON_TIMEZONES.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Used to calculate your exact local check-in time.
                      </span>
                    </div>
                  </div>
                )}

                {/* Status Notice */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>
                    {reminderEnabled ? (
                      <span>
                        <strong>Scheduler Active:</strong> At <strong>{reminderTime}</strong> in <strong>{timezone}</strong>, if you have not logged today's check-in, a reminder event will be triggered.
                      </span>
                    ) : (
                      <span>
                        <strong>Scheduler Inactive:</strong> Daily reminders are disabled. You can re-enable them at any time.
                      </span>
                    )}
                  </p>
                </div>

                {/* Save Reminders Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={reminderSaving}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    {reminderSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Preferences...</span>
                      </>
                    ) : (
                      <span>Save Reminder Settings</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 3. Security & Password Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Security & Password
                </h3>
                <p className="text-xs text-slate-500">
                  Change your password securely. Minimum 6 characters required.
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full text-sm pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 transition cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirmation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full text-sm pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 transition cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full text-sm pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Password */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  {passwordLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 4. Data Export & Privacy Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Data Export & Privacy
                </h3>
                <p className="text-xs text-slate-500">
                  Export your complete personal mood history, sleep hours, feelings, and reflections.
                </p>
              </div>
            </div>

            {exportSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{exportSuccess}</span>
              </div>
            )}

            {exportError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{exportError}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              You own your data. Exports contain all your historical check-in records: dates, mood scores (1–5),
              selected feelings, personal reflections, sleep durations, and any recorded weather conditions.
              Account credentials, password hashes, and session tokens are strictly excluded.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* JSON Export Box */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      JSON Format
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Structured object notation ideal for backups, developer workflows, or custom data ingestion.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportJson}
                  disabled={exportJsonLoading || exportCsvLoading}
                  className="w-full inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {exportJsonLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />
                      <span>Exporting JSON...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export JSON</span>
                    </>
                  )}
                </button>
              </div>

              {/* CSV Export Box */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      CSV Format
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Clean tabular spreadsheet format ready for Microsoft Excel, Google Sheets, or Notion databases.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={exportJsonLoading || exportCsvLoading}
                  className="w-full inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl transition shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {exportCsvLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Exporting CSV...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 5. Account Overview Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800">Account Scoping & Privacy</span>
              <p className="text-slate-500">
                Your data is scoped strictly to user account ID: <code className="text-brand-700 font-mono text-[11px]">{user?.id}</code>.
              </p>
            </div>
            <div className="shrink-0 text-[11px] text-slate-400">
              Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
            </div>
          </div>

          {/* 6. Danger Zone: Delete Account */}
          <div className="p-5 sm:p-6 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900 tracking-tight">
                  Danger Zone: Delete Account
                </h3>
                <p className="text-xs text-rose-700/80">
                  Permanently delete your user profile, daily mood records, reflections, and reminders.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Once initiated, account deletion is irreversible. In compliance with data privacy standards, all your personal mood entries, sleep data, tags, and reminder settings will be completely wiped from the database.
            </p>

            <div className="flex justify-start pt-1">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(true);
                  setDeleteConfirmationText('');
                  setDeleteError('');
                }}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Account</span>
              </button>
            </div>
          </div>

          {/* Account Deletion Confirmation Modal */}
          {deleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
              <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4">
                <div className="flex items-center space-x-3 text-rose-600">
                  <div className="p-2 bg-rose-100 rounded-xl">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Confirm Irreversible Deletion</h3>
                    <p className="text-xs text-slate-500">This action cannot be undone.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete your account (<strong className="text-slate-800">{user?.email}</strong>)? All your recorded moods, streaks, reflections, and reminders will be erased immediately.
                </p>

                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Type <span className="font-mono text-rose-600 font-bold">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  {deleteError && (
                    <p className="text-xs text-rose-600 font-medium">{deleteError}</p>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading || deleteConfirmationText.trim().toLowerCase() !== 'delete'}
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    {deleteLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting Everything...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Permanently Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
