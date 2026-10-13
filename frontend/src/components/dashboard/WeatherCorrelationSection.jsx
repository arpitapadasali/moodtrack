import React from 'react';
import {
  CloudSun,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Droplets,
  Thermometer,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Helper to pick weather condition icon
 */
function getWeatherIcon(condition) {
  const c = (condition || '').toLowerCase();
  if (c.includes('clear') || c.includes('sun')) return Sun;
  if (c.includes('cloud') || c.includes('overcast')) return Cloud;
  if (c.includes('rain') || c.includes('drizzle')) return CloudRain;
  if (c.includes('snow') || c.includes('flurr')) return CloudSnow;
  if (c.includes('thunder') || c.includes('storm')) return CloudLightning;
  return CloudSun;
}

export default function WeatherCorrelationSection({ weatherData, loading, onOpenModal }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 animate-pulse space-y-3">
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-6 w-48 bg-slate-100 rounded" />
          <div className="h-20 w-full bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return null;
  }

  const {
    hasEnoughData,
    totalWeatherEntries,
    minEntriesRequired,
    disclaimer,
    temperatureAnalytics,
    conditionAnalytics,
    precipitationAnalytics
  } = weatherData;

  return (
    <div className="space-y-6">
      {/* 1. Mandatory Correlation vs Causation Clarification Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 shadow-2xs space-y-1.5">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <h4 className="text-xs sm:text-sm font-bold text-amber-900">
            Correlation vs. Causation Notice
          </h4>
        </div>
        <p className="text-xs text-amber-800/90 leading-relaxed pl-6">
          {disclaimer}
        </p>
      </div>

      {/* 2. Insufficient Data State */}
      {!hasEnoughData && (
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <CloudSun className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Gathering Weather Data ({totalWeatherEntries} of {minEntriesRequired} Entries)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              At least {minEntriesRequired} check-ins with location/weather are required before correlation metrics can be calculated reliably without misleading statistical noise.
            </p>
          </div>
          <div className="pt-2">
            {onOpenModal ? (
              <button
                type="button"
                onClick={onOpenModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
              >
                <span>Add Check-in With Location</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <span>Log Check-in on Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 3. Sufficient Data: Three Core Analytical Panels */}
      {hasEnoughData && (
        <div className="space-y-6">
          {/* Top Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card A: Mood vs Temperature */}
            {temperatureAnalytics && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                    Mood vs Temperature
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      temperatureAnalytics.relationshipType === 'positive'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : temperatureAnalytics.relationshipType === 'negative'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    r = {temperatureAnalytics.correlationCoefficient > 0 ? `+${temperatureAnalytics.correlationCoefficient}` : temperatureAnalytics.correlationCoefficient}
                  </span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-slate-900 capitalize">
                    {temperatureAnalytics.relationshipType} Link
                  </span>
                  <span className="text-xs text-slate-400">
                    ({temperatureAnalytics.sampleSize} days)
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {temperatureAnalytics.description}
                </p>

                {/* Temperature Bands */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  {temperatureAnalytics.temperatureBands.map((band) => (
                    <div key={band.label} className="flex justify-between items-center text-slate-600">
                      <span>{band.label}:</span>
                      <span className="font-semibold text-slate-800">
                        {band.avgMood !== null ? `${band.avgMood}/5 (${band.count}d)` : 'No entries'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card B: Mood vs Weather Condition */}
            {conditionAnalytics && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    Mood vs Conditions
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {conditionAnalytics.conditionBreakdown?.length} Types
                  </span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-slate-900">
                    Condition Breakdown
                  </span>
                  <span className="text-xs text-slate-400">
                    ({conditionAnalytics.sampleSize} days)
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {conditionAnalytics.description}
                </p>

                {/* Condition Breakdown List */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  {conditionAnalytics.conditionBreakdown.slice(0, 3).map((item) => {
                    const IconComp = getWeatherIcon(item.condition);
                    return (
                      <div key={item.condition} className="flex justify-between items-center text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <IconComp className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.condition}</span>
                        </span>
                        <span className="font-semibold text-slate-800">
                          {item.avgMood}/5 ({item.count}d, {item.percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Card C: Mood vs Precipitation */}
            {precipitationAnalytics && (
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    Mood vs Precipitation
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    r = {precipitationAnalytics.correlationCoefficient > 0 ? `+${precipitationAnalytics.correlationCoefficient}` : precipitationAnalytics.correlationCoefficient}
                  </span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-slate-900">
                    Dry vs Wet Days
                  </span>
                  <span className="text-xs text-slate-400">
                    ({precipitationAnalytics.sampleSize} days)
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {precipitationAnalytics.description}
                </p>

                {/* Dry vs Precip comparison */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Dry Days:</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {precipitationAnalytics.dryDays.avgMood !== null
                        ? `${precipitationAnalytics.dryDays.avgMood}/5 (${precipitationAnalytics.dryDays.count}d)`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                      <span>Precipitation Days:</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {precipitationAnalytics.precipitationDays.avgMood !== null
                        ? `${precipitationAnalytics.precipitationDays.avgMood}/5 (${precipitationAnalytics.precipitationDays.count}d)`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Condition Matrix Grid */}
          {conditionAnalytics?.conditionBreakdown?.length > 0 && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CloudSun className="w-4 h-4 text-brand-600" />
                    <span>Complete Weather Condition Analysis</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Co-occurrence frequency and average mood ratings across all recorded ambient conditions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {conditionAnalytics.conditionBreakdown.map((item) => {
                  const IconComp = getWeatherIcon(item.condition);
                  return (
                    <div
                      key={item.condition}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <IconComp className="w-4 h-4 text-brand-600" />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {item.count} day{item.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {item.condition}
                      </p>
                      <p className="text-base font-bold text-slate-900">
                        {item.avgMood} <span className="text-xs font-normal text-slate-400">/ 5</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
