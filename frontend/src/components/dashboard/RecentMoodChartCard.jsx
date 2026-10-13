import React, { useState, useEffect } from 'react';
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
import { Line } from 'react-chartjs-2';
import { TrendingUp, BarChart2 } from 'lucide-react';
import { getTrends } from '../../services/analyticsService';

// Register Chart.js components
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
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' }
];

export default function RecentMoodChartCard({ initialEntries = [], loading: initialLoading }) {
  const [selectedRange, setSelectedRange] = useState('30d');
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartMode, setChartMode] = useState('both'); // 'mood' or 'both'

  // Fetch trend time-series data when selectedRange changes
  useEffect(() => {
    let isMounted = true;
    async function fetchTrend() {
      setLoading(true);
      try {
        const result = await getTrends(selectedRange);
        if (isMounted) {
          setTrendData(result);
        }
      } catch (err) {
        console.warn('Could not load range trends from analytics backend, using fallback:', err.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchTrend();
    return () => {
      isMounted = false;
    };
  }, [selectedRange]);

  // Determine points to display: from trendData backend or initialEntries fallback
  let displayPoints = [];
  if (trendData?.points && trendData.points.length > 0) {
    displayPoints = trendData.points;
  } else if (initialEntries && initialEntries.length > 0) {
    // Reverse initialEntries to chronological order
    displayPoints = [...initialEntries].reverse().map((e) => ({
      date: typeof e.entryDate === 'string' ? e.entryDate.split('T')[0] : e.date,
      mood: e.mood,
      sleepHours: e.sleepHours,
      hasEntry: true
    }));
  }

  const labels = displayPoints.map((p) => {
    const parts = p.date.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${monthNames[mIdx]} ${parseInt(parts[2], 10)}`;
    }
    return p.date;
  });

  const moodData = displayPoints.map((p) => (p.hasEntry ? p.mood : null));
  const sleepData = displayPoints.map((p) => (p.hasEntry ? p.sleepHours : null));

  const datasets = [
    {
      label: 'Mood (1-5)',
      data: moodData,
      borderColor: '#7c3aed', // brand-600
      backgroundColor: 'rgba(124, 58, 237, 0.10)',
      tension: 0.35,
      spanGaps: true, // Span across missing dates without distorting values
      fill: true,
      pointBackgroundColor: '#7c3aed',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: (ctx) => (ctx.raw !== null ? 3.5 : 0),
      pointHoverRadius: 6,
      yAxisID: 'y'
    }
  ];

  if (chartMode === 'both') {
    datasets.push({
      label: 'Sleep (hours)',
      data: sleepData,
      borderColor: '#3b82f6', // blue-500
      backgroundColor: 'rgba(59, 130, 246, 0.08)',
      borderDash: [4, 4],
      tension: 0.35,
      spanGaps: true,
      fill: false,
      pointBackgroundColor: '#3b82f6',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: (ctx) => (ctx.raw !== null ? 3.5 : 0),
      pointHoverRadius: 6,
      yAxisID: 'y1'
    });
  }

  const chartData = {
    labels,
    datasets
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 11, family: 'system-ui' }
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            if (val === null || val === undefined) return ' No check-in';
            if (context.dataset.yAxisID === 'y') {
              const moodLabels = { 1: 'Very Bad', 2: 'Bad', 3: 'Okay', 4: 'Good', 5: 'Excellent' };
              return ` Mood: ${val}/5 (${moodLabels[val] || val})`;
            }
            return ` Sleep: ${val} hrs`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: '#64748b',
          maxTicksLimit: selectedRange === '365d' ? 12 : selectedRange === '90d' ? 10 : 8
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 1,
        max: 5,
        ticks: {
          stepSize: 1,
          font: { size: 11 },
          color: '#64748b',
          callback: (value) => `${value}★`
        },
        grid: { color: '#f1f5f9' }
      },
      ...(chartMode === 'both' && {
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          max: 12,
          grid: { drawOnChartArea: false },
          ticks: {
            font: { size: 11 },
            color: '#3b82f6',
            callback: (value) => `${value}h`
          }
        }
      })
    }
  };

  const isDataLoading = initialLoading || loading;
  const hasLoggedPoints = displayPoints.some((p) => p.hasEntry);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      {/* Header with Title, Range Selector & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Mood & Sleep Trends
          </h2>
          {trendData && (
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              ({trendData.loggedDays} of {trendData.periodDays} days tracked &middot; {trendData.completionRate}%)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Buttons: 7D, 30D, 90D, 6M, 1Y */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            {TIME_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedRange(r.value)}
                className={`px-2.5 py-1 rounded-md transition ${
                  selectedRange === r.value
                    ? 'bg-white text-brand-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setChartMode('mood')}
              className={`px-2 py-1 rounded-md transition ${
                chartMode === 'mood' ? 'bg-white text-brand-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Mood
            </button>
            <button
              onClick={() => setChartMode('both')}
              className={`px-2 py-1 rounded-md transition ${
                chartMode === 'both' ? 'bg-white text-brand-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Both
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-64 sm:h-72 w-full">
        {isDataLoading ? (
          <div className="h-full flex items-center justify-center animate-pulse bg-slate-50 rounded-xl">
            <span className="text-xs text-slate-400">Loading time-series trends...</span>
          </div>
        ) : hasLoggedPoints ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl space-y-2">
            <BarChart2 className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">No mood records in this timeframe</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Check in daily to build your historical trend analysis across {selectedRange.toUpperCase()}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
