'use client';

import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api';
import styles from '@/styles/candidateprofile.module.scss';

export default function CandidateProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getCurrentUser();
        if (response.success) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <PrivateRoute>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <div className={styles.profileContainer}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>
            My Profile
          </h1>

          <div className={styles.profileCard}>
            {user && (
              <div className={styles.profileInfo}>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>
                    Name
                  </label>
                  <p className={styles.infoValue}>{user.name || 'N/A'}</p>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>
                    Email
                  </label>
                  <p className={styles.infoValue}>{user.email || 'N/A'}</p>
                </div>

                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>
                    Role
                  </label>
                  <p className={styles.infoValue + ' ' + styles.capitalize}>{user.role || 'N/A'}</p>
                </div>

                {user.avatarUrl && (
                  <div className={styles.infoItem}>
                    <label className={styles.infoLabel}>
                      Profile Picture
                    </label>
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className={styles.avatar}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}
