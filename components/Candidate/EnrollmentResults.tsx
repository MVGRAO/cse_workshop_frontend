'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentEnrollments } from '@/lib/api';
import styles from '@/styles/enrollmentresults.module.scss';

interface EnrollmentResultsProps {
  enrollmentId: string;
}

export default function EnrollmentResults({ enrollmentId }: EnrollmentResultsProps) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollment();
  }, []);

  const fetchEnrollment = async () => {
    try {
      setLoading(true);
      const response = await getStudentEnrollments();
      if (response.success && response.data) {
        const found = response.data.find((e: any) => e._id === enrollmentId);
        if (found) {
          setEnrollment(found);
        }
      }
    } catch (error) {
      console.error('Failed to fetch enrollment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading results...</p>
      </div>
    );
  }

  if (!enrollment || !enrollment.certificate) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.noResults}>Results not available yet.</p>
          <button
            onClick={() => router.push('/candidate/my-courses')}
            className={styles.backButton}
          >
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  const { certificate, course } = enrollment;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={() => router.push('/candidate/my-courses')}
          className={styles.backLink}
        >
          ← Back to My Courses
        </button>
        <h1 className={styles.title}>Course Results</h1>
        <p className={styles.courseTitle}>{course.title}</p>
      </div>

      <div className={styles.resultsCard}>
        <div className={styles.scoresGrid}>
          <div className={styles.scoreCard}>
            <h3 className={styles.scoreLabel}>Theory Score</h3>
            <p className={styles.scoreValue}>{certificate.theoryScore.toFixed(2)}</p>
          </div>
          {certificate.practicalScore !== undefined && (
            <div className={styles.scoreCard}>
              <h3 className={styles.scoreLabel}>Practical Score</h3>
              <p className={styles.scoreValue}>{certificate.practicalScore.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className={styles.totalSection}>
          <div className={styles.totalRow}>
            <h3 className={styles.totalLabel}>Total Score</h3>
            <p className={styles.totalValue}>{certificate.totalScore.toFixed(2)}</p>
          </div>
          <div className={styles.gradeRow}>
            <h3 className={styles.totalLabel}>Grade</h3>
            <span className={`${styles.gradeBadge} ${styles[`grade${certificate.grade}`]}`}>
              {certificate.grade}
            </span>
          </div>
          <div className={styles.certificateInfo}>
            <p>
              <strong>Certificate Number:</strong> {certificate.certificateNumber}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
