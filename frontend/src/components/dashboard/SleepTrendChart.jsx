import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  Moon,
  Calendar,
  X,
  Edit3,
  Plus,
  AlertCircle,
  RefreshCw,
  Tag,
  BookOpen,
  Smile,
  BedDouble,
  CheckCircle2
} from 'lucide-react';
import { getRecentAnalytics, getTrends } from '../../services/analyticsService';
import moodService from '../../services/moodService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TIME_RANGES = [
  { label: 'Latest 11', value: 'latest11' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' }
];

const MOOD_META = {
  1: { label: 'Very Bad', emoji: '😫' },
  2: { label: 'Bad', emoji: '😔' },
  3: { label: 'Okay', emoji: '😐' },
  4: { label: 'Good', emoji: '😊' },
  5: { label: 'Excellent', emoji: '🌟' }
};

export default function SleepTrendChart({ onEditEntry, onLogNewEntry }) {
  const [selectedRange, setSelectedRange] = useState('latest11');
  const [chartType, setChartType] = useState('line'); // 'line' | 'bar'
  const [dataPoints, setDataPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Day Inspection state
  const [selectedDate, setSelectedDate] = useState(null);
  const [inspectedEntry, setInspectedEntry] = useState(null);
  const [inspectingLoading, setInspectingLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState(null);

  // Fetch trend data
  const fetchChartData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (selectedRange === 'latest11') {
        const recent = await getRecentAnalytics();
        const points = (recent || []).map((e) => ({
          date: e.date,
          mood: e.mood,
          sleepHours: e.sleepHours,
          hasEntry: true,
          feelings: e.feelings || [],
          reflection: e.reflection || ''
        }));
        setDataPoints(points);
      } else {
        const trend = await getTrends(selectedRange);
        setDataPoints(trend?.points || []);
      }
    } catch (err) {
      console.error('Failed to load sleep trend data:', err);
      setError(err.message || 'Failed to load sleep analytics.');
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Click on chart point to inspect day's details
  const handleInspectDate = async (dateStr, fallbackData = null) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    setInspectingLoading(true);
    setInspectionError(null);

    if (fallbackData?.feelings && fallbackData?.feelings.length > 0) {
      setInspectedEntry(fallbackData);
      setInspectingLoading(false);
      return;
    }

    try {
      const entry = await moodService.getMoodByDate(dateStr);
      setInspectedEntry(entry);
    } catch (err) {
      if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('not found') || err.message.toLowerCase().includes('no mood entry'))) {
        setInspectedEntry(null);
      } else {
        setInspectionError(err.message || 'Unable to load details for this day.');
        setInspectedEntry(null);
      }
    } finally {
      setInspectingLoading(false);
    }
  };

  const labels = dataPoints.map((p) => {
    if (!p.date) return '';
    const parts = p.date.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${monthNames[mIdx]} ${parseInt(parts[2], 10)}`;
    }
    return p.date;
  });

  const sleepValues = dataPoints.map((p) => (p.hasEntry ? p.sleepHours : null));

  // Compute sleep statistics for summary pill
  const validSleep = sleepValues.filter((v) => v !== null && v !== undefined);
  const avgSleep = validSleep.length > 0 ? (validSleep.reduce((a, b) => a + b, 0) / validSleep.length).toFixed(1) : null;
  const optimalNights = validSleep.filter((v) => v >= 7 && v <= 9).length;

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Sleep Duration (hrs)',
        data: sleepValues,
        borderColor: '#3b82f6', // blue-500
        backgroundColor: chartType === 'line' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.65)',
        borderWidth: chartType === 'line' ? 2.5 : 0,
        borderRadius: chartType === 'bar' ? 6 : 0,
        tension: 0.35,
        fill: chartType === 'line',
        spanGaps: true,
        pointBackgroundColor: dataPoints.map((p) => {
          if (p.date === selectedDate) return '#1d4ed8';
          return '#3b82f6';
        }),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: dataPoints.map((p) => {
          if (p.date === selectedDate) return 7;
          return p.hasEntry ? 4 : 0;
        }),
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#1d4ed8'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const clickedIndex = elements[0].index;
        const pt = dataPoints[clickedIndex];
        if (pt) {
          handleInspectDate(pt.date, pt);
        }
      }
    },
    onHover: (event, chartElement) => {
      const target = event?.native?.target;
      if (target) {
        target.style.cursor = chartElement && chartElement.length > 0 ? 'pointer' : 'default';
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (items) => {
            if (!items || items.length === 0) return '';
            const idx = items[0].dataIndex;
            const pt = dataPoints[idx];
            return pt?.date ? `📅 Date: ${pt.date}` : items[0].label;
          },
          label: (context) => {
            const val = context.parsed.y;
            if (val === null || val === undefined) {
              return ' No sleep data logged on this day';
            }
            const quality = val >= 7 && val <= 9 ? '🟢 Optimal' : val < 6 ? '🔴 Low sleep' : '🟡 Fair';
            return ` Sleep: ${val} hours (${quality})`;
          },
          afterLabel: () => '👉 Click point to inspect entry details'
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: '#64748b',
          maxTicksLimit: selectedRange === '1y' ? 12 : selectedRange === '6m' ? 10 : 8
        }
      },
      y: {
        type: 'linear',
        min: 0,
        max: 14,
        ticks: {
          stepSize: 2,
          font: { size: 11 },
          color: '#64748b',
          callback: (value) => `${value}h`
        },
        grid: { color: '#f1f5f9' }
      }
    }
  };

  const hasAnyEntries = dataPoints.some((p) => p.hasEntry);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
      {/* Chart Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Sleep Trend
              </h3>
              {avgSleep && (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Avg: {avgSleep} hrs / night
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Nightly sleep hours. 7–9 hours recommended for optimal recovery.
            </p>
          </div>
        </div>

        {/* Timeframe & Chart Style Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Type Toggle: Line / Bar */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-md transition ${
                chartType === 'line'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-md transition ${
                chartType === 'bar'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Bar
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold overflow-x-auto max-w-full">
            {TIME_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setSelectedRange(r.value);
                  setSelectedDate(null);
                  setInspectedEntry(null);
                }}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition ${
                  selectedRange === r.value
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div className="h-64 sm:h-72 w-full relative">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center animate-pulse bg-slate-50 rounded-xl space-y-2">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400">Loading sleep analytics...</span>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-rose-50/50 rounded-xl space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm font-semibold text-rose-900">{error}</p>
            <button
              onClick={fetchChartData}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : !hasAnyEntries ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl space-y-3">
            <BedDouble className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No sleep records found for this period</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Log daily check-ins with your sleep hours to track rest patterns and quality over time.
            </p>
            {onLogNewEntry && (
              <button
                onClick={() => onLogNewEntry()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Check-in</span>
              </button>
            )}
          </div>
        ) : (
          chartType === 'line' ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )
        )}
      </div>

      {/* Selected Day Inspection Drawer / Card */}
      {selectedDate && (
        <div className="mt-4 p-4 sm:p-5 rounded-xl border border-blue-200 bg-blue-50/30 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                Inspecting Day: <span className="text-blue-700">{selectedDate}</span>
              </h4>
            </div>
            <button
              onClick={() => {
                setSelectedDate(null);
                setInspectedEntry(null);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Close inspection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-3">
            {inspectingLoading ? (
              <div className="flex items-center justify-center py-4 space-x-2 text-slate-500 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Fetching details for {selectedDate}...</span>
              </div>
            ) : inspectionError ? (
              <div className="text-xs text-rose-600 flex items-center space-x-2 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inspectionError}</span>
              </div>
            ) : inspectedEntry ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">
                      {inspectedEntry.sleepHours >= 7 ? '🌙' : '⏰'}
                    </span>
                    <div>
                      <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        Sleep: {inspectedEntry.sleepHours} hours
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 text-xs text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-md font-semibold">
                    <span>{MOOD_META[inspectedEntry.mood]?.emoji || '😊'}</span>
                    <span>Mood: {inspectedEntry.mood}/5</span>
                  </div>
                </div>

                {inspectedEntry.feelings && inspectedEntry.feelings.length > 0 && (
                  <div className="flex items-start space-x-2 pt-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                      {inspectedEntry.feelings.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {inspectedEntry.reflection ? (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 italic space-y-1">
                    <div className="flex items-center space-x-1 text-slate-400 not-italic text-[10px] font-semibold uppercase">
                      <BookOpen className="w-3 h-3" />
                      <span>Daily Reflection</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-normal">
                      &ldquo;{inspectedEntry.reflection}&rdquo;
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No reflection written for this check-in.</p>
                )}

                {onEditEntry && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onEditEntry(inspectedEntry)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit This Entry</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p className="font-semibold text-slate-700">No sleep record for this day</p>
                  <p>You did not record a check-in on {selectedDate}.</p>
                </div>
                {onLogNewEntry && (
                  <button
                    onClick={() => onLogNewEntry(selectedDate)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Check-in for {selectedDate}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
