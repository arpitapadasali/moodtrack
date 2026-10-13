import React, { useState, useEffect } from 'react';
import { X, Moon, Calendar, MessageSquare, Tag, Trash2, CloudSun } from 'lucide-react';
import { formatDateParam } from '../../services/moodService';

const COMMON_FEELINGS = [
  'grateful', 'happy', 'calm', 'focused',
  'energetic', 'tired', 'stressed', 'anxious',
  'peaceful', 'optimistic', 'overwhelmed', 'proud',
  'motivated', 'content', 'relieved', 'restless'
];

const MOOD_OPTIONS = [
  { value: 1, emoji: '😫', label: 'Very Bad', desc: 'Exhausted / Overwhelmed' },
  { value: 2, emoji: '😔', label: 'Bad', desc: 'Low energy / Down' },
  { value: 3, emoji: '😐', label: 'Okay', desc: 'Neutral / Balanced' },
  { value: 4, emoji: '😊', label: 'Good', desc: 'Content / Positive' },
  { value: 5, emoji: '🌟', label: 'Excellent', desc: 'Vibrant / Thriving' }
];

export default function MoodEntryModal({ isOpen, onClose, existingEntry, onSave, onDelete }) {
  const [mood, setMood] = useState(4);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [selectedFeelings, setSelectedFeelings] = useState([]);
  const [customFeeling, setCustomFeeling] = useState('');
  const [reflection, setReflection] = useState('');
  const [location, setLocation] = useState('');
  const [entryDate, setEntryDate] = useState(formatDateParam(new Date()));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Synchronize state when modal opens or existingEntry changes
  useEffect(() => {
    if (existingEntry) {
      setMood(existingEntry.mood || 4);
      setSleepHours(existingEntry.sleepHours ?? 7.5);
      setSelectedFeelings(existingEntry.feelings || []);
      setReflection(existingEntry.reflection || '');
      setEntryDate(formatDateParam(existingEntry.entryDate));
      setLocation('');
    } else {
      setMood(4);
      setSleepHours(7.5);
      setSelectedFeelings(['grateful', 'calm']);
      setReflection('');
      setEntryDate(formatDateParam(new Date()));
      setLocation('');
    }
    setError('');
  }, [existingEntry, isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEditing = Boolean(existingEntry);

  const toggleFeeling = (feeling) => {
    if (selectedFeelings.includes(feeling)) {
      setSelectedFeelings(selectedFeelings.filter((f) => f !== feeling));
    } else {
      if (selectedFeelings.length >= 20) {
        setError('Maximum of 20 feelings allowed.');
        return;
      }
      setSelectedFeelings([...selectedFeelings, feeling]);
    }
  };

  const handleAddCustomFeeling = (e) => {
    e.preventDefault();
    const trimmed = customFeeling.trim().toLowerCase().replace(/^#/, '');
    if (!trimmed) return;

    if (trimmed.length > 30) {
      setError('Feeling tag cannot exceed 30 characters.');
      return;
    }

    if (!selectedFeelings.includes(trimmed)) {
      if (selectedFeelings.length >= 20) {
        setError('Maximum of 20 feelings allowed.');
        return;
      }
      setSelectedFeelings([...selectedFeelings, trimmed]);
      setCustomFeeling('');
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedMood = Number(mood);
    if (isNaN(parsedMood) || parsedMood < 1 || parsedMood > 5) {
      setError('Please select a valid mood rating between 1 and 5.');
      return;
    }

    const parsedSleep = Number(sleepHours);
    if (isNaN(parsedSleep) || parsedSleep < 0 || parsedSleep > 24) {
      setError('Sleep hours must be a realistic value between 0 and 24 hours.');
      return;
    }

    if (reflection && reflection.length > 2000) {
      setError('Reflection note exceeds maximum allowed length of 2000 characters.');
      return;
    }

    if (location && location.trim().length > 100) {
      setError('Location query cannot exceed 100 characters.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        mood: parsedMood,
        sleepHours: parsedSleep,
        feelings: selectedFeelings,
        reflection: reflection.trim(),
        entryDate
      };
      if (location && location.trim().length > 0) {
        payload.location = location.trim();
      }

      await onSave(payload, isEditing);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save mood entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !isEditing) return;
    if (!window.confirm(`Are you sure you want to delete the mood entry for ${entryDate}?`)) {
      return;
    }

    setDeleting(true);
    setError('');
    try {
      await onDelete(entryDate);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete mood entry.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mood-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">🌱</span>
            <h3 id="mood-modal-title" className="font-bold text-slate-900 text-base">
              {isEditing ? `Edit Mood Check-in (${entryDate})` : 'Log New Mood Check-in'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm p-3.5 rounded-xl flex items-start space-x-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* 1. Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-600" />
              <span>Entry Date</span>
            </label>
            <input
              type="date"
              value={entryDate}
              disabled={isEditing} // Date is immutable in PUT /api/moods/:date
              onChange={(e) => setEntryDate(e.target.value)}
              max={formatDateParam(new Date())}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
            {isEditing && (
              <span className="block text-[11px] text-slate-400 mt-1">
                Date cannot be changed when editing an existing check-in.
              </span>
            )}
          </div>

          {/* 2. Mood Scale (1 to 5) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Overall Mood</span>
              <span className="text-brand-600 font-bold text-xs sm:text-sm">
                {MOOD_OPTIONS.find((m) => m.value === mood)?.label} ({mood}/5)
              </span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setMood(opt.value)}
                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    mood === opt.value
                      ? 'border-brand-600 bg-brand-50/70 ring-2 ring-brand-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl mb-1">{opt.emoji}</span>
                  <span className="text-xs font-bold text-slate-800">{opt.value}</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-full font-medium">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sleep Hours */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sleep Duration</span>
              </label>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                {sleepHours} hours
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="16"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0h (No sleep)</span>
              <span>8h (Recommended)</span>
              <span>16h</span>
            </div>
          </div>

          {/* 4. Feelings Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-600" />
              <span>Emotions & Feelings ({selectedFeelings.length}/20)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 border border-slate-100 rounded-xl bg-slate-50/30">
              {COMMON_FEELINGS.map((feeling) => {
                const isSelected = selectedFeelings.includes(feeling);
                return (
                  <button
                    type="button"
                    key={feeling}
                    onClick={() => toggleFeeling(feeling)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-2xs font-semibold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    #{feeling}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="text"
                placeholder="Add custom feeling tag..."
                value={customFeeling}
                onChange={(e) => setCustomFeeling(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomFeeling(e);
                  }
                }}
                className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddCustomFeeling}
                className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* 5. Reflection Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Daily Reflection</span>
              </label>
              <span className="text-[10px] text-slate-400">
                {reflection.length}/2000
              </span>
            </div>
            <textarea
              rows="3"
              maxLength={2000}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What went well today? What thoughts or events shaped your mood?"
              className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* 6. Optional Location for Weather Correlation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                <span>Location / City (Optional)</span>
              </label>
              <span className="text-[10px] text-slate-400">
                For weather correlation
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. Seattle, London, Tokyo..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {existingEntry && (existingEntry.temperature !== undefined && existingEntry.temperature !== null || existingEntry.weatherCondition) && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 bg-amber-50/60 border border-amber-200/60 px-2.5 py-1.5 rounded-lg">
                <CloudSun className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="font-semibold text-slate-800">Recorded Weather:</span>
                <span>
                  {existingEntry.temperature !== null && existingEntry.temperature !== undefined ? `${existingEntry.temperature}°C` : ''}
                  {existingEntry.weatherCondition ? ` • ${existingEntry.weatherCondition}` : ''}
                  {existingEntry.precipitation !== null && existingEntry.precipitation !== undefined ? ` • ${existingEntry.precipitation}mm precipitation` : ''}
                </span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              MoodTrack retrieves coarse ambient metrics (temperature, condition, precipitation) to discover personal patterns. Precise GPS coordinates are never stored.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving || deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || deleting}
                className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition shadow-xs disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditing ? 'Update Check-in' : 'Save Check-in'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
