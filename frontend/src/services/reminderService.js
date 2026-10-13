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
 * Fetch current user's reminder settings
 * GET /api/reminders
 */
export async function getReminderSettings() {
  const response = await fetch(`${API_BASE_URL}/reminders`, {
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    handleUnauthorizedResponse(response);
    throw new Error(data.message || 'Failed to fetch reminder settings');
  }

  return data.data;
}

/**
 * Update current user's reminder settings
 * PUT /api/reminders
 * @param {object} settings - { enabled, reminderTime, timezone }
 */
export async function updateReminderSettings(settings) {
  const response = await fetch(`${API_BASE_URL}/reminders`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  });

  const data = await response.json();
  if (!response.ok) {
    handleUnauthorizedResponse(response);
    const errorMsg = data.errors ? data.errors.join(' ') : (data.message || 'Failed to update reminder settings');
    throw new Error(errorMsg);
  }

  return data.data;
}

export default {
  getReminderSettings,
  updateReminderSettings
};
