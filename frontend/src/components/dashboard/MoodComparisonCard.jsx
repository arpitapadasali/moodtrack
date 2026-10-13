import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Smile,
  Moon,
  Scale,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { getAnalyticsSummary } from '../../services/analyticsService';

export default function MoodComparisonCard({ initialSummary = null }) {
  const [summaryData, setSummaryData] = useState(initialSummary);
  const [loading, setLoading] = useState(!initialSummary);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsSummary();
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load comparison summary:', err);
      setError(err.message || 'Failed to load 5-vs-5 comparison analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSummary) {
      fetchSummary();
    } else {
      setSummaryData(initialSummary);
    }
  }, [initialSummary, fetchSummary]);

  const latest = summaryData?.latest5;
  const previous = summaryData?.previous5;
  const comparison = summaryData?.comparison;

  // Mood indicator
  const moodChange = comparison?.moodChangePercent;
  const moodDirection =
    moodChange === null || moodChange === undefined
      ? 'none'
      : moodChange > 0
      ? 'up'
      : moodChange < 0
      ? 'down'
      : 'neutral';

  // Sleep indicator
  const sleepChange = comparison?.sleepChangePercent;
  const sleepDirection =
    sleepChange === null || sleepChange === undefined
      ? 'none'
      : sleepChange > 0
      ? 'up'
      : sleepChange < 0
      ? 'down'
      : 'neutral';

  const hasFullComparison = Boolean(comparison?.hasComparisonData);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              5-Check-in Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Comparing your Latest 5 check-ins against your Previous 5 check-ins.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSummary}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-700 transition"
          title="Refresh comparison analytics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400 animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
          <span className="text-xs">Computing rolling comparison analytics...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSummary}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Mood Comparison Box */}
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Average Mood
                  </span>
                </div>

                {/* Mood Indicator Badge */}
                {moodDirection === 'up' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span>+{moodChange}%</span>
                  </span>
                )}
                {moodDirection === 'down' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    <TrendingDown className="w-3 h-3 text-rose-600" />
                    <span>{moodChange}%</span>
                  </span>
                )}
                {moodDirection === 'neutral' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    <Minus className="w-3 h-3 text-slate-500" />
                    <span>0.0% (Stable)</span>
                  </span>
                )}
                {moodDirection === 'none' && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Needs &ge; 6 entries
                  </span>
                )}
              </div>

              {/* Side-by-side values */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Latest 5 Check-ins
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {latest?.averageMood ? `${latest.averageMood} / 5` : '--'}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Based on {latest?.count || 0} entries
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Previous 5 Check-ins
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {previous?.averageMood ? `${previous.averageMood} / 5` : '--'}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Based on {previous?.count || 0} entries
                  </span>
                </div>
              </div>

              {/* Comparison Visual Bar */}
              {latest?.averageMood && previous?.averageMood && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Recent vs. Baseline</span>
                    <span>
                      {latest.averageMood >= previous.averageMood
                        ? `+${(latest.averageMood - previous.averageMood).toFixed(2)} pts`
                        : `${(latest.averageMood - previous.averageMood).toFixed(2)} pts`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(latest.averageMood / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Sleep Comparison Box */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Average Sleep
                  </span>
                </div>

                {/* Sleep Indicator Badge */}
                {sleepDirection === 'up' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span>+{sleepChange}%</span>
                  </span>
                )}
                {sleepDirection === 'down' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    <TrendingDown className="w-3 h-3 text-rose-600" />
                    <span>{sleepChange}%</span>
                  </span>
                )}
                {sleepDirection === 'neutral' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    <Minus className="w-3 h-3 text-slate-500" />
                    <span>0.0% (Stable)</span>
                  </span>
                )}
                {sleepDirection === 'none' && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Needs &ge; 6 entries
                  </span>
                )}
              </div>

              {/* Side-by-side values */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Latest 5 Check-ins
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {latest?.averageSleep ? `${latest.averageSleep} hrs` : '--'}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Per night
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Previous 5 Check-ins
                  </span>
                  <p className="text-xl font-bold text-slate-900 mt-1">
                    {previous?.averageSleep ? `${previous.averageSleep} hrs` : '--'}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Per night
                  </span>
                </div>
              </div>

              {/* Comparison Visual Bar */}
              {latest?.averageSleep && previous?.averageSleep && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Recent vs. Baseline</span>
                    <span>
                      {latest.averageSleep >= previous.averageSleep
                        ? `+${(latest.averageSleep - previous.averageSleep).toFixed(1)} hrs`
                        : `${(latest.averageSleep - previous.averageSleep).toFixed(1)} hrs`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((latest.averageSleep / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Insight Takeaway Banner */}
          {hasFullComparison ? (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-700 leading-relaxed">
                {moodDirection === 'up' && sleepDirection === 'up' ? (
                  <span>
                    <strong>Positive Trend:</strong> Both your mood ({`+${moodChange}%`}) and sleep ({`+${sleepChange}%`}) are higher than your previous 5 check-ins. Keep up your healthy routines!
                  </span>
                ) : moodDirection === 'up' && sleepDirection === 'down' ? (
                  <span>
                    <strong>Mood Improving:</strong> Mood is up {`+${moodChange}%`}, but sleep dropped {`${sleepChange}%`}. Prioritizing consistent bedtimes may help sustain this positive momentum.
                  </span>
                ) : moodDirection === 'down' && sleepDirection === 'up' ? (
                  <span>
                    <strong>Rest Restoring:</strong> Your sleep is up {`+${sleepChange}%`}, which provides a solid physical foundation while navigating recent mood dips.
                  </span>
                ) : moodDirection === 'down' && sleepDirection === 'down' ? (
                  <span>
                    <strong>Gentle Reminder:</strong> Both mood and sleep have dipped recently. Consider gentle movement, resting early, or journaling your reflections.
                  </span>
                ) : (
                  <span>
                    <strong>Steady Rhythm:</strong> Your recent patterns are closely aligned with your baseline check-ins.
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2.5 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                You currently have <strong>{latest?.count || 0}</strong> of the 6+ check-ins required to compute the 5-vs-5 percentage change. Check in daily to unlock comparative trend insights!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
