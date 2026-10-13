import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import MoodCalendar from '../components/calendar/MoodCalendar';
import CalendarDayDetail from '../components/calendar/CalendarDayDetail';
import CalendarMonthStats from '../components/calendar/CalendarMonthStats';
import MoodEntryModal from '../components/dashboard/MoodEntryModal';
import { getCalendarData } from '../services/analyticsService';
import moodService from '../services/moodService';
import { useToast } from '../hooks/useToast';
import {
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function CalendarPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Calendar Date State (defaults to current month & year in UTC/local)
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12

  // Calendar Data State
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Selected Day State
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDayEntry, setSelectedDayEntry] = useState(null);
  const [loadingDayDetail, setLoadingDayDetail] = useState(false);
  const [dayDetailError, setDayDetailError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch month calendar data from the calendar analytics API
  const loadMonthData = useCallback(async (targetYear, targetMonth) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCalendarData(targetYear, targetMonth);
      setCalendarData(data);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
      setError(err.message || 'Failed to load calendar entries for this month.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch day entry details when selectedDate changes
  const fetchDayDetail = useCallback(async (dateStr, cachedEntry = null) => {
    if (!dateStr) {
      setSelectedDayEntry(null);
      return;
    }

    // If already available from monthly cache, populate immediately to prevent flickering
    if (cachedEntry) {
      setSelectedDayEntry(cachedEntry);
    }

    setLoadingDayDetail(true);
    setDayDetailError(null);

    try {
      const entry = await moodService.getMoodByDate(dateStr);
      setSelectedDayEntry(entry);
    } catch (err) {
      // 404 means no entry logged on this day
      if (
        err.message &&
        (err.message.includes('404') ||
          err.message.toLowerCase().includes('not found') ||
          err.message.toLowerCase().includes('no mood entry'))
      ) {
        setSelectedDayEntry(null);
      } else {
        console.warn('Error fetching entry for date:', err.message);
        setDayDetailError(err.message || 'Unable to load details for this day.');
        setSelectedDayEntry(null);
      }
    } finally {
      setLoadingDayDetail(false);
    }
  }, []);

  // Initial load and when year/month changes
  useEffect(() => {
    loadMonthData(year, month);
  }, [year, month, loadMonthData]);

  // Fetch details for initial selected date once calendarData arrives
  useEffect(() => {
    if (calendarData && selectedDate) {
      const cached = calendarData.entriesByDate?.[selectedDate];
      fetchDayDetail(selectedDate, cached);
    }
  }, [calendarData, selectedDate, fetchDayDetail]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (month === 1) {
      setYear((prev) => prev - 1);
      setMonth(12);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear((prev) => prev + 1);
      setMonth(1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setSelectedDate(todayStr);
  };

  // Day click handler
  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    const cached = calendarData?.entriesByDate?.[dateStr];
    fetchDayDetail(dateStr, cached);
  };

  // Modal actions
  const handleOpenNewEntryModal = (dateStr = null) => {
    const targetDate = dateStr || selectedDate || todayStr;
    setEditingEntry({
      entryDate: targetDate,
      mood: 3,
      sleepHours: 7,
      feelings: [],
      reflection: ''
    });
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const toast = useToast();

  const handleSaveEntry = async (entryData, isEditing) => {
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

      // Refresh current month data and selected date details
      await loadMonthData(year, month);
      await fetchDayDetail(entryData.entryDate);
    } catch (err) {
      toast.error(err.message || 'Failed to save calendar entry.');
      throw err;
    }
  };

  const handleDeleteEntry = async (dateStr) => {
    try {
      await moodService.deleteMoodEntry(dateStr);
      const msg = `Mood check-in for ${dateStr} has been deleted.`;
      setSuccessMessage(msg);
      toast.info(msg);
      await loadMonthData(year, month);
      await fetchDayDetail(dateStr);
    } catch (err) {
      toast.error(err.message || 'Failed to delete mood entry.');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Layout */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Header */}
        <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Calendar View Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-brand-600" />
                <span>Mood Calendar</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Explore your emotional journey, habits, and reflections by month and date.
              </p>
            </div>

            <button
              onClick={() => handleOpenNewEntryModal(todayStr)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Mood Entry</span>
            </button>
          </div>

          {/* Success Notification Banner */}
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
                onClick={() => loadMonthData(year, month)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Month Data</span>
              </button>
            </div>
          )}

          {/* Monthly Overview Stats Cards */}
          <CalendarMonthStats
            year={year}
            month={month}
            entries={calendarData?.entries || []}
            loading={loading}
          />

          {/* Main Calendar & Day Detail Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Monthly Mood Calendar */}
            <div className="lg:col-span-2">
              <MoodCalendar
                year={year}
                month={month}
                entriesByDate={calendarData?.entriesByDate || {}}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onToday={handleToday}
                loading={loading}
              />
            </div>

            {/* Right 1 Col: Day Detail Inspector */}
            <div className="lg:col-span-1">
              <CalendarDayDetail
                selectedDate={selectedDate}
                entry={selectedDayEntry}
                loading={loadingDayDetail}
                error={dayDetailError}
                onEditEntry={handleEditEntry}
                onLogNewEntry={handleOpenNewEntryModal}
                onDeleteEntry={handleDeleteEntry}
                onClose={() => setSelectedDate(null)}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Entry Modal */}
      <MoodEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        existingEntry={editingEntry}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
      />
    </div>
  );
}
