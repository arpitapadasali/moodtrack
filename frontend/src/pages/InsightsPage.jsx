import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { getInsights, getMlInsights } from '../services/insightsService';
import { getWeatherAnalytics } from '../services/analyticsService';
import WeatherCorrelationSection from '../components/dashboard/WeatherCorrelationSection';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Moon,
  Smile,
  Calendar,
  AlertCircle,
  RefreshCw,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  ArrowRight,
  Cpu,
  CloudSun
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Insights' },
  { id: 'weather', label: 'Weather Correlation' },
  { id: 'ml', label: 'ML Patterns (FastAPI)' },
  { id: 'correlation', label: 'Sleep & Mood' },
  { id: 'mood', label: 'Mood Trends' },
  { id: 'sleep', label: 'Sleep Consistency' },
  { id: 'habit', label: 'Habits & Streaks' }
];

export default function InsightsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [mlData, setMlData] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInsights();
      setInsightsData(data);
    } catch (err) {
      console.error('Failed to load insights:', err);
      setError(err.message || 'Unable to generate personalized insights.');
    } finally {
      setLoading(false);
    }

    // Attempt to load optional ML predictions without blocking UI
    try {
      setMlLoading(true);
      const ml = await getMlInsights();
      setMlData(ml);
    } catch (err) {
      console.log('ML service offline or unavailable:', err.message);
      setMlData({ available: false, message: err.message });
    } finally {
      setMlLoading(false);
    }

    // Attempt to load optional weather correlation analytics
    try {
      const weather = await getWeatherAnalytics();
      setWeatherData(weather);
    } catch (err) {
      console.log('Weather analytics note:', err.message);
      setWeatherData(null);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const metrics = insightsData?.metrics;
  const insightsList = insightsData?.insights || [];

  // Filter insights by category
  const filteredInsights = insightsList.filter((item) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'habit') return item.category === 'habit' || item.category === 'streak';
    return item.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Layout */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Header */}
        <DashboardHeader onOpenSidebar={() => setSidebarOpen(true)} />

        {/* Main Insights Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-brand-600" />
                <span>Mood & Wellness Insights</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Rule-based behavioral correlations and pattern analysis across your recorded check-ins.
              </p>
            </div>

            <button
              onClick={loadInsights}
              disabled={loading}
              className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
              <span>Refresh Insights</span>
            </button>
          </div>

          {/* Neutral Health Notice Banner (Non-clinical wording constraint) */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start space-x-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong>Personal Data Observations:</strong> These observations reflect statistical tendencies within your self-reported logs and are provided for personal self-reflection rather than clinical diagnosis.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={loadInsights}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Overview Summary Banner */}
          {!loading && insightsData && (
            <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white p-5 sm:p-6 rounded-2xl shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-200 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                  Analysis Dataset: {insightsData.totalEntries} Days Evaluated
                </span>
                {metrics?.streaks?.currentStreak > 0 && (
                  <span className="text-xs font-semibold text-emerald-200 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                    🔥 {metrics.streaks.currentStreak}-day active streak
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-xl font-bold leading-snug">
                {insightsData.summaryHeadline}
              </h3>
              <p className="text-xs sm:text-sm text-brand-100/90 max-w-2xl leading-relaxed">
                As you continue your daily tracking, statistical pattern models refine sleep correlations and weekly rhythms with higher precision.
              </p>
            </div>
          )}

          {/* Key Metric Breakdown Cards */}
          {!loading && metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Sleep & Mood Correlation Matrix */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sleep-Mood Correlation
                  </span>
                  <Activity className="w-4 h-4 text-brand-600" />
                </div>

                {metrics.correlation?.hasEnoughData ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-slate-900">
                        {metrics.correlation.correlationCoefficient > 0
                          ? `+${metrics.correlation.correlationCoefficient}`
                          : metrics.correlation.correlationCoefficient}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        Pearson r ({metrics.correlation.relationship} association)
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Avg mood on 7h+ sleep:</span>
                        <span className="font-bold text-emerald-600">
                          {metrics.correlation.avgMoodGoodSleep || '--'} / 5
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Avg mood on &lt;7h sleep:</span>
                        <span className="font-bold text-amber-600">
                          {metrics.correlation.avgMoodLowSleep || '--'} / 5
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-xs text-slate-400">
                    {metrics.correlation?.message || 'Need at least 5 check-in days to compute correlation.'}
                  </div>
                )}
              </div>

              {/* Card 2: 7-Day Mood Trajectory */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    7-Day Mood Trend
                  </span>
                  <Smile className="w-4 h-4 text-amber-500" />
                </div>

                {metrics.moodTrend?.hasEnoughData ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-slate-900">
                        {metrics.moodTrend.recentAvg} / 5
                      </span>
                      {metrics.moodTrend.percentChange !== null && (
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                            metrics.moodTrend.percentChange >= 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {metrics.moodTrend.percentChange >= 0
                            ? `+${metrics.moodTrend.percentChange}%`
                            : `${metrics.moodTrend.percentChange}%`}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Prior period baseline:</span>
                        <span className="font-semibold text-slate-800">
                          {metrics.moodTrend.prevAvg ? `${metrics.moodTrend.prevAvg} / 5` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Positive scores (4–5):</span>
                        <span className="font-semibold text-emerald-600">
                          {metrics.moodTrend.highFrequencyRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-xs text-slate-400">
                    Log at least 3 entries to track directional movement.
                  </div>
                )}
              </div>

              {/* Card 3: Logging Rhythm & Missed Days */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Logging Rhythm
                  </span>
                  <Calendar className="w-4 h-4 text-indigo-500" />
                </div>

                {metrics.missingDays?.hasEnoughData ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-slate-400 block uppercase font-semibold">
                        Most Consistent Day
                      </span>
                      <span className="text-lg font-bold text-slate-900 block mt-0.5">
                        {metrics.missingDays.mostConsistentDay}s
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Most frequently missed:</span>
                        <span className="font-semibold text-rose-600">
                          {metrics.missingDays.mostMissedDay}s
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Weekend consistency:</span>
                        <span className="font-semibold text-slate-700">
                          {metrics.missingDays.isWeekendLower ? 'Lower than weekdays' : 'Even'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-xs text-slate-400">
                    {metrics.missingDays?.message || 'Need 7+ entries to analyze weekly habits.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
                  selectedCategory === tab.id
                    ? 'bg-brand-50 text-brand-700 border-b-2 border-brand-600'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {tab.id === 'ml' && <Cpu className="w-3.5 h-3.5" />}
                {tab.id === 'weather' && <CloudSun className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Weather Correlation View (when Weather tab selected) */}
          {selectedCategory === 'weather' && (
            <WeatherCorrelationSection weatherData={weatherData} loading={loading} />
          )}

          {/* Machine Learning Pattern Detection View (when ML tab selected) */}
          {selectedCategory === 'ml' && (
            <div className="space-y-6">
              {/* Architecture & Privacy Notice */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Python FastAPI Microservice</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        mlData?.available
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {mlData?.available ? 'Connected' : 'Offline'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Evaluates anonymized numerical metrics (mood scores, sleep hours, day indices) via regression and anomaly models.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 self-end sm:self-auto shrink-0">
                  Strictly non-diagnostic
                </div>
              </div>

              {mlLoading && (
                <div className="p-8 text-center text-xs text-slate-400">
                  Querying FastAPI pattern models...
                </div>
              )}

              {!mlLoading && mlData && !mlData.available && (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>ML Service Offline</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {mlData.message || 'The optional Python FastAPI service is not reachable on port 8000.'}
                  </p>
                  <p className="text-[11px] font-mono text-amber-900 bg-amber-100/60 p-2 rounded-lg mt-2 inline-block">
                    cd ml-service && python run.py
                  </p>
                </div>
              )}

              {!mlLoading && mlData?.status === 'insufficient_data' && (
                <div className="p-6 bg-slate-100 border border-slate-200 rounded-2xl space-y-2 text-slate-700">
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    <Info className="w-4 h-4 text-brand-600" />
                    <span>Insufficient Historical Data</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    {mlData.message}
                  </p>
                  <p className="text-xs text-slate-500">
                    A minimum of {mlData.min_required || 5} recorded daily check-ins is necessary to fit statistical trend and regression models without misleading extrapolation.
                  </p>
                </div>
              )}

              {!mlLoading && mlData?.status === 'success' && mlData.insights && (
                <div className="space-y-6">
                  {/* Grid of 4 ML Pattern Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Trend Model */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                          Trend Trajectory (OLS Regression)
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          mlData.insights.trend.direction === 'upward'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : mlData.insights.trend.direction === 'downward'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {mlData.insights.trend.direction}
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-2xl font-bold text-slate-900 capitalize">
                          {mlData.insights.trend.direction}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          slope: {mlData.insights.trend.slope > 0 ? `+${mlData.insights.trend.slope}` : mlData.insights.trend.slope}/entry
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {mlData.insights.trend.description}
                      </p>
                      <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                        <span>Confidence: <strong className="text-slate-600 capitalize">{mlData.insights.trend.confidence}</strong></span>
                        <span>R²: <strong className="text-slate-600 font-mono">{mlData.insights.trend.r_squared}</strong></span>
                      </div>
                    </div>

                    {/* 2. Anomaly / Deviation Model */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-amber-500" />
                          Baseline Divergence (Z-Score)
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          mlData.insights.deviation.has_unusual_deviation
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {mlData.insights.deviation.severity}
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-2xl font-bold text-slate-900">
                          z = {mlData.insights.deviation.z_score > 0 ? `+${mlData.insights.deviation.z_score}` : mlData.insights.deviation.z_score}
                        </span>
                        <span className="text-xs text-slate-500">
                          latest: {mlData.insights.deviation.latest_mood} / 5
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {mlData.insights.deviation.description}
                      </p>
                      <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                        <span>Baseline Mean: <strong className="text-slate-600">{mlData.insights.deviation.baseline_mean}</strong></span>
                        <span>Baseline Std: <strong className="text-slate-600">{mlData.insights.deviation.baseline_std}</strong></span>
                      </div>
                    </div>

                    {/* 3. Sleep-Mood Relationship */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Moon className="w-3.5 h-3.5 text-indigo-500" />
                          Sleep-Mood Regression
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          mlData.insights.sleep_mood_relationship.relationship_type === 'positive'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : mlData.insights.sleep_mood_relationship.relationship_type === 'negative'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {mlData.insights.sleep_mood_relationship.relationship_type}
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-2xl font-bold text-slate-900">
                          r = {mlData.insights.sleep_mood_relationship.correlation_coefficient}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          slope: {mlData.insights.sleep_mood_relationship.regression_slope}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {mlData.insights.sleep_mood_relationship.description}
                      </p>
                      <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                        <span>7h+ Sleep Avg: <strong className="text-slate-600">{mlData.insights.sleep_mood_relationship.avg_mood_adequate_sleep ?? 'N/A'}</strong></span>
                        <span>&lt;7h Sleep Avg: <strong className="text-slate-600">{mlData.insights.sleep_mood_relationship.avg_mood_low_sleep ?? 'N/A'}</strong></span>
                      </div>
                    </div>

                    {/* 4. Repeated Patterns & Cyclical Rhythms */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-500" />
                          Recurring Day & Serial Rhythm
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {mlData.insights.repeated_patterns.pattern_type}
                        </span>
                      </div>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-lg font-bold text-slate-900">
                          {mlData.insights.repeated_patterns.highest_day ? `Peak: ${mlData.insights.repeated_patterns.highest_day}` : 'Regular rhythm'}
                        </span>
                        {mlData.insights.repeated_patterns.autocorrelation_lag1 !== null && (
                          <span className="text-xs text-slate-500 font-mono">
                            lag-1: {mlData.insights.repeated_patterns.autocorrelation_lag1}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {mlData.insights.repeated_patterns.description}
                      </p>
                      <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
                        <span>Highest: <strong className="text-slate-600">{mlData.insights.repeated_patterns.highest_day || 'N/A'} ({mlData.insights.repeated_patterns.highest_avg_mood ?? '-'})</strong></span>
                        <span>Lowest: <strong className="text-slate-600">{mlData.insights.repeated_patterns.lowest_day || 'N/A'} ({mlData.insights.repeated_patterns.lowest_avg_mood ?? '-'})</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Observations */}
                  {mlData.insights.summary_observations?.length > 0 && (
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-600" />
                        <span>Synthesized Pattern Observations</span>
                      </h4>
                      <ul className="space-y-2">
                        {mlData.insights.summary_observations.map((obs, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs sm:text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loading Skeleton for Standard Insights */}
          {loading && selectedCategory !== 'ml' && selectedCategory !== 'weather' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3">
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                  <div className="h-5 w-48 bg-slate-100 rounded" />
                  <div className="h-12 w-full bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Formatted Rule-Based Insight Cards (when other tabs are selected) */}
          {!loading && selectedCategory !== 'ml' && selectedCategory !== 'weather' && filteredInsights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInsights.map((insight) => {
                const isPositive = insight.type === 'positive';
                const isCaution = insight.type === 'caution';

                return (
                  <div
                    key={insight.id}
                    className={`p-5 rounded-2xl border bg-white shadow-2xs space-y-3 transition hover:shadow-xs ${
                      isPositive
                        ? 'border-emerald-100 hover:border-emerald-200'
                        : isCaution
                        ? 'border-amber-100 hover:border-amber-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        {insight.category === 'mood' && <Smile className="w-4 h-4 text-amber-500" />}
                        {insight.category === 'sleep' && <Moon className="w-4 h-4 text-indigo-500" />}
                        {insight.category === 'correlation' && <Sparkles className="w-4 h-4 text-brand-600" />}
                        {insight.category === 'streak' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                        {insight.category === 'habit' && <Calendar className="w-4 h-4 text-sky-500" />}

                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {insight.category} observation
                        </span>
                      </div>

                      {insight.metric && (
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isCaution
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {insight.metric}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                      {insight.title}
                    </h4>

                    {/* Neutral Description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State for Low Volume Datasets */}
          {!loading && selectedCategory !== 'ml' && selectedCategory !== 'weather' && filteredInsights.length === 0 && (
            <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Building Your Pattern Profile
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Personalized rule-based insights unlock once you have recorded 5 to 7 daily check-ins across different dates.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
                >
                  <span>Log Check-in on Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
