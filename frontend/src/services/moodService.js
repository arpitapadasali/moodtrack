import { getToken, handleUnauthorizedResponse } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper to prepare authorized request headers
 */
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

/**
 * Centralized fetch helper with 401 interception and error message extraction
 */
async function authorizedFetch(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    handleUnauthorizedResponse(response);
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.errors ? errorData.errors.join(' ') : (errorData.message || errorMessage);
    } catch {
      // response body was not json
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Format Date to YYYY-MM-DD string
 */
export function formatDateParam(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch today's mood entry for the logged-in user
 * GET /api/moods/today
 */
export async function getTodayEntry() {
  const data = await authorizedFetch(`${API_BASE_URL}/moods/today`, {
    headers: getAuthHeaders()
  });
  return data.data; // entry object or null
}

/**
 * Fetch recent mood records (default: 11)
 * GET /api/moods/recent
 */
export async function getRecentEntries(limit = 11) {
  const data = await authorizedFetch(`${API_BASE_URL}/moods/recent?limit=${encodeURIComponent(limit)}`, {
    headers: getAuthHeaders()
  });
  return data.data || [];
}

/**
 * Fetch a mood entry for a specific date
 * GET /api/moods/:date
 */
export async function getMoodByDate(date) {
  const dateStr = formatDateParam(date);
  const data = await authorizedFetch(`${API_BASE_URL}/moods/${encodeURIComponent(dateStr)}`, {
    headers: getAuthHeaders()
  });
  return data.data;
}

/**
 * Create a new mood entry
 * POST /api/moods
 */
export async function createMoodEntry(entryData) {
  const payload = {
    ...entryData,
    entryDate: formatDateParam(entryData.entryDate)
  };

  const data = await authorizedFetch(`${API_BASE_URL}/moods`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  return data.data;
}

/**
 * Update an existing mood entry for a specific date
 * PUT /api/moods/:date
 */
export async function updateMoodEntry(date, entryData) {
  const dateStr = formatDateParam(date);
  const data = await authorizedFetch(`${API_BASE_URL}/moods/${encodeURIComponent(dateStr)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(entryData)
  });

  return data.data;
}

/**
 * Delete a mood entry for a specific date
 * DELETE /api/moods/:date
 */
export async function deleteMoodEntry(date) {
  const dateStr = formatDateParam(date);
  const data = await authorizedFetch(`${API_BASE_URL}/moods/${encodeURIComponent(dateStr)}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  return data.data;
}

/**
 * Fetch overview statistics summary
 * GET /api/moods/summary
 */
export async function getMoodSummary() {
  const data = await authorizedFetch(`${API_BASE_URL}/moods/summary`, {
    headers: getAuthHeaders()
  });

  return data.data;
}

export default {
  formatDateParam,
  getTodayEntry,
  getRecentEntries,
  getMoodByDate,
  createMoodEntry,
  updateMoodEntry,
  deleteMoodEntry,
  getMoodSummary
};
