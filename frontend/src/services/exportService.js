import { getToken, handleUnauthorizedResponse } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper to trigger file download in browser from Blob
 * @param {Blob} blob
 * @param {string} fallbackFilename
 * @param {Headers} headers
 */
function triggerBrowserDownload(blob, fallbackFilename, headers) {
  let filename = fallbackFilename;

  // Try extracting filename from Content-Disposition header if exposed
  const disposition = headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 1000);

  return filename;
}

/**
 * Export user's mood history as JSON
 * GET /api/export/json
 * @returns {Promise<string>} downloaded filename
 */
export async function exportMoodsAsJson() {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/export/json`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    handleUnauthorizedResponse(response);
    let errorMsg = 'Failed to export mood history as JSON.';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch {
      // response might be raw text
    }
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const todayStr = new Date().toISOString().split('T')[0];
  return triggerBrowserDownload(blob, `moodtrack-export-${todayStr}.json`, response.headers);
}

/**
 * Export user's mood history as CSV
 * GET /api/export/csv
 * @returns {Promise<string>} downloaded filename
 */
export async function exportMoodsAsCsv() {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/export/csv`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    handleUnauthorizedResponse(response);
    let errorMsg = 'Failed to export mood history as CSV.';
    try {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch {
      // response might be raw text
    }
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const todayStr = new Date().toISOString().split('T')[0];
  return triggerBrowserDownload(blob, `moodtrack-export-${todayStr}.csv`, response.headers);
}

export default {
  exportMoodsAsJson,
  exportMoodsAsCsv
};
