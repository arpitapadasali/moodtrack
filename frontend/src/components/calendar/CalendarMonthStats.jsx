import React from 'react';
import { CalendarCheck, Smile, Moon, Sparkles, TrendingUp } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarMonthStats({
  year,
  month,
  entries = [],
  loading = false
}) {
  const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const loggedCount = entries.length;
  const completionPercent = totalDaysInMonth > 0 ? Math.round((loggedCount / totalDaysInMonth) * 100) : 0;

  // Calculate monthly averages from the month's entries
  const validMoods = entries.filter((e) => e.mood !== null && e.mood !== undefined);
  const avgMood = validMoods.length > 0
    ? (validMoods.reduce((acc, curr) => acc + curr.mood, 0) / validMoods.length).toFixed(1)
    : null;

  const validSleep = entries.filter((e) => e.sleepHours !== null && e.sleepHours !== undefined);
  const avgSleep = validSleep.length > 0
    ? (validSleep.reduce((acc, curr) => acc + curr.sleepHours, 0) / validSleep.length).toFixed(1)
    : null;

  function getMoodLabel(score) {
    if (!score) return 'No entries';
    if (score >= 4.5) return 'Very Positive';
    if (score >= 3.5) return 'Mostly Good';
    if (score >= 2.5) return 'Balanced';
    if (score >= 1.5) return 'Low';
    return 'Challenging';
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Monthly Check-in Count */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Check-ins Logged
          </span>
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <div className="space-y-1.5 animate-pulse">
            <div className="h-6 w-16 bg-slate-100 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        ) : (
          <div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {loggedCount} <span className="text-xs font-normal text-slate-400">/ {totalDaysInMonth} days</span>
            </p>
            <p className="text-xs text-brand-600 font-semibold mt-0.5">
              {completionPercent}% consistency
            </p>
          </div>
        )}
      </div>

      {/* 2. Monthly Average Mood */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Mood
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
            <Smile className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <div className="space-y-1.5 animate-pulse">
            <div className="h-6 w-16 bg-slate-100 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        ) : (
          <div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {avgMood ? `${avgMood} / 5` : '--'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {getMoodLabel(avgMood)}
            </p>
          </div>
        )}
      </div>

      {/* 3. Monthly Average Sleep */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Sleep
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <Moon className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <div className="space-y-1.5 animate-pulse">
            <div className="h-6 w-16 bg-slate-100 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        ) : (
          <div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {avgSleep ? `${avgSleep} hrs` : '--'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Nightly average
            </p>
          </div>
        )}
      </div>

      {/* 4. Month Focus */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Month Progress
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <div className="space-y-1.5 animate-pulse">
            <div className="h-6 w-16 bg-slate-100 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        ) : (
          <div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {MONTH_NAMES[month - 1].slice(0, 3)} {year}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {loggedCount > 0 ? `${loggedCount} reflections written` : 'No logs yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
