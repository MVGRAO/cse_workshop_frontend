'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { getCourseDetails, getUsers, updateCourse } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/courseverifiers.module.scss';

interface Verifier {
  _id: string;
  name: string;
  email: string;
}

interface CourseVerifiersProps {
  courseId: string;
}

export default function CourseVerifiers({ courseId }: CourseVerifiersProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [selectedVerifiers, setSelectedVerifiers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseResponse, usersResponse] = await Promise.all([
        getCourseDetails(courseId),
        getUsers(),
      ]);

      if (usersResponse.success) {
        const verifiersList = usersResponse.users.filter((user: any) => user.role === 'verifier');
        setVerifiers(verifiersList);
      }

      if (courseResponse.success) {
        const assignedVerifierIds = courseResponse.data.verifiers?.map((v: any) => v._id) || [];
        setSelectedVerifiers(assignedVerifierIds);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load verifiers',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerifier = (verifierId: string) => {
    setSelectedVerifiers((prev) =>
      prev.includes(verifierId)
        ? prev.filter((id) => id !== verifierId)
        : [...prev, verifierId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await updateCourse(courseId, { verifiers: selectedVerifiers });
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Verifiers updated successfully',
          variant: 'success',
        });
        router.back();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update verifiers',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PrivateRoute allowedRoles={['admin']}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading verifiers...</p>
          </div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute allowedRoles={['admin']}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Manage Verifiers</h1>
              <p className={styles.subtitle}>Assign verifiers to review this course</p>
            </div>
            <button
              onClick={() => router.back()}
              className={styles.backButton}
            >
              ← Back
            </button>
          </div>

          <div className={styles.card}>
            {verifiers.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No verifiers available. Please create verifier accounts first.</p>
              </div>
            ) : (
              <>
                <div className={styles.verifiersList}>
                  {verifiers.map((verifier) => (
                    <label key={verifier._id} className={styles.verifierItem}>
                      <div className={styles.checkboxWrapper}>
                        <input
                          type="checkbox"
                          checked={selectedVerifiers.includes(verifier._id)}
                          onChange={() => toggleVerifier(verifier._id)}
                          className={styles.checkbox}
                        />
                        <div className={styles.checkmark}></div>
                      </div>
                      <div className={styles.verifierInfo}>
                        <span className={styles.verifierName}>{verifier.name}</span>
                        <span className={styles.verifierEmail}>{verifier.email}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className={styles.footer}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={styles.saveButton}
                  >
                    {saving ? 'Saving...' : 'Save Verifiers'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}
