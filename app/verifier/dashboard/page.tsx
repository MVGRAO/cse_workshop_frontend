'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/ToastProvider';
import styles from '../verifier.module.scss';

/**
 * Verifier Dashboard
 * Shows verifier assignments and verification tasks
 */
export default function VerifierDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    if (!token || role !== 'verifier') {
      router.push('/verifier');
      return;
    }

    setIsAuthenticated(true);
    fetchDashboardData();
  }, []);

  /**
   * Fetch verifier dashboard data
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');

      // Fetch enrolled students
      const studentsResponse = await fetch(`${API_BASE_URL}/verifier/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        if (studentsData.success) {
          setEnrolledStudents(studentsData.data || []);
        }
      }

      // Fetch assignments to verify
      const assignmentsResponse = await fetch(`${API_BASE_URL}/verifier/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        if (assignmentsData.success) {
          setAssignments(assignmentsData.data || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully',
      variant: 'info',
    });
    router.push('/verifier');
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1 className={styles.dashboardTitle}>Verifier Dashboard</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </header>

      <div className={styles.content}>
        {/* Enrolled Students Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Enrolled Students ({enrolledStudents.length})</h2>
          {enrolledStudents.length === 0 ? (
            <p className={styles.emptyText}>No enrolled students yet</p>
          ) : (
            <div className={styles.studentsGrid}>
              {enrolledStudents.map((student: any) => (
                <div key={student._id} className={styles.studentCard}>
                  <h3>{student.name}</h3>
                  <p><strong>Email:</strong> {student.email}</p>
                  <p><strong>ID:</strong> {student.studentId}</p>
                  <p><strong>Course:</strong> {student.courseName}</p>
                  <p><strong>Status:</strong> {student.status}</p>
                  <button
                    onClick={() => router.push(`/verifier/students/${student._id}`)}
                    className={styles.viewButton}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignments Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pending Assignments ({assignments.length})</h2>
          {assignments.length === 0 ? (
            <p className={styles.emptyText}>No pending assignments</p>
          ) : (
            <div className={styles.assignmentsTable}>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Assignment</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment: any) => (
                    <tr key={assignment._id}>
                      <td>{assignment.studentName}</td>
                      <td>{assignment.courseName}</td>
                      <td>{assignment.assignmentTitle}</td>
                      <td>{new Date(assignment.submissionDate).toLocaleDateString()}</td>
                      <td><span className={styles.badge}>{assignment.status}</span></td>
                      <td>
                        <button
                          onClick={() => router.push(`/verifier/assignments/${assignment._id}`)}
                          className={styles.reviewButton}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
