'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUsers, updateUserStatus } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/studentslist.module.scss';
import PrivateRoute from '@/components/PrivateRoute';

export default function StudentsList() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await getUsers('student');
            if (response.success) {
                setStudents(response.data);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch students',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (studentId: string, currentStatus: boolean) => {
        try {
            // Optimistic update
            setStudents(students.map(s =>
                s._id === studentId ? { ...s, isBlocked: !currentStatus } : s
            ));

            await updateUserStatus(studentId, !currentStatus);

            toast({
                title: 'Success',
                description: `Student ${!currentStatus ? 'blocked' : 'unblocked'} successfully`,
                variant: 'success',
            });
        } catch (error: any) {
            // Revert on failure
            setStudents(students.map(s =>
                s._id === studentId ? { ...s, isBlocked: currentStatus } : s
            ));

            toast({
                title: 'Error',
                description: error.message || 'Failed to update status',
                variant: 'error',
            });
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PrivateRoute allowedRoles={['admin']}>
            <div className={styles.container}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <Link href="/admin" className={styles.backLink}>
                        ← Back to Dashboard
                    </Link>
                    <h1 className={styles.title} style={{ marginBottom: 0 }}>Students Management</h1>
                    <div style={{ width: 100 }}></div> {/* Spacer */}
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

                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Loading students...</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No students found matching your search.</p>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name / Email</th>
                                    <th>College</th>
                                    <th>Class Year</th>
                                    <th>Mobile</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student._id}>
                                        <td>
                                            <div className={styles.userInfo}>
                                                <span className={styles.userName}>{student.name}</span>
                                                <span className={styles.userEmail}>{student.email}</span>
                                            </div>
                                        </td>
                                        <td>{student.college || '-'}</td>
                                        <td>{student.classYear || '-'}</td>
                                        <td>{student.mobile || '-'}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${!student.isBlocked ? styles.statusActive : styles.statusBlocked}`}>
                                                {!student.isBlocked ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleToggleBlock(student._id, student.isBlocked || false)}
                                                className={`${styles.toggleButton} ${!student.isBlocked ? styles.blockButton : styles.unblockButton}`}
                                            >
                                                {!student.isBlocked ? 'Block' : 'Unblock'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </PrivateRoute>
    );
}
