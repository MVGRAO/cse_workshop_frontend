'use client';

import { useState, useEffect } from 'react';
import PrivateRoute from '@/components/PrivateRoute';
import { getCompletedStudentsForVerification, verifyAndGenerateCertificate, getVerifiedStudents } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/employerverification.module.scss';

interface CompletedStudent {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  course: {
    _id: string;
    title: string;
    code: string;
    hasPracticalSession: boolean;
  };
  status: string;
  completedAt: string;
}

export default function EmployerVerification() {
  const { toast } = useToast();
  const [students, setStudents] = useState<CompletedStudent[]>([]);
  const [verifiedStudents, setVerifiedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [practicalScores, setPracticalScores] = useState<{ [key: string]: string }>({});
  const [practicalMarksAdded, setPracticalMarksAdded] = useState<{ [key: string]: boolean }>({});

  // Filters
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Derived state
  const allStudents = [...students, ...verifiedStudents];
  const uniqueCourses = Array.from(new Set(allStudents.map(s => s.course._id)))
    .map(id => {
      const student = allStudents.find(s => s.course._id === id);
      return { id, title: student?.course.title };
    });

  const filteredStudents = students.filter(student => {
    const matchesCourse = selectedCourse ? student.course._id === selectedCourse : true;
    const matchesSearch = searchQuery
      ? (student.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student.email.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCourse && matchesSearch;
  });

  const filteredVerifiedStudents = verifiedStudents.filter(student => {
    const matchesCourse = selectedCourse ? student.course._id === selectedCourse : true;
    const matchesSearch = searchQuery
      ? (student.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student.email.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    return matchesCourse && matchesSearch;
  });

  useEffect(() => {
    fetchStudents();
    fetchVerifiedStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getCompletedStudentsForVerification();
      if (response.success) {
        setStudents(response.data || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load completed students',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifiedStudents = async () => {
    try {
      const response = await getVerifiedStudents();
      if (response.success) {
        setVerifiedStudents(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to load verified students:', error);
    }
  };

  const handleAddPracticalMarks = (enrollmentId: string) => {
    const score = practicalScores[enrollmentId];
    if (!score || isNaN(parseFloat(score)) || parseFloat(score) < 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid practical score',
        variant: 'error',
      });
      return;
    }

    // Mark practical marks as added
    setPracticalMarksAdded(prev => ({ ...prev, [enrollmentId]: true }));
    toast({
      title: 'Success',
      description: 'Practical marks added. You can now verify the student.',
      variant: 'success',
    });
  };

  const handleVerify = async (enrollmentId: string, hasPractical: boolean) => {
    // If course has practical, require practical marks to be added first
    if (hasPractical && !practicalMarksAdded[enrollmentId]) {
      toast({
        title: 'Error',
        description: 'Please add practical marks before verifying',
        variant: 'error',
      });
      return;
    }

    try {
      setVerifyingId(enrollmentId);
      const practicalScore = hasPractical ? parseFloat(practicalScores[enrollmentId]) : undefined;

      if (hasPractical && (isNaN(practicalScore!) || practicalScore! < 0)) {
        toast({
          title: 'Error',
          description: 'Please enter a valid practical score',
          variant: 'error',
        });
        return;
      }

      const response = await verifyAndGenerateCertificate(enrollmentId, practicalScore);

      if (response.success) {
        toast({
          title: 'Success',
          description: `Certificate generated! Theory: ${response.data.certificate.theoryScore}, Total: ${response.data.certificate.totalScore}`,
          variant: 'success',
        });

        // Remove from unverified list and add to verified list
        const verifiedStudent = students.find(s => s._id === enrollmentId);
        if (verifiedStudent) {
          setVerifiedStudents(prev => [...prev, { ...verifiedStudent, certificate: response.data.certificate }]);
        }
        setStudents(prev => prev.filter(s => s._id !== enrollmentId));
        setPracticalScores(prev => {
          const newScores = { ...prev };
          delete newScores[enrollmentId];
          return newScores;
        });
        setPracticalMarksAdded(prev => {
          const newMarks = { ...prev };
          delete newMarks[enrollmentId];
          return newMarks;
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify and generate certificate',
        variant: 'error',
      });
    } finally {
      setVerifyingId(null);
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
          <h1 className={styles.title}>Verification</h1>

          <div className={styles.section} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className={styles.input}
                style={{ minWidth: '200px' }}
              >
                <option value="">All Courses</option>
                {uniqueCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              {selectedCourse && (
                <input
                  type="text"
                  placeholder="Filter by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.input}
                  style={{ minWidth: '200px' }}
                />
              )}
            </div>
          </div>

          {/* Unverified Students Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Awaiting Verification</h2>
            {filteredStudents.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>No completed students awaiting verification matching filters.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead className={styles.tableHead}>
                    <tr>
                      <th className={styles.tableHeader}>ID</th>
                      <th className={styles.tableHeader}>Name</th>
                      <th className={styles.tableHeader}>Course Name</th>
                      <th className={styles.tableHeader}>Add Practical Marks</th>
                      <th className={styles.tableHeader}>Verify</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {filteredStudents.map((student) => (
                      <tr key={student._id} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          {student.student._id.substring(0, 8)}...
                        </td>
                        <td className={styles.tableCell}>
                          {student.student.name}
                        </td>
                        <td className={styles.tableCell}>
                          {student.course.title}
                        </td>
                        <td className={styles.tableCell}>
                          {student.course.hasPracticalSession ? (
                            practicalMarksAdded[student._id] ? (
                              <span className={styles.marksAdded}>✓ Added: {practicalScores[student._id]}</span>
                            ) : (
                              <div className={styles.inputGroup}>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="Practical marks"
                                  value={practicalScores[student._id] || ''}
                                  onChange={(e) => setPracticalScores(prev => ({ ...prev, [student._id]: e.target.value }))}
                                  className={styles.input}
                                />
                                <button
                                  onClick={() => handleAddPracticalMarks(student._id)}
                                  className={styles.addButton}
                                >
                                  Add
                                </button>
                              </div>
                            )
                          ) : (
                            <span className={styles.naText}>N/A</span>
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          <button
                            onClick={() => handleVerify(student._id, student.course.hasPracticalSession)}
                            disabled={verifyingId === student._id || (student.course.hasPracticalSession && !practicalMarksAdded[student._id])}
                            className={`${styles.verifyButton} ${(student.course.hasPracticalSession && !practicalMarksAdded[student._id])
                              ? styles.verifyButtonDisabled
                              : ''
                              }`}
                          >
                            {verifyingId === student._id ? 'Verifying...' : 'Verify'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Verified Students Section */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Verified Students</h2>
            {filteredVerifiedStudents.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>No verified students matching filters.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead className={styles.tableHead}>
                    <tr>
                      <th className={styles.tableHeader}>ID</th>
                      <th className={styles.tableHeader}>Name</th>
                      <th className={styles.tableHeader}>Course Name</th>
                      <th className={styles.tableHeader}>Theory Score</th>
                      <th className={styles.tableHeader}>Practical Score</th>
                      <th className={styles.tableHeader}>Total Score</th>
                      <th className={styles.tableHeader}>Certificate</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {filteredVerifiedStudents.map((student: any) => (
                      <tr key={student._id} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          {student.student._id.substring(0, 8)}...
                        </td>
                        <td className={styles.tableCell}>
                          {student.student.name}
                        </td>
                        <td className={styles.tableCell}>
                          {student.course.title}
                        </td>
                        <td className={styles.tableCell}>
                          {student.certificate?.theoryScore || 0}
                        </td>
                        <td className={styles.tableCell}>
                          {student.certificate?.practicalScore || 0}
                        </td>
                        <td className={`${styles.tableCell} ${styles.totalScore}`}>
                          {student.certificate?.totalScore || 0}
                        </td>
                        <td className={styles.tableCell}>
                          <span className={styles.verified}>✓ Verified</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}
