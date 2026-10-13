const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'moodtrack_token';

/**
 * Retrieve saved JWT token from localStorage
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Save JWT token into localStorage
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Register a new user
 * @param {object} userData - { name, email, password }
 */
export async function register({ name, email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.errors ? data.errors.join(' ') : (data.message || 'Registration failed');
    throw new Error(errorMsg);
  }

  if (data.data?.token) {
    setToken(data.data.token);
  }

  return data.data;
}

/**
 * Log in an existing user
 * @param {object} credentials - { email, password }
 */
export async function login({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.errors ? data.errors.join(' ') : (data.message || 'Login failed');
    throw new Error(errorMsg);
  }

  if (data.data?.token) {
    setToken(data.data.token);
  }

  return data.data;
}

/**
 * Fetch profile of currently authenticated user
 */
export async function getMe() {
  const token = getToken();
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    removeToken();
    throw new Error(data.message || 'Session expired. Please log in again.');
  }

  return data.data.user;
}

/**
 * Update authenticated user's profile information (name, avatar URL, email)
 * PUT /api/auth/profile
 * @param {object} profileData - { name, email, avatar }
 */
export async function updateProfile(profileData) {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.errors ? data.errors.join(' ') : (data.message || 'Failed to update profile');
    throw new Error(errorMsg);
  }

  if (data.data?.token) {
    setToken(data.data.token);
  }

  return data.data.user;
}

/**
 * Change authenticated user's password securely
 * PUT /api/auth/password
 * @param {object} passwordData - { currentPassword, newPassword, confirmPassword }
 */
export async function changePassword(passwordData) {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(passwordData)
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.errors ? data.errors.join(' ') : (data.message || 'Failed to change password');
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Log out user by removing stored token
 */
export function logout() {
  removeToken();
}

/**
 * Permanently delete authenticated user account and all personal data
 * DELETE /api/auth/me
 */
export async function deleteAccount() {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete account');
  }

  removeToken();
  return data;
}

/**
 * Handle 401 unauthorized response by clearing token and notifying context
 * @param {Response} response
 */
export function handleUnauthorizedResponse(response) {
  if (response && response.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }
}

export default {
  getToken,
  setToken,
  removeToken,
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
  logout,
  handleUnauthorizedResponse
};
