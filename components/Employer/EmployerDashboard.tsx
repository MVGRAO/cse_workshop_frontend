'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PrivateRoute from '@/components/PrivateRoute';
import { getVerifierOverview, removeAuthToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '@/styles/employerdashboard.module.scss';

export default function EmployerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<{ totalCandidates: number; perCourse: Array<{ title: string; code: string; count: number }> }>({
    totalCandidates: 0,
    perCourse: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resp = await getVerifierOverview();
        setOverview({
          totalCandidates: resp.data?.totalCandidates || 0,
          perCourse: resp.data?.perCourse || [],
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    removeAuthToken('verifier');
    router.replace('/employer');
  };

  return (
    <PrivateRoute allowedRoles={['verifier']}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Verifier Dashboard</h1>
            <p className={styles.subtitle}>Overview of candidates assigned to you</p>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingText}>Loading...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p className={styles.errorText}>{error}</p>
            </div>
          ) : (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>Total candidates assigned</p>
                  <p className={styles.statValue}>{overview.totalCandidates}</p>
                </div>
              </div>

              <div className={styles.courseSection}>
                <h2 className={styles.sectionTitle}>By Course</h2>
                {overview.perCourse.length === 0 ? (
                  <p className={styles.emptyText}>No candidates yet.</p>
                ) : (
                  <div className={styles.courseList}>
                    {overview.perCourse.map((c) => (
                      <div key={c.code} className={styles.courseItem}>
                        <div>
                          <p className={styles.courseTitle}>{c.title}</p>
                          <p className={styles.courseCode}>{c.code}</p>
                        </div>
                        <div className={styles.courseCount}>{c.count}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}
