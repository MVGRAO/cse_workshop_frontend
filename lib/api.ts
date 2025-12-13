/**
 * API utility functions for backend communication
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user?: {
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
    admin?: {
      id: string;
      name: string;
      email: string;
      role: string;
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
 * Store authentication token in localStorage with role-specific key
 */
export function storeAuthToken(token: string, role?: string): void {
  if (typeof window !== 'undefined') {
    if (role) {
      // Store with role-specific key to allow separate tabs
      localStorage.setItem(`${role}_token`, token);
      localStorage.setItem(`${role}_role`, role);
      // Also keep auth_token for backward compatibility
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_role', role);
    } else {
      localStorage.setItem('auth_token', token);
    }
  }
}

/**
 * Get authentication token from localStorage
 * @param role - Optional role to get role-specific token
 */
export function getAuthToken(role?: string): string | null {
  if (typeof window !== 'undefined') {
    if (role) {
      // Get role-specific token and verify it matches the role
      const token = localStorage.getItem(`${role}_token`);
      const storedRole = localStorage.getItem(`${role}_role`);
      if (token && storedRole === role) {
        return token;
      }
      return null;
    }
    // Try to get from current role first
    const currentRole = getUserRole();
    if (currentRole) {
      const roleToken = localStorage.getItem(`${currentRole}_token`);
      const storedRole = localStorage.getItem(`${currentRole}_role`);
      if (roleToken && storedRole === currentRole) {
        return roleToken;
      }
    }
    // Fallback to generic auth_token
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Remove authentication token from localStorage
 * @param role - Optional role to remove role-specific token
 */
export function removeAuthToken(role?: string): void {
  if (typeof window !== 'undefined') {
    if (role) {
      localStorage.removeItem(`${role}_token`);
      localStorage.removeItem(`${role}_role`);
    }
    // Also clear generic ones
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_role');
    // Clear all role tokens if no role specified
    if (!role) {
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_role');
      localStorage.removeItem('verifier_token');
      localStorage.removeItem('verifier_role');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_role');
    }
  }
}

/**
 * Get user role from localStorage
 * @param role - Optional role to check if that role is active
 */
export function getUserRole(role?: string): string | null {
  if (typeof window !== 'undefined') {
    if (role) {
      // Check role-specific token and role
      const token = localStorage.getItem(`${role}_token`);
      const storedRole = localStorage.getItem(`${role}_role`);
      if (token && storedRole === role) {
        return role;
      }
      return null;
    }
    // Check all roles in priority order (admin, verifier, student)
    const roles = ['admin', 'verifier', 'student'];
    for (const r of roles) {
      const token = localStorage.getItem(`${r}_token`);
      const storedRole = localStorage.getItem(`${r}_role`);
      if (token && storedRole === r) {
        return r;
      }
    }
    // Fallback to generic auth_role
    return localStorage.getItem('auth_role');
  }
  return null;
}

/**
 * Check if a specific role has a token (for multi-tab support)
 */
export function hasRoleToken(role: string): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem(`${role}_token`);
  }
  return false;
}

/**
 * Get current user profile
 * @param role - Optional role to get role-specific token (defaults to checking all roles)
 */
export async function getCurrentUser(role?: string): Promise<any> {
  // Try role-specific token first if provided
  let token = role ? getAuthToken(role) : getAuthToken();
  
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
  options: RequestInit = {},
  role?: string
): Promise<Response> {
  // Try to determine role from URL if not provided
  let targetRole = role;
  if (!targetRole) {
    if (url.includes('/admin/')) {
      targetRole = 'admin';
    } else if (url.includes('/verifier/')) {
      targetRole = 'verifier';
    } else if (url.includes('/student/')) {
      targetRole = 'student';
    } else {
      // Get current role from storage
      targetRole = getUserRole() || undefined;
    }
  }

  // Try role-specific token first, then fallback to generic
  let token = targetRole ? getAuthToken(targetRole) : null;
  if (!token) {
    token = getAuthToken();
  }

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
  verifiers?: string[];
  hasPracticalSession?: boolean;
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
 * Get course results (admin only)
 */
export async function getCourseResults(courseId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/courses/${courseId}/results`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch course results');
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
    answerExplanation?: string;
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
  const response = await authenticatedFetch(`${API_BASE_URL}/student/courses/${courseId}/modules`, {
    method: 'GET',
  }, 'student');

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
 * Complete enrollment (mark as completed when student finishes all modules)
 */
export async function completeEnrollment(enrollmentId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/student/enrollments/${enrollmentId}/complete`, {
    method: 'POST',
  }, 'student');

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to complete enrollment');
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
 * Start assignment submission
 */
export async function startSubmission(assignmentId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/student/assignments/${assignmentId}/start`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to start submission');
  }

  return data;
}

/**
 * Submit assignment
 */
export async function submitAssignment(assignmentId: string, submissionData: {
  submissionId: string;
    answers: Array<{
      questionId: string;
      selectedOptionIndex?: number;
      answerText?: string;
    }>;
  tabSwitchCount?: number;
}): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/student/assignments/${assignmentId}/submit`, {
    method: 'POST',
    body: JSON.stringify(submissionData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to submit assignment');
  }

  return data;
}

/**
 * Verifier API functions
 */

/**
 * Get verifier overview (stats)
 */
export async function getVerifierOverview(): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/verifier/overview`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch verifier overview');
  }

  return data;
}

/**
 * Get verifier's students
 */
export async function getVerifierStudents(): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/verifier/students`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch verifier students');
  }

  return data;
}

/**
 * Get completed students for verification
 */
export async function getCompletedStudentsForVerification(): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/verifier/completed-students`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch completed students');
  }

  return data;
}

/**
 * Get verified students (with certificates)
 */
export async function getVerifiedStudents(): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/verifier/verified-students`, {
    method: 'GET',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch verified students');
  }

  return data;
}

/**
 * Get student certificates
 */
export async function getStudentCertificates(): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/student/certificates`, {
    method: 'GET',
  }, 'student');

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch certificates');
  }

  return data;
}

/**
 * Get certificate by ID
 */
export async function getCertificate(certificateId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/student/certificates/${certificateId}`, {
    method: 'GET',
  }, 'student');

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch certificate');
  }

  return data;
}

/**
 * Generate course results (admin only)
 */
export async function generateCourseResults(courseId: string): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin/courses/${courseId}/generate-results`, {
    method: 'POST',
  }, 'admin');

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to generate results');
  }

  return data;
}

/**
 * Verify enrollment and generate certificate
 */
export async function verifyAndGenerateCertificate(enrollmentId: string, practicalScore?: number): Promise<any> {
  const response = await authenticatedFetch(`${API_BASE_URL}/verifier/enrollments/${enrollmentId}/verify`, {
    method: 'POST',
    body: JSON.stringify({ practicalScore }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify and generate certificate');
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


