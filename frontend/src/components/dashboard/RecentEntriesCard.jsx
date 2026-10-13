import React from 'react';
import { History, Moon, MessageSquare } from 'lucide-react';

export default function RecentEntriesCard({ entries = [], loading, onEditEntry }) {
  const moodMap = {
    1: { emoji: '😫', label: 'Terrible', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    2: { emoji: '😔', label: 'Down', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
    3: { emoji: '😐', label: 'Neutral', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    4: { emoji: '😊', label: 'Good', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    5: { emoji: '🌟', label: 'Great', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Recent Mood Logs ({entries.length})
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Latest check-ins
        </span>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl"></div>
            ))}
          </div>
        ) : entries.length > 0 ? (
          entries.map((entry) => {
            const moodInfo = moodMap[entry.mood] || { emoji: '🙂', label: `Mood: ${entry.mood}`, badge: 'bg-slate-50 text-slate-700 border-slate-200' };
            const dateStr = new Date(entry.entryDate).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div
                key={entry.id}
                onClick={() => onEditEntry && onEditEntry(entry)}
                className="p-3 sm:p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/20 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Emoji, Date, and Mood */}
                <div className="flex items-start sm:items-center space-x-3">
                  <span className="text-2xl sm:text-3xl select-none group-hover:scale-110 transition shrink-0" role="img" aria-label={moodInfo.label}>
                    {moodInfo.emoji}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {dateStr}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${moodInfo.badge}`}>
                        {entry.mood}/5 &middot; {moodInfo.label}
                      </span>
                    </div>

                    {/* Feelings Tags */}
                    {entry.feelings && entry.feelings.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {entry.feelings.slice(0, 4).map((f, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                          >
                            #{f}
                          </span>
                        ))}
                        {entry.feelings.length > 4 && (
                          <span className="text-[10px] text-slate-400">+{entry.feelings.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Reflection Excerpt & Sleep Hours */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 text-xs text-slate-500 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  {entry.reflection && (
                    <div className="flex items-center space-x-1 max-w-xs truncate text-slate-600" title={entry.reflection}>
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate italic max-w-[160px] sm:max-w-[200px]">
                        &ldquo;{entry.reflection}&rdquo;
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100/80 rounded-lg shrink-0">
                    <Moon className="w-3 h-3 text-indigo-500" />
                    <span className="font-semibold text-slate-700">{entry.sleepHours}h</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="text-center py-6 text-slate-400 space-y-1">
            <p className="text-sm">No recent entries recorded yet.</p>
            <p className="text-xs">Your logged moods will show up here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
