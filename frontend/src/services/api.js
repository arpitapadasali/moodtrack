const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Health check service to verify backend API connectivity
 * @returns {Promise<{success: boolean, message: string, timestamp?: string}>}
 */
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`API responded with HTTP status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Unable to connect to backend API'
    };
  }
}

export default {
  checkApiHealth
};
