import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Moon,
  BookOpen,
  Plus,
  RefreshCw
} from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MOOD_META = {
  1: {
    label: 'Very Bad',
    emoji: '😫',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-500 text-white'
  },
  2: {
    label: 'Bad',
    emoji: '😔',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-500 text-white'
  },
  3: {
    label: 'Okay',
    emoji: '😐',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    badge: 'bg-yellow-500 text-white'
  },
  4: {
    label: 'Good',
    emoji: '😊',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-500 text-white'
  },
  5: {
    label: 'Excellent',
    emoji: '🌟',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-600 text-white'
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MoodCalendar({
  year,
  month,
  entriesByDate = {},
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  loading = false
}) {
  // Compute start day offset and days count using UTC to avoid timezone issues
  const firstDayOfWeek = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sun
  const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Today's date string in YYYY-MM-DD
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Build calendar matrix
  const leadingEmptyDays = Array.from({ length: firstDayOfWeek });
  const monthDays = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{MONTH_NAMES[month - 1]} {year}</span>
              {loading && <RefreshCw className="w-3.5 h-3.5 text-brand-500 animate-spin" />}
            </h2>
            <p className="text-xs text-slate-500">
              Select any day to view or record your daily reflection and wellness metrics.
            </p>
          </div>
        </div>

        {/* Navigation Controls: Prev, Today, Next */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={onToday}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Today
          </button>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
            <button
              onClick={onPrevMonth}
              disabled={loading}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition disabled:opacity-50"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextMonth}
              disabled={loading}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition disabled:opacity-50"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid Days */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Leading empty slots */}
        {leadingEmptyDays.map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="min-h-16 sm:min-h-20 rounded-xl bg-slate-50/50 border border-transparent opacity-30 select-none"
          />
        ))}

        {/* Current Month Days */}
        {monthDays.map((dayNum) => {
          const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const entry = entriesByDate[dayStr];
          const hasEntry = Boolean(entry);
          const isToday = dayStr === todayStr;
          const isSelected = dayStr === selectedDate;
          const isFuture = dayStr > todayStr;
          const moodConfig = hasEntry ? MOOD_META[entry.mood] : null;

          return (
            <button
              key={dayStr}
              type="button"
              data-testid={`calendar-day-${dayStr}`}
              aria-label={`${dayStr}${hasEntry ? `, mood score ${entry.mood} of 5` : ', no entry recorded'}`}
              onClick={() => onSelectDate(dayStr)}
              className={`min-h-16 sm:min-h-20 p-1.5 sm:p-2 rounded-xl text-left flex flex-col justify-between transition relative group border ${
                isSelected
                  ? 'ring-2 ring-brand-600 border-brand-500 shadow-sm z-10'
                  : isToday
                  ? 'border-brand-300 bg-brand-50/20'
                  : hasEntry
                  ? `${moodConfig?.bg || 'bg-slate-50'} ${moodConfig?.border || 'border-slate-200'} hover:border-slate-300`
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
              } ${isFuture ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
            >
              {/* Top Row: Date Number & Today Indicator */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-bold leading-none ${
                    isSelected
                      ? 'text-brand-700'
                      : isToday
                      ? 'text-brand-600 underline decoration-2 underline-offset-2'
                      : 'text-slate-700'
                  }`}
                >
                  {dayNum}
                </span>

                {isToday && (
                  <span className="text-[9px] font-bold text-brand-600 bg-brand-100/70 px-1 py-0.2 rounded hidden sm:inline-block">
                    Today
                  </span>
                )}

                {/* Has Reflection Dot Indicator */}
                {entry?.hasReflection && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block sm:hidden"
                    title="Has reflection"
                  />
                )}
              </div>

              {/* Middle / Bottom Content */}
              {hasEntry ? (
                <div className="w-full space-y-1 mt-1">
                  {/* Mood Emoji + Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-base sm:text-xl leading-none" title={`Mood: ${entry.mood}/5 (${moodConfig?.label})`}>
                      {moodConfig?.emoji}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md hidden sm:inline-block ${
                        moodConfig?.badge || 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {entry.mood}★
                    </span>
                  </div>

                  {/* Sleep and reflection icons */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    {entry.sleepHours !== null && entry.sleepHours !== undefined ? (
                      <span className="flex items-center space-x-0.5 text-slate-600 font-medium truncate">
                        <Moon className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                        <span>{entry.sleepHours}h</span>
                      </span>
                    ) : <span />}

                    {entry.hasReflection && (
                      <BookOpen className="w-2.5 h-2.5 text-slate-400 hidden sm:inline-block" title="Reflection recorded" />
                    )}
                  </div>
                </div>
              ) : (
                /* Empty Day Cell */
                <div className="w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-slate-300 my-auto">
                  {!isFuture && (
                    <Plus className="w-4 h-4 text-slate-400" title="Click to log entry" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mood Legend */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            Mood Key:
          </span>
          {Object.entries(MOOD_META).map(([score, meta]) => (
            <div key={score} className="flex items-center space-x-1 text-slate-600">
              <span className="text-xs">{meta.emoji}</span>
              <span className="text-[11px] font-medium">{score} {meta.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <Moon className="w-3 h-3 text-indigo-400" />
            <span>Sleep (hrs)</span>
          </span>
          <span className="flex items-center space-x-1">
            <BookOpen className="w-3 h-3 text-slate-400" />
            <span>Reflection</span>
          </span>
        </div>
      </div>
    </div>
  );
}
