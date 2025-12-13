'use client';

import PrivateRoute from '@/components/PrivateRoute';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStudentEnrollments } from '@/lib/api';
import styles from '@/styles/mycourses.module.scss';

interface Enrollment {
  _id: string;
  course: {
    _id: string;
    title: string;
    description: string;
    status?: string;
  };
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

  return (
    <PrivateRoute allowedRoles={['student']}>
      <div className={styles.myCoursesContainer}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>
            My Enrolled Courses
          </h1>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading enrollments...</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className={styles.emptyState}>
              <p>You haven't enrolled in any courses yet.</p>
              <Link href="/candidate/courses" className={styles.browseLink}>
                Browse available courses →
              </Link>
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {enrollments.map((enrollment) => (
                <div key={enrollment._id} className={styles.courseCard}>
                  <h3 className={styles.courseTitle}>
                    {enrollment.course.title}
                  </h3>
                  <p className={styles.courseDescription}>
                    {enrollment.course.description}
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
                      <span className={`${styles.badge} ${enrollment.course.status === 'published' ? styles.badgeEmerald : styles.badgeGray}`}>
                        {enrollment.course.status || 'draft'}
                      </span>
                    </div>
                    {enrollment.status === 'completed' ? (
                      enrollment.certificate ? (
                        <Link
                          href={`/candidate/my-courses/results/${enrollment._id}`}
                          className={styles.resultsButton}
                        >
                          Review Results
                        </Link>
                      ) : (
                        <button disabled className={styles.completedButton}>
                          Course Completed ✓
                        </button>
                      )
                    ) : enrollment.course.status === 'published' ? (
                      <Link
                        href={`/candidate/courses/${enrollment.course._id}`}
                        className={styles.startButton}
                      >
                        Start Course →
                      </Link>
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
