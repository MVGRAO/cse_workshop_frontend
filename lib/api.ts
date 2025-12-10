/**
 * API utility functions for backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      avatarUrl?: string;
      givenName?: string;
      familyName?: string;
      locale?: string;
      phoneNumber?: string;
      location?: string;
      mobile?: string;
    };
  };
}

export interface ApiError {
  success: boolean;
  message: string;
  error?: any;
}

/**
 * Authenticate with Google ID token
 * @param idToken - Google ID token from Google Sign-In
 * @param accessToken - Optional Google OAuth access token for fetching additional profile info (phone, location)
 */
export async function authenticateWithGoogle(idToken: string, accessToken?: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      idToken,
      ...(accessToken && { accessToken })
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Authentication failed');
  }

  return data;
}

/**
 * Register a new user with email and password
 */
export async function register(email: string, password: string, name: string, college?: string, classYear?: string, mobile?: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      name,
      college,
      classYear,
      mobile,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
}

/**
 * Request password reset
 */
export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to send reset email');
  }

  return data;
}

/**
 * Store authentication token in localStorage
 */
export function storeAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<any> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user profile');
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateProfile(profileData: {
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  college?: string;
  classYear?: string;
}): Promise<any> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile');
  }

  return data;
}

/**
 * Delete user account
 */
export async function deleteAccount(): Promise<any> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}/auth/account`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete account');
  }

  return data;
}

