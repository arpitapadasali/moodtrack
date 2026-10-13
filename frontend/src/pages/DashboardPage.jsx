import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import AnalyticsSummaryCards from '../components/dashboard/AnalyticsSummaryCards';
import TodayMoodCard from '../components/dashboard/TodayMoodCard';
import MoodQuoteCard from '../components/dashboard/MoodQuoteCard';
import MoodTrendChart from '../components/dashboard/MoodTrendChart';
import SleepTrendChart from '../components/dashboard/SleepTrendChart';
import MoodComparisonCard from '../components/dashboard/MoodComparisonCard';
import RecentEntriesCard from '../components/dashboard/RecentEntriesCard';
import MoodEntryModal from '../components/dashboard/MoodEntryModal';
import moodService from '../services/moodService';
import analyticsService from '../services/analyticsService';
import { useToast } from '../hooks/useToast';
import { RefreshCw, AlertCircle, CheckCircle2, Plus } from 'lucide-react';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [todayEntry, setTodayEntry] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [comparisonSummary, setComparisonSummary] = useState(null);
  const [streakData, setStreakData] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Counter to notify child charts to refetch when an entry is added/edited/deleted
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Load dashboard and time-series analytics data from backend
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [todayRes, recentRes, compRes, streakRes] = await Promise.allSettled([
        moodService.getTodayEntry(),
        analyticsService.getRecentAnalytics(),
        analyticsService.getAnalyticsSummary(),
        analyticsService.getStreakAnalytics()
      ]);

      if (todayRes.status === 'fulfilled') {
        setTodayEntry(todayRes.value);
      }
      if (recentRes.status === 'fulfilled') {
        setRecentEntries(recentRes.value || []);
      }
      if (compRes.status === 'fulfilled') {
        setComparisonSummary(compRes.value || null);
      }
      if (streakRes.status === 'fulfilled') {
        setStreakData(streakRes.value || null);
      }

      // If all critical calls failed
      if (todayRes.status === 'rejected' && recentRes.status === 'rejected') {
        throw new Error(todayRes.reason?.message || 'Unable to connect to MoodTrack analytics backend.');
      }
    } catch (err) {
      console.error('Error loading dashboard analytics:', err);
      setError(err.message || 'Failed to load mood records. Make sure the backend and database are running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Modal handlers
  const handleOpenTodayModal = () => {
    setEditingEntry(todayEntry);
    setIsModalOpen(true);
  };

  const handleOpenNewEntryModal = (dateStr = null) => {
    if (dateStr) {
      setEditingEntry({
        entryDate: dateStr,
        mood: 3,
        sleepHours: 7,
        feelings: [],
        reflection: ''
      });
    } else {
      setEditingEntry(null);
    }
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const toast = useToast();

  const handleSaveMoodEntry = async (entryData, isEditing) => {
    try {
      if (isEditing) {
        await moodService.updateMoodEntry(entryData.entryDate, {
          mood: entryData.mood,
          sleepHours: entryData.sleepHours,
          feelings: entryData.feelings,
          reflection: entryData.reflection
        });
        const msg = `Mood check-in for ${entryData.entryDate} updated successfully!`;
        setSuccessMessage(msg);
        toast.success(msg);
      } else {
        await moodService.createMoodEntry(entryData);
        const msg = `Mood check-in for ${entryData.entryDate} recorded successfully!`;
        setSuccessMessage(msg);
        toast.success(msg);
      }

      setRefreshCounter((prev) => prev + 1);
      await loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to save mood entry.');
      throw err;
    }
  };

  const handleDeleteMoodEntry = async (dateStr) => {
    try {
      await moodService.deleteMoodEntry(dateStr);
      const msg = `Mood entry for ${dateStr} has been deleted.`;
      setSuccessMessage(msg);
      toast.info(msg);
      setRefreshCounter((prev) => prev + 1);
      await loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete mood entry.');
      throw err;
    }
  };

  const currentMoodValue = todayEntry?.mood || (recentEntries.length > 0 ? recentEntries[recentEntries.length - 1].mood : null);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Layout */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Header */}
        <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Dashboard Main View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Daily Wellness Overview
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Track how your mood, feelings, and sleep evolve each day.
              </p>
            </div>

            <button
              onClick={() => handleOpenNewEntryModal()}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Mood Entry</span>
            </button>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{successMessage}</span>
              </div>
              <button
                onClick={() => setSuccessMessage('')}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Error Banner with Retry */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadDashboardData}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          )}

          {/* Analytics Summary with 5-vs-5 Comparison & Streaks */}
          <AnalyticsSummaryCards
            comparison={comparisonSummary}
            streakData={streakData}
            loading={loading}
          />

          {/* Today's Mood Card & Mood Quote Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="lg:col-span-2">
              <TodayMoodCard
                todayEntry={todayEntry}
                loading={loading}
                onOpenModal={handleOpenTodayModal}
              />
            </div>
            <div className="lg:col-span-1">
              <MoodQuoteCard mood={currentMoodValue} />
            </div>
          </div>

          {/* 5-Check-in Comparison Card (Latest 5 vs Previous 5 check-ins) */}
          <MoodComparisonCard
            key={`comp-${refreshCounter}`}
            initialSummary={comparisonSummary}
          />

          {/* Interactive Chart.js Visualizations */}
          <div className="space-y-6">
            {/* Mood Trend Chart */}
            <MoodTrendChart
              key={`mood-chart-${refreshCounter}`}
              onEditEntry={handleEditEntry}
              onLogNewEntry={handleOpenNewEntryModal}
            />

            {/* Sleep Trend Chart */}
            <SleepTrendChart
              key={`sleep-chart-${refreshCounter}`}
              onEditEntry={handleEditEntry}
              onLogNewEntry={handleOpenNewEntryModal}
            />
          </div>

          {/* Recent Entries List */}
          <RecentEntriesCard
            entries={[...recentEntries].reverse()}
            loading={loading}
            onEditEntry={handleEditEntry}
          />
        </main>
      </div>

      {/* Add / Edit Entry Modal */}
      <MoodEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingEntry={editingEntry}
        onSave={handleSaveMoodEntry}
        onDelete={handleDeleteMoodEntry}
      />
    </div>
  );
}
