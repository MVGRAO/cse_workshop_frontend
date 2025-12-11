'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseDetails, getUsers, updateCourse } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from './verifiers.module.css';

interface User {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
}

interface PageProps {
    params: Promise<{ courseId: string }>;
}

export default function CourseVerifiersPage(props: PageProps) {
    const params = use(props.params);
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [courseTitle, setCourseTitle] = useState('');
    const [allVerifiers, setAllVerifiers] = useState<User[]>([]);
    const [selectedVerifierIds, setSelectedVerifierIds] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [courseData, verifiersData] = await Promise.all([
                getCourseDetails(params.courseId),
                getUsers('verifier')
            ]);

            // Set Course Title
            if (courseData && courseData.data && courseData.data.course) {
                setCourseTitle(courseData.data.course.title);

                // Identify currently selected verifiers
                // Note: courseData.data.course.verifiers is populated with objects or IDs depending on backend
                // Based on controller: .populate('verifiers', 'name email')
                const currentVerifiers = courseData.data.course.verifiers || [];
                const currentIds = currentVerifiers.map((v: any) => v._id || v);
                setSelectedVerifierIds(currentIds);
            }

            // Set All Verifiers
            if (verifiersData && verifiersData.data) {
                const verifiers = Array.isArray(verifiersData.data) ? verifiersData.data : [];
                setAllVerifiers(verifiers);
            }

            setLoading(false);
        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load data',
                variant: 'error',
            });
            setLoading(false);
        }
    };

    const toggleVerifier = (verifierId: string) => {
        setSelectedVerifierIds(prev => {
            if (prev.includes(verifierId)) {
                return prev.filter(id => id !== verifierId);
            } else {
                return [...prev, verifierId];
            }
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await updateCourse(params.courseId, { verifiers: selectedVerifierIds });

            toast({
                title: 'Success',
                description: 'Verifiers updated successfully',
                variant: 'success',
            });

            // Go back to admin dashboard
            router.push('/admin');
        } catch (error: any) {
            console.error('Error saving verifiers:', error);
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
        return <div className={styles.loading}>Loading verifiers...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Manage Verifiers</h1>
                <p className={styles.subtitle}>
                    Select verifiers for <strong>{courseTitle}</strong>
                </p>
            </header>

            {allVerifiers.length === 0 ? (
                <div className={styles.empty}>
                    No verifiers found in the system. Please create users with 'verifier' role first.
                </div>
            ) : (
                <div className={styles.verifierList}>
                    {allVerifiers.map((verifier) => (
                        <div
                            key={verifier._id}
                            className={styles.verifierItem}
                            onClick={() => toggleVerifier(verifier._id)}
                        >
                            <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={selectedVerifierIds.includes(verifier._id)}
                                readOnly
                            />
                            <div className={styles.avatar}>
                                {verifier.avatarUrl ? (
                                    <img src={verifier.avatarUrl} alt={verifier.name} className={styles.avatarImg} />
                                ) : (
                                    <span className={styles.avatarPlaceholder}>
                                        {verifier.name.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className={styles.verifierInfo}>
                                <span className={styles.verifierName}>{verifier.name}</span>
                                <span className={styles.verifierEmail}>{verifier.email}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className={styles.actions}>
                <button
                    className={styles.cancelButton}
                    onClick={() => router.back()}
                    disabled={saving}
                >
                    Cancel
                </button>
                <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
