'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { getAuthToken } from '@/lib/api';
import styles from '@/styles/employercourses.module.scss';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

interface Course {
  _id: string;
  title: string;
  code: string;
  description?: string;
  status: string;
  totalEnrollments: number;
  toBeVerified: number;
  verifiers?: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
}

export default function EmployerCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = getAuthToken('verifier');
      if (!token) {
        router.replace('/employer');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/verifier/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PrivateRoute allowedRoles={['verifier']}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading...</p>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute allowedRoles={['verifier']}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>My Assigned Courses</h1>

          {courses.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>No Courses Assigned</h2>
              <p className={styles.emptySubtitle}>You haven't been assigned to any courses yet.</p>
            </div>
          ) : (
            <div className={styles.courseGrid}>
              {courses.map((course) => (
                <div key={course._id} className={styles.courseCard}>
                  <div className={styles.courseHeader}>
                    <h3 className={styles.courseTitle}>{course.title}</h3>
                    <p className={styles.courseCode}>{course.code}</p>
                    {course.description && (
                      <p className={styles.courseDescription}>{course.description}</p>
                    )}
                  </div>

                  <div className={styles.courseStats}>
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>Status:</span>
                      <span className={`${styles.statusBadge} ${
                        course.status === 'published' 
                          ? styles.statusPublished
                          : styles.statusOther
                      }`}>
                        {course.status}
                      </span>
                    </div>
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>Total Students Enrolled:</span>
                      <span className={styles.statValue}>{course.totalEnrollments}</span>
                    </div>
                    <div className={styles.statRow}>
                      <span className={styles.statLabel}>To Be Verified:</span>
                      <span className={`${styles.statValue} ${
                        course.toBeVerified > 0 ? styles.verifyPending : ''
                      }`}>
                        {course.toBeVerified}
                      </span>
                    </div>
                  </div>

                  <div className={styles.courseActions}>
                    <button
                      onClick={() => router.push(`/employer/verification`)}
                      className={styles.verifyButton}
                    >
                      View Verification
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}
