import { getToken, handleUnauthorizedResponse } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper to build authorized headers
 */
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

/**
 * Centralized fetch helper for analytics
 */
async function authorizedFetch(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    handleUnauthorizedResponse(response);
    let errorMessage = `Analytics request failed with status ${response.status}`;
    try {
      const data = await response.json();
      errorMessage = data.errors ? data.errors.join(' ') : (data.message || errorMessage);
    } catch {
      // response was not JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Fetch latest 11 entries chronologically for charts
 * GET /api/analytics/recent
 */
export async function getRecentAnalytics() {
  const data = await authorizedFetch(`${API_BASE_URL}/analytics/recent`, {
    headers: getAuthHeaders()
  });
  return data.data || [];
}

/**
 * Fetch 5-vs-5 check-in summary comparison (latest 5 vs previous 5)
 * GET /api/analytics/summary
 */
export async function getAnalyticsSummary() {
  const data = await authorizedFetch(`${API_BASE_URL}/analytics/summary`, {
    headers: getAuthHeaders()
  });
  return data.data;
}

/**
 * Fetch time-series trends over specific date ranges (7d, 30d, 90d, 180d, 365d)
 * GET /api/analytics/trends?range=30d
 * @param {string} [range='30d']
 */
export async function getTrends(range = '30d') {
  const data = await authorizedFetch(
    `${API_BASE_URL}/analytics/trends?range=${encodeURIComponent(range)}`,
    {
      headers: getAuthHeaders()
    }
  );
  return data.data;
}

/**
 * Fetch streak analytics: current streak, longest streak, total check-in days
 * GET /api/analytics/streak
 */
export async function getStreakAnalytics() {
  const data = await authorizedFetch(`${API_BASE_URL}/analytics/streak`, {
    headers: getAuthHeaders()
  });
  return data.data;
}

/**
 * Fetch calendar history for a specific month/year
 * GET /api/analytics/calendar?year=2026&month=10
 * @param {number} [year]
 * @param {number} [month] (1-12)
 */
export async function getCalendarData(year, month) {
  const params = new URLSearchParams();
  if (year) params.append('year', year);
  if (month) params.append('month', month);

  const url = `${API_BASE_URL}/analytics/calendar?${params.toString()}`;
  const data = await authorizedFetch(url, {
    headers: getAuthHeaders()
  });

  return data.data;
}

/**
 * Fetch weather correlation analytics:
 * - mood vs temperature
 * - mood vs weather condition
 * - mood vs precipitation
 * GET /api/analytics/weather
 */
export async function getWeatherAnalytics() {
  const data = await authorizedFetch(`${API_BASE_URL}/analytics/weather`, {
    headers: getAuthHeaders()
  });
  return data.data;
}

export default {
  getRecentAnalytics,
  getAnalyticsSummary,
  getTrends,
  getStreakAnalytics,
  getCalendarData,
  getWeatherAnalytics
};
