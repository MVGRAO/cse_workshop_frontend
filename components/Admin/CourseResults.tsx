'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { getCourseResults } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/courseresults.module.scss';

interface CourseResult {
  enrollment: {
    _id: string;
    student: {
      _id: string;
      name: string;
      email: string;
      college?: string;
      classYear?: string;
    };
    verifier?: {
      _id: string;
      name: string;
      email: string;
    };
    status: string;
    completedAt?: string;
  };
  certificate: {
    _id: string;
    theoryScore: number;
    practicalScore?: number;
    totalScore: number;
    grade: string;
    certificateNumber: string;
    issueDate: string;
  } | null;
}

interface CourseResultsProps {
  courseId: string;
}

export default function CourseResults({ courseId }: CourseResultsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [results, setResults] = useState<CourseResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await getCourseResults(courseId);
      if (response.success) {
        setResults(response.data || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load course results',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result =>
    result.enrollment.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.enrollment.student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <PrivateRoute allowedRoles={['admin']}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading results...</p>
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
              <h1 className={styles.title}>Course Results</h1>
              <p className={styles.subtitle}>View all completed enrollments and their results</p>
            </div>
            <button
              onClick={() => router.back()}
              className={styles.backButton}
            >
              ← Back
            </button>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Filter by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              style={{
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                width: '100%',
                maxWidth: '400px'
              }}
            />
          </div>

          {filteredResults.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No completed enrollments found matching your search.</p>
            </div>
          ) : (
            <div className={styles.section}>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>College</th>
                      <th>Theory Score</th>
                      <th>Practical Score</th>
                      <th>Total Score</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((result) => (
                      <tr key={result.enrollment._id}>
                        <td>{result.enrollment.student.name}</td>
                        <td>{result.enrollment.student.email}</td>
                        <td>{result.enrollment.student.college || 'N/A'}</td>
                        <td>{result.certificate ? result.certificate.theoryScore.toFixed(2) : 'N/A'}</td>
                        <td>
                          {result.certificate && result.certificate.practicalScore !== undefined
                            ? result.certificate.practicalScore.toFixed(2)
                            : 'N/A'}
                        </td>
                        <td className={styles.totalScore}>
                          {result.certificate ? result.certificate.totalScore.toFixed(2) : 'N/A'}
                        </td>
                        <td>
                          {result.certificate ? (
                            <span className={`${styles.gradeBadge} ${styles[`grade${result.certificate.grade}`]}`}>
                              {result.certificate.grade}
                            </span>
                          ) : (
                            <span className={styles.pending}>Pending</span>
                          )}
                        </td>
                        <td>
                          {result.certificate ? (
                            <span className={styles.verified}>✓ Verified</span>
                          ) : (
                            <span className={styles.awaiting}>Awaiting Verification</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}
