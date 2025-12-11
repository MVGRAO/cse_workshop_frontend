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
 * Verifier login with email/password (role restricted)
 */
export async function verifierLogin(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verifier/login`, {
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
export function storeAuthToken(token: string, role?: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    if (role) {
      localStorage.setItem('auth_role', role);
    }
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
    localStorage.removeItem('auth_role');
  }
}

/**
 * Get user role from localStorage
 */
export function getUserRole(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_role');
  }
  return null;
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

/**
 * Admin Authentication and Management APIs
 */

/**
 * Admin login with email and password
 */
export async function adminLogin(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
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
    throw new Error(data.message || 'Admin login failed');
  }

  return data;
}

/**
 * Helper function to make authenticated API requests
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Get all courses (admin only)
 */
export async function getAllCourses(): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/courses`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch courses');
  }

  return data;
}

/**
 * Create a new course
 */
export async function createCourse(courseData: {
  title: string;
  code: string;
  description?: string;
  category?: string;
  level?: string;
}): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/courses`, {
    method: 'POST',
    body: JSON.stringify(courseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create course');
  }

  return data;
}

/**
 * Get lessons for a course (admin only)
 */
export async function getLessonsByCourse(courseId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/courses/${courseId}/lessons`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch lessons');
  }

  return data;
}

/**
 * Create a lesson
 */
export async function createLesson(courseId: string, lessonData: {
  index: number;
  title: string;
  description?: string;
}): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(lessonData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create lesson');
  }

  return data;
}

/**
 * Create a module
 */
export async function createModule(lessonId: string, moduleData: {
  index: number;
  title: string;
  description?: string;
  videoUrl?: string;
  textContent?: string;
  assignmentId?: string;
}): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/lessons/${lessonId}/modules`, {
    method: 'POST',
    body: JSON.stringify(moduleData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create module');
  }

  return data;
}

/**
 * Get course details with lessons, modules, and assignments (admin only)
 */
export async function getCourseDetails(courseId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch course details');
  }

  return data;
}

/**
 * Delete a course (admin only)
 */
export async function deleteCourse(courseId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete course');
  }

  return data;
}

/**
 * Create an assignment
 */
export async function createAssignment(assignmentData: {
  course: string;
  module: string;
  type: 'theory' | 'practical';
  questions?: Array<{
    qType: 'mcq' | 'short' | 'code';
    questionText: string;
    options?: string[];
    correctOptionIndex?: number;
    answerText?: string;
    maxMarks: number;
  }>;
  description?: string;
  maxScore?: number;
  timeLimitMinutes?: number;
}): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/assignments`, {
    method: 'POST',
    body: JSON.stringify(assignmentData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create assignment');
  }

  return data;
}

/**
 * Get student course details (modules/lessons)
 */
export async function getStudentCourseDetails(courseId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/courses/${courseId}/modules`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch course details');
  }

  return data;
}

/**
 * Enroll in a course
 */
export async function enrollInCourse(courseId: string, courseData?: any): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/student/courses/${courseId}/enroll`, {
    method: 'POST',
    body: JSON.stringify(courseData || {}),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to enroll in course');
  }

  return data;
}

/**
 * Get student enrollments
 */
export async function getStudentEnrollments(): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/student/enrollments`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch enrollments');
  }

  return data;
}

/**
 * Update a course
 */
export async function updateCourse(courseId: string, courseData: any): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify(courseData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update course');
  }

  return data;
}

/**
 * Update a lesson
 */
export async function updateLesson(lessonId: string, lessonData: any): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/lessons/${lessonId}`, {
    method: 'PATCH',
    body: JSON.stringify(lessonData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update lesson');
  }

  return data;
}

/**
 * Update a module
 */
export async function updateModule(moduleId: string, moduleData: any): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/modules/${moduleId}`, {
    method: 'PATCH',
    body: JSON.stringify(moduleData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update module');
  }

  return data;
}

/**
 * Update an assignment
 */
export async function updateAssignment(assignmentId: string, assignmentData: any): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/assignments/${assignmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(assignmentData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to update assignment');
  }

  return data;
}

/**
 * Get users (admin only)
 */
export async function getUsers(role?: string): Promise<any> {
  const queryParams = role ? `?role=${role}` : '';
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/users${queryParams}`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users');
  }

  return data;
}

/**
 * Publish a course
 */
export async function publishCourse(courseId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/courses/${courseId}/publish`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to publish course');
  }

  return data;
}

/**
 * Submit verifier access request (public)
 */
export async function submitVerifierRequest(payload: {
  name: string;
  email: string;
  phone?: string;
  college: string;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/verifier-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit request');
  }

  return data;
}

/**
 * Get verifier requests (admin)
 */
export async function getVerifierRequests(status?: string): Promise<any> {
  const query = status ? `?status=${status}` : '';
  const response = await authenticatedFetch(`${API_BASE_URL}/verifier-requests${query}`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch requests');
  }

  return data;
}

/**
 * Accept verifier request (admin)
 */
export async function acceptVerifierRequest(id: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/verifier-requests/${id}/accept`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to accept request');
  }

  return data;
}

/**
 * Reject verifier request (admin)
 */
export async function rejectVerifierRequest(id: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/verifier-requests/${id}/reject`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to reject request');
  }

  return data;
}

/**
 * Verifier overview stats
 */
export async function getVerifierOverview(): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/verifier/overview`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch overview');
  }

  return data;
}

