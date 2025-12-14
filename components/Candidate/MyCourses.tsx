'use client';

import PrivateRoute from '@/components/PrivateRoute';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStudentEnrollments } from '@/lib/api';
import styles from '@/styles/mycourses.module.scss';

interface Enrollment {
  _id: string;
  course?: {
    _id: string;
    title: string;
    description: string;
    status: string;
    resultsGenerated?: boolean;
  } | null;
  status: string;
  progress: number;
  certificate?: {
    theoryScore: number;
    practicalScore?: number;
    totalScore: number;
    grade: string;
    certificateNumber: string;
  } | null;
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTab, setSelectedTab] = useState<'ongoing' | 'completed'>('ongoing');

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await getStudentEnrollments();
        if (response.success) {
          setEnrollments(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
    const interval = setInterval(fetchEnrollments, 5000);
    return () => clearInterval(interval);
  }, []);

  const ongoingCourses = enrollments.filter(e => e.status !== 'completed');
  const completedCourses = enrollments.filter(e => e.status === 'completed');

  return (
    <PrivateRoute allowedRoles={['student']}>
      <div className={styles.myCoursesContainer}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>
            My Enrolled Courses
          </h1>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setSelectedTab('ongoing')}
              style={{
                padding: '0.75rem 1.5rem',
                borderBottom: selectedTab === 'ongoing' ? '3px solid #2563eb' : '3px solid transparent',
                color: selectedTab === 'ongoing' ? '#2563eb' : '#6b7280',
                fontWeight: 600,
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Ongoing ({ongoingCourses.length})
            </button>
            <button
              onClick={() => setSelectedTab('completed')}
              style={{
                padding: '0.75rem 1.5rem',
                borderBottom: selectedTab === 'completed' ? '3px solid #2563eb' : '3px solid transparent',
                color: selectedTab === 'completed' ? '#2563eb' : '#6b7280',
                fontWeight: 600,
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Completed ({completedCourses.length})
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading enrollments...</p>
            </div>
          ) : (selectedTab === 'ongoing' ? ongoingCourses : completedCourses).length === 0 ? (
            <div className={styles.emptyState}>
              <p>No {selectedTab} courses found.</p>
              {selectedTab === 'ongoing' && (
                <Link href="/candidate/courses" className={styles.browseLink}>
                  Browse available courses →
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {(selectedTab === 'ongoing' ? ongoingCourses : completedCourses).map((enrollment) => (
                <div key={enrollment._id} className={styles.courseCard}>
                  <h3 className={styles.courseTitle}>
                    {enrollment.course?.title ?? 'Removed course'}
                  </h3>
                  <p className={styles.courseDescription}>
                    {enrollment.course?.description ?? 'Course content no longer available.'}
                  </p>
                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span>Progress</span>
                      <span>{enrollment.progress || 0}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${enrollment.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <div className={styles.badges}>
                      <span className={`${styles.badge} ${enrollment.status === 'completed' ? styles.badgeGreen : styles.badgeBlue}`}>
                        {enrollment.status}
                      </span>
                      <span className={`${styles.badge} ${enrollment.course?.status === 'published' ? styles.badgeEmerald : styles.badgeGray}`}>
                        {enrollment.course?.status || 'draft'}
                      </span>
                    </div>
                    {enrollment.status === 'completed' ? (
                      enrollment.course?.resultsGenerated ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link
                            href={`/candidate/my-courses/results/${enrollment._id}`}
                            className={styles.resultsButton}
                          >
                            Review Results
                          </Link>
                          {enrollment.course?._id ? (
                            <Link
                              href={`/candidate/courses/${enrollment.course._id}`}
                              className={styles.startButton}
                              style={{ backgroundColor: '#4b5563' }}
                            >
                              View Course
                            </Link>
                          ) : (
                            <button disabled className={styles.disabledButton}>
                              Course removed
                            </button>
                          )}
                        </div>
                      ) : (
                        <button disabled className={styles.completedButton}>
                          Results Pending
                        </button>
                      )
                    ) : enrollment.course?.status === 'published' ? (
                      enrollment.course?._id ? (
                        <Link
                          href={`/candidate/courses/${enrollment.course._id}`}
                          className={styles.startButton}
                        >
                          Start Course →
                        </Link>
                      ) : (
                        <button disabled className={styles.disabledButton}>
                          Course removed
                        </button>
                      )
                    ) : (
                      <button disabled className={styles.disabledButton}>
                        Start Course (waiting for publish)
                      </button>
                    )}
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
