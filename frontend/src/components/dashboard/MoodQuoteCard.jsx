import React from 'react';
import { Sparkles, Quote } from 'lucide-react';
import { getQuoteForMood } from '../../utils/moodQuotes';

export default function MoodQuoteCard({ mood }) {
  const quote = getQuoteForMood(mood);

  return (
    <div className="bg-linear-to-br from-brand-50/70 via-white to-purple-50/50 p-5 sm:p-6 rounded-2xl border border-brand-100/70 shadow-2xs flex flex-col justify-between relative overflow-hidden">
      {/* Decorative background quote mark */}
      <Quote className="absolute right-3 bottom-3 w-20 h-20 text-brand-100/40 pointer-events-none -rotate-12" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-brand-100/50">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <h2 className="text-xs font-bold text-brand-800 uppercase tracking-wider">
            Daily Inspiration
          </h2>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-100/60 text-brand-700">
          {quote.theme}
        </span>
      </div>

      {/* Quote Body */}
      <div className="py-4 relative z-10 space-y-3">
        <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed italic">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-xs font-semibold text-brand-700 text-right">
          &mdash; {quote.author}
        </p>
      </div>

      {/* Footer hint */}
      <div className="pt-2 border-t border-brand-100/40 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Tailored to your current mindset</span>
        <span className="text-xs">✨</span>
      </div>
    </div>
  );
}
