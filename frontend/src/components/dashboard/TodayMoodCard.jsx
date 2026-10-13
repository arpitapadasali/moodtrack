import React from 'react';
import { Calendar, Moon, Edit3, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function TodayMoodCard({ todayEntry, loading, onOpenModal }) {
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const moodConfig = {
    1: { emoji: '😫', label: 'Terrible', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    2: { emoji: '😔', label: 'Down', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    3: { emoji: '😐', label: 'Neutral', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    4: { emoji: '😊', label: 'Good', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    5: { emoji: '🌟', label: 'Great', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  };

  const currentMood = todayEntry ? moodConfig[todayEntry.mood] || { emoji: '🙂', label: `Rating: ${todayEntry.mood}`, color: 'bg-slate-50 text-slate-700 border-slate-200' } : null;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Today&apos;s Mood Check-in
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {formattedDate}
        </span>
      </div>

      {/* Card Body */}
      <div className="py-5">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-slate-100 rounded-xl w-1/3"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
            <div className="h-12 bg-slate-100 rounded-xl"></div>
          </div>
        ) : todayEntry ? (
          <div className="space-y-4">
            {/* Mood & Sleep Overview */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="text-4xl select-none" role="img" aria-label={currentMood?.label}>
                  {currentMood?.emoji}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-900">
                      {currentMood?.label}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${currentMood?.color}`}>
                      {todayEntry.mood} / 5
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Logged for today
                  </p>
                </div>
              </div>

              {/* Sleep Hours Badge */}
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 text-xs font-medium">
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span><strong>{todayEntry.sleepHours}</strong> hrs sleep</span>
              </div>
            </div>

            {/* Feelings Tags */}
            {todayEntry.feelings && todayEntry.feelings.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Feelings
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {todayEntry.feelings.map((feeling, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
                    >
                      #{feeling}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reflection Text */}
            {todayEntry.reflection && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Reflection
                </span>
                <blockquote className="text-xs sm:text-sm text-slate-700 bg-slate-50 border-l-2 border-brand-400 p-2.5 rounded-r-lg italic">
                  &ldquo;{todayEntry.reflection}&rdquo;
                </blockquote>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-4 space-y-2">
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✨
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              How are you feeling today?
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t recorded your mood yet today. Logging only takes a few moments and helps uncover emotional patterns.
            </p>
          </div>
        )}
      </div>

      {/* Card Action Button */}
      <div className="pt-3 border-t border-slate-100">
        <button
          onClick={onOpenModal}
          className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition ${
            todayEntry
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              : 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs'
          }`}
        >
          {todayEntry ? (
            <>
              <Edit3 className="w-4 h-4" />
              <span>Edit Today&apos;s Entry</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Record Today&apos;s Mood</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
