'use client';

import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/api';
import styles from '@/styles/candidatedashboard.module.scss';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function Dashboard() {
  const [stats, setStats] = useState({
    enrollments: 0,
    completed: 0,
    certificates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = getAuthToken('student');
        if (!token) return;

        const [dashboardResponse, certificatesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/student/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/student/certificates`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
        ]);

        let certificatesCount = 0;
        let enrollmentsCount = 0;
        let completedCount = 0;

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          if (dashboardData.success) {
            enrollmentsCount = (dashboardData.data?.ongoingCourses?.length || 0) + (dashboardData.data?.retakeCourses?.length || 0);
            completedCount = dashboardData.data?.completedCourses?.length || 0;
          }
        }

        if (certificatesResponse.ok) {
          const certData = await certificatesResponse.json();
          if (certData.success) {
            certificatesCount = certData.data?.length || 0;
          }
        }

        setStats({
          enrollments: enrollmentsCount,
          completed: completedCount,
          certificates: certificatesCount,
        });

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <PrivateRoute>
      <div className={styles.dashboardContainer}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>
            Welcome to CSE Workshop
          </h1>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3 className={styles.statLabel}>
                Enrolled Courses
              </h3>
              <p className={styles.statValue + ' ' + styles.blue}>
                {loading ? '...' : stats.enrollments}
              </p>
            </div>

            <div className={styles.statCard}>
              <h3 className={styles.statLabel}>
                Completed Courses
              </h3>
              <p className={styles.statValue + ' ' + styles.green}>
                {loading ? '...' : stats.completed}
              </p>
            </div>

            <div className={styles.statCard}>
              <h3 className={styles.statLabel}>
                Certificates Earned
              </h3>
              <p className={styles.statValue + ' ' + styles.purple}>
                {loading ? '...' : stats.certificates}
              </p>
            </div>
          </div>

          <div className={styles.activitySection}>
            <h2 className={styles.activityTitle}>
              Leader Board
            </h2>
            <p className={styles.emptyText}>In Development</p>
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}
