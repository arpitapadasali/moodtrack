import React from 'react';
import { Smile, Moon, Flame, CalendarCheck, TrendingUp, TrendingDown } from 'lucide-react';

export default function AnalyticsSummaryCards({ summary, comparison, streakData, loading }) {
  // Extract comparison data (Latest 5 vs Previous 5 check-ins)
  const moodChange = comparison?.comparison?.moodChangePercent;
  const sleepChange = comparison?.comparison?.sleepChangePercent;

  // Use latest 5 average if comparison is available, otherwise fall back to summary average
  const displayAvgMood = comparison?.latest5?.averageMood ?? summary?.averageMood;
  const displayAvgSleep = comparison?.latest5?.averageSleep ?? summary?.averageSleep;
  const currentStreakVal = streakData?.currentStreak ?? summary?.currentStreak ?? 0;
  const longestStreakVal = streakData?.longestStreak ?? 0;
  const totalEntriesVal = streakData?.totalCheckInDays ?? summary?.totalEntries ?? 0;

  const cards = [
    {
      title: 'Average Mood',
      value: displayAvgMood ? `${displayAvgMood} / 5` : '--',
      subtitle: displayAvgMood ? getMoodLabel(displayAvgMood) : 'No entries yet',
      badge: moodChange !== null && moodChange !== undefined ? (
        <span
          className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            moodChange >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {moodChange >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {moodChange > 0 ? `+${moodChange}%` : `${moodChange}%`} vs prev 5
        </span>
      ) : null,
      icon: Smile,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Average Sleep',
      value: displayAvgSleep ? `${displayAvgSleep} hrs` : '--',
      subtitle: displayAvgSleep ? 'Per night' : 'No entries yet',
      badge: sleepChange !== null && sleepChange !== undefined ? (
        <span
          className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
            sleepChange >= 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {sleepChange >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
          {sleepChange > 0 ? `+${sleepChange}%` : `${sleepChange}%`} vs prev 5
        </span>
      ) : null,
      icon: Moon,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Current Streak',
      value: `${currentStreakVal} ${currentStreakVal === 1 ? 'day' : 'days'}`,
      subtitle: longestStreakVal > 0 ? `Best streak: ${longestStreakVal} days` : 'Active check-in',
      icon: Flame,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50'
    },
    {
      title: 'Total Entries',
      value: `${totalEntriesVal}`,
      subtitle: 'Recorded moods',
      icon: CalendarCheck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    }
  ];

  function getMoodLabel(score) {
    if (score >= 4.5) return 'Very Positive';
    if (score >= 3.5) return 'Mostly Good';
    if (score >= 2.5) return 'Neutral / Balanced';
    if (score >= 1.5) return 'Low';
    return 'Challenging';
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-6 w-16 bg-slate-100 rounded"></div>
                <div className="h-3 w-24 bg-slate-100 rounded"></div>
              </div>
            ) : (
              <div>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {card.value}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className="text-xs text-slate-500 truncate">
                    {card.subtitle}
                  </span>
                  {card.badge}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
