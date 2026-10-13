import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import WeatherCorrelationSection from '../components/dashboard/WeatherCorrelationSection';
import MoodTrendChart from '../components/dashboard/MoodTrendChart';
import SleepTrendChart from '../components/dashboard/SleepTrendChart';
import MoodComparisonCard from '../components/dashboard/MoodComparisonCard';
import MoodEntryModal from '../components/dashboard/MoodEntryModal';
import analyticsService from '../services/analyticsService';
import moodService from '../services/moodService';
import {
  BarChart3,
  CloudSun,
  RefreshCw,
  TrendingUp,
  Flame,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [weatherData, setWeatherData] = useState(null);
  const [comparisonSummary, setComparisonSummary] = useState(null);
  const [streakData, setStreakData] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [weatherRes, compRes, streakRes] = await Promise.allSettled([
        analyticsService.getWeatherAnalytics(),
        analyticsService.getAnalyticsSummary(),
        analyticsService.getStreakAnalytics()
      ]);

      if (weatherRes.status === 'fulfilled') {
        setWeatherData(weatherRes.value);
      }
      if (compRes.status === 'fulfilled') {
        setComparisonSummary(compRes.value);
      }
      if (streakRes.status === 'fulfilled') {
        setStreakData(streakRes.value);
      }
    } catch (err) {
      console.error('Failed to load analytics hub:', err);
      setError('Unable to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, refreshCounter]);

  const handleSaveEntry = async (entryData, isEditing) => {
    if (isEditing) {
      await moodService.updateMoodEntry(entryData.entryDate, entryData);
    } else {
      await moodService.createMoodEntry(entryData);
    }
    setRefreshCounter((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-brand-600" />
                <span>Analytics & Behavioral Insights</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Weather co-occurrence patterns, 5-vs-5 comparisons, and multi-range time series.
              </p>
            </div>

            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
              <span>Refresh Analytics</span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadAnalytics}
                className="font-semibold underline hover:no-underline ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {/* 1. Weather Correlation Analytics Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CloudSun className="w-5 h-5 text-amber-500" />
                  <span>Weather & Ambient Conditions Correlation</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Mood vs. temperature, weather conditions, and precipitation patterns.
                </p>
              </div>
            </div>

            <WeatherCorrelationSection
              weatherData={weatherData}
              loading={loading}
              onOpenModal={() => setIsModalOpen(true)}
            />
          </section>

          {/* 2. 5-vs-5 Comparison Section */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <span>Check-in Period Comparison</span>
            </h3>
            <MoodComparisonCard comparisonData={comparisonSummary} loading={loading} />
          </section>

          {/* 3. Time Series Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MoodTrendChart refreshTrigger={refreshCounter} />
            <SleepTrendChart refreshTrigger={refreshCounter} />
          </section>
        </main>
      </div>

      {/* Mood Entry Modal for quick logging */}
      <MoodEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEntry}
      />
    </div>
  );
}
