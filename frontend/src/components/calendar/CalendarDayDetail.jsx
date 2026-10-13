import React from 'react';
import {
  Calendar,
  Smile,
  Moon,
  Tag,
  BookOpen,
  Edit3,
  Trash2,
  Plus,
  X,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

const MOOD_META = {
  1: { label: 'Very Bad', emoji: '😫', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  2: { label: 'Bad', emoji: '😔', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  3: { label: 'Okay', emoji: '😐', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  4: { label: 'Good', emoji: '😊', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  5: { label: 'Excellent', emoji: '🌟', badge: 'bg-violet-100 text-violet-800 border-violet-200' }
};

export default function CalendarDayDetail({
  selectedDate,
  entry,
  loading = false,
  error = null,
  onEditEntry,
  onLogNewEntry,
  onDeleteEntry,
  onClose
}) {
  if (!selectedDate) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-2">
        <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="text-sm font-bold text-slate-700">Select a Date</h3>
        <p className="text-xs text-slate-400">
          Click on any day on the calendar to view its check-in details or record a new entry.
        </p>
      </div>
    );
  }

  // Format date to human-friendly string (e.g. "Wednesday, October 8, 2026")
  const dateObj = new Date(`${selectedDate}T00:00:00Z`);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isFuture = selectedDate > todayStr;
  const isToday = selectedDate === todayStr;

  const moodConfig = entry ? MOOD_META[entry.mood] : null;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {isToday ? 'Today\'s Date' : 'Selected Date'}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
            <span>{formattedDate}</span>
          </h3>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title="Close"
            aria-label="Close day detail"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body States */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
          <span className="text-xs">Fetching day details...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-800 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">Unable to load check-in</span>
          </div>
          <p>{error}</p>
        </div>
      ) : entry ? (
        /* Has Entry State */
        <div className="space-y-4">
          {/* Mood & Sleep Metrics */}
          <div className="grid grid-cols-2 gap-3">
            {/* Mood Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mood
                </span>
                <span className="text-xl">{moodConfig?.emoji}</span>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 leading-tight">
                  {entry.mood} / 5
                </p>
                <span
                  className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border mt-1 ${
                    moodConfig?.badge
                  }`}
                >
                  {moodConfig?.label}
                </span>
              </div>
            </div>

            {/* Sleep Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sleep
                </span>
                <Moon className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 leading-tight">
                  {entry.sleepHours !== null && entry.sleepHours !== undefined
                    ? `${entry.sleepHours} hrs`
                    : 'Not logged'}
                </p>
                {entry.sleepHours !== null && entry.sleepHours !== undefined && (
                  <span className="inline-block text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md mt-1">
                    {entry.sleepHours >= 7 && entry.sleepHours <= 9
                      ? 'Optimal rest'
                      : entry.sleepHours < 6
                      ? 'Short sleep'
                      : 'Long rest'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Feelings Tags */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>Feelings & Emotions</span>
            </span>
            {entry.feelings && entry.feelings.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {entry.feelings.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/60 px-2.5 py-1 rounded-lg"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No specific feeling tags recorded.</p>
            )}
          </div>

          {/* Reflection Note */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>Daily Reflection</span>
            </span>
            {entry.reflection ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed italic">
                &ldquo;{entry.reflection}&rdquo;
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No reflection notes written for this day.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
            {onDeleteEntry && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete mood check-in for ${selectedDate}?`)) {
                    onDeleteEntry(selectedDate);
                  }
                }}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            {onEditEntry && (
              <button
                type="button"
                onClick={() => onEditEntry(entry)}
                className="ml-auto inline-flex items-center space-x-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 rounded-xl transition shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Entry</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Empty Day State (No Entry) */
        <div className="py-4 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No Check-in Logged</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {isFuture
                ? 'This date is in the future. Return on this day to record how you feel!'
                : `You didn't record a mood check-in on ${selectedDate}. You can still log one now.`}
            </p>
          </div>

          {!isFuture && onLogNewEntry && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onLogNewEntry(selectedDate)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Record Mood for This Day</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
