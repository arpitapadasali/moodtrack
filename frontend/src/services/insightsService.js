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
 * Fetch rule-based mood and sleep insights
 * GET /api/insights
 */
export async function getInsights() {
  const response = await fetch(`${API_BASE_URL}/insights`, {
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    handleUnauthorizedResponse(response);
    throw new Error(data.message || 'Failed to fetch mood insights');
  }

  return data.data;
}

/**
 * Fetch optional ML pattern-detection insights
 * GET /api/insights/ml
 */
export async function getMlInsights() {
  const response = await fetch(`${API_BASE_URL}/insights/ml`, {
    headers: getAuthHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    handleUnauthorizedResponse(response);
    throw new Error(data.message || 'Failed to fetch ML insights');
  }

  return data.data;
}

export default {
  getInsights,
  getMlInsights
};
