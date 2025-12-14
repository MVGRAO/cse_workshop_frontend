'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  adminLogin,
  storeAuthToken,
  getAuthToken,
  getUserRole,
  getAllCourses,
  getCourseDetails,
  deleteCourse,
  createCourse,
  createLesson,
  createModule,
  createAssignment,
  publishCourse,
  authenticatedFetch,
  removeAuthToken,
  generateCourseResults,
  getUsers
} from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import PrivateRoute from '@/components/PrivateRoute';
import styles from '@/styles/admindashboard.module.scss';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const token = getAuthToken('admin');
    const role = getUserRole('admin');
    if (token && role === 'admin') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "error",
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await adminLogin(email, password);

      if (response.success && response.data?.token) {
        const adminData = response.data.admin || response.data.user;
        const role = adminData?.role || 'admin';
        if (role !== 'admin') {
          throw new Error('This account is not an admin account.');
        }

        storeAuthToken(response.data.token, 'admin');
        setIsAuthenticated(true);
        toast({
          title: "Success",
          description: "Admin login successful",
          variant: "success",
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to login. Please check your credentials.",
        variant: "error",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken('admin');
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
      variant: "info",
    });
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>Admin Login</h1>
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
                disabled={isLoggingIn}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={isLoggingIn}
              />
            </div>
            <button type="submit" className={styles.submitButton} disabled={isLoggingIn}>
              {isLoggingIn ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <PrivateRoute allowedRoles={['admin']}>
      <AdminDashboardContent onLogout={handleLogout} />
    </PrivateRoute>
  );
}

// Main dashboard content (to keep the component manageable)
function AdminDashboardContent({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState<string | null>(null);
  const [creatingCourse, setCreatingCourse] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const response = await getAllCourses();
      if (response.success && response.data) {
        setCourses(response.data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load courses",
        variant: "error",
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const handlePublishCourse = async (courseId: string) => {
    try {
      await publishCourse(courseId);
      toast({
        title: 'Success',
        description: 'Course published successfully',
        variant: 'success',
      });
      fetchCourses();
      setShowPublishConfirm(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish course',
        variant: 'error',
      });
    }
  };

  const handleConfirmDelete = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
        variant: 'success',
      });
      fetchCourses();
      setShowDeleteConfirm(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete course',
        variant: 'error',
      });
    }
  };

  const handleGenerateResults = async (courseId: string) => {
    try {
      const response = await generateCourseResults(courseId);
      toast({
        title: 'Success',
        description: `Results generated for the students.`,
        variant: 'success',
      });
      fetchCourses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate results',
        variant: 'error',
      });
    }
  };

  const handleCreateCourse = () => {
    router.push('/admin/courses/new');
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
          <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link href="/admin" style={{ color: '#374151', textDecoration: 'none', fontWeight: 500 }}>
              Courses
            </Link>
            <Link href="/admin/requests" style={{ color: '#374151', textDecoration: 'none', fontWeight: 500 }}>
              View Requests
            </Link>
            <Link href="/admin/students" style={{ color: '#374151', textDecoration: 'none', fontWeight: 500 }}>
              Students
            </Link>
            <button
              onClick={onLogout}
              className={styles.logoutButton}
              style={{ marginLeft: '1rem' }}
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.actions}>
          <button
            onClick={() => router.push('/admin/requests')}
            className={styles.addCourseButton}
            style={{ backgroundColor: '#111827', marginRight: '0.5rem' }}
          >
            View Requests
          </button>
          <button
            onClick={handleCreateCourse}
            className={styles.addCourseButton}
          >
            + Add Course
          </button>
        </div>

        {isLoadingCourses ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No courses found. Create your first course!</p>
          </div>
        ) : (
          <div className={styles.coursesList}>
            {/* Active Courses Section */}
            <div className={styles.activeCoursesSection} style={{ marginBottom: '3rem' }}>
              <h2 className={styles.sectionTitle}>Courses ({courses.filter(c => !c.resultsGenerated).length})</h2>
              <div className={styles.coursesGrid}>
                {courses.filter(c => !c.resultsGenerated).map((course) => (
                  <div key={course._id} className={styles.courseCard}>
                    <div className={styles.courseCardContent}>
                      <h3 className={styles.courseTitle}>{course.title}</h3>
                      <p className={styles.courseCode}>Code: {course.code}</p>
                      <p className={styles.courseStatus}>Status: {course.status}</p>
                      {course.description && (
                        <p className={styles.courseDescription}>{course.description}</p>
                      )}
                    </div>

                    <div className={styles.courseCardActions}>
                      <button
                        onClick={() => router.push(`/admin/courses/${course._id}/edit`)}
                        className={styles.updateButton}
                        disabled={course.status === 'published'}
                        title={course.status === 'published' ? 'Cannot update published course' : ''}
                      >
                        Update
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(course._id)}
                        className={styles.deleteButton}
                        disabled={course.status === 'published'}
                        title={course.status === 'published' ? 'Cannot delete published course' : ''}
                      >
                        Delete
                      </button>
                    </div>

                    {course.status !== 'published' &&
                      (course.lessonCount > 0 || course.moduleCount > 0) && (
                        <button
                          onClick={() => setShowPublishConfirm(course._id)}
                          className={styles.publishButton}
                        >
                          Publish Course
                        </button>
                      )}

                    {course.status === 'published' && (
                      <div style={{ width: '100%', marginTop: '0.5rem' }}>
                        <button
                          onClick={() => handleGenerateResults(course._id)}
                          className={styles.generateButton}
                        >
                          Generate Results
                        </button>
                      </div>
                    )}

                    {showDeleteConfirm === course._id && (
                      <div className={styles.confirmDialog}>
                        <p>Delete this course? This action cannot be undone.</p>
                        <div className={styles.confirmActions}>
                          <button
                            onClick={() => handleConfirmDelete(course._id)}
                            className={styles.confirmButton}
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className={styles.cancelButton}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {showPublishConfirm === course._id && (
                      <div className={styles.confirmDialog}>
                        <p>Publish this course?</p>
                        <div className={styles.confirmActions}>
                          <button
                            onClick={() => handlePublishCourse(course._id)}
                            className={styles.confirmButton}
                            style={{ backgroundColor: '#10b981' }}
                          >
                            Yes, Publish
                          </button>
                          <button
                            onClick={() => setShowPublishConfirm(null)}
                            className={styles.cancelButton}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Courses Section */}
            <div className={styles.completedCoursesSection}>
              <h2 className={styles.sectionTitle}>Completed Courses ({courses.filter(c => c.resultsGenerated).length})</h2>
              <div className={styles.coursesGrid}>
                {courses.filter(c => c.resultsGenerated).map((course) => (
                  <div key={course._id} className={styles.courseCard} style={{ opacity: 0.9, backgroundColor: '#f9fafb' }}>
                    <div className={styles.courseCardContent}>
                      <h3 className={styles.courseTitle}>{course.title}</h3>
                      <p className={styles.courseCode}>Code: {course.code}</p>
                      <p className={styles.courseStatus} style={{ color: '#059669' }}>Status: Completed</p>
                      {course.description && (
                        <p className={styles.courseDescription}>{course.description}</p>
                      )}
                    </div>

                    <div style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        disabled
                        className={styles.generateButton}
                        style={{ backgroundColor: '#10b981', opacity: 0.8, cursor: 'not-allowed' }}
                      >
                        Results Generated
                      </button>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                        <Link
                          href={`/admin/courses/${course._id}/results`}
                          className={styles.linkButton}
                          style={{ textAlign: 'center' }}
                        >
                          Review Results
                        </Link>
                        <button
                          disabled
                          className={styles.deleteButton} // Using existing style for now
                          style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#dc2626' }}
                        >
                          Stop Course
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
