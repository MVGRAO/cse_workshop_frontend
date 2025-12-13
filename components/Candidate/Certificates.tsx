'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { getAuthToken } from '@/lib/api';
import Link from 'next/link';
import styles from '@/styles/certificates.module.scss';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

interface Certificate {
  _id: string;
  course: {
    _id: string;
    title: string;
    code: string;
  };
  certificateNumber: string;
  theoryScore: number;
  practicalScore?: number;
  totalScore: number;
  grade: string;
  issueDate: string;
}

export default function Certificates() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = getAuthToken('student');
      if (!token) {
        router.replace('/candidate');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/student/certificates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCertificates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PrivateRoute allowedRoles={['student']}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading certificates...</p>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute allowedRoles={['student']}>
      <div className={styles.certificatesContainer}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>Certificates</h1>
          <p className={styles.subtitle}>
            {certificates.length === 0 
              ? 'No certificates yet' 
              : `You have ${certificates.length} certificate${certificates.length > 1 ? 's' : ''}`}
          </p>

          {certificates.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>No Certificates</h2>
              <p className={styles.emptyText}>You haven't earned any certificates yet. Complete courses to earn certificates!</p>
              <Link href="/candidate/courses" className={styles.browseLink}>
                Browse Courses →
              </Link>
            </div>
          ) : (
            <div className={styles.certificatesGrid}>
              {certificates.map((certificate) => (
                <div key={certificate._id} className={styles.certificateCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.courseTitle}>
                        {certificate.course.title}
                      </h3>
                      <p className={styles.courseCode}>{certificate.course.code}</p>
                    </div>
                    <span className={`${styles.gradeBadge} ${styles['grade' + certificate.grade]}`}>
                      {certificate.grade}
                    </span>
                  </div>

                  <div className={styles.scoresSection}>
                    <div className={styles.scoreRow}>
                      <span className={styles.scoreLabel}>Theory Score:</span>
                      <span className={styles.scoreValue}>{certificate.theoryScore.toFixed(2)}</span>
                    </div>
                    {certificate.practicalScore !== undefined && (
                      <div className={styles.scoreRow}>
                        <span className={styles.scoreLabel}>Practical Score:</span>
                        <span className={styles.scoreValue}>{certificate.practicalScore.toFixed(2)}</span>
                      </div>
                    )}
                    <div className={`${styles.scoreRow} ${styles.totalRow}`}>
                      <span className={styles.totalLabel}>Total Score:</span>
                      <span className={styles.totalValue}>{certificate.totalScore.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className={styles.certificateInfo}>
                    <p className={styles.infoText}>
                      Certificate #: {certificate.certificateNumber}
                    </p>
                    <p className={styles.infoText}>
                      Issued: {new Date(certificate.issueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <Link
                    href={`/candidate/certificates/${certificate._id}`}
                    className={styles.viewButton}
                  >
                    View Certificate
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}
