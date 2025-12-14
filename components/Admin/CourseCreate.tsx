'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { createCourse, getUsers } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/courseedit.module.scss'; // Reuse edit styles

export default function CourseCreate() {
    const router = useRouter();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verifiers, setVerifiers] = useState<any[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('beginner');
    const [startTimestamp, setStartTimestamp] = useState('');
    const [endTimestamp, setEndTimestamp] = useState('');
    const [hasPractical, setHasPractical] = useState(false);
    const [selectedVerifiers, setSelectedVerifiers] = useState<string[]>([]);

    useEffect(() => {
        // Fetch verifiers for selection
        const fetchVerifiers = async () => {
            try {
                const response = await getUsers('verifier');
                if (response.success) {
                    setVerifiers(response.data);
                }
            } catch (error) {
                console.error('Failed to load verifiers:', error);
            }
        };
        fetchVerifiers();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !code.trim()) {
            toast({ title: 'Validation Error', description: 'Title and Code are required', variant: 'error' });
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title,
                code: code.toUpperCase(),
                description,
                category,
                level,
                hasPracticalSession: hasPractical,
                verifiers: selectedVerifiers,
                startTimestamp: startTimestamp ? new Date(startTimestamp).toISOString() : undefined,
                endTimestamp: endTimestamp ? new Date(endTimestamp).toISOString() : undefined,
            };

            const response = await createCourse(payload);

            if (response.success && response.data?._id) {
                toast({ title: 'Success', description: 'Course created successfully!', variant: 'success' });
                // Redirect to edit page to add content
                router.push(`/admin/courses/${response.data._id}/edit`);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to create course', variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PrivateRoute allowedRoles={['admin']}>
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    <div className={styles.courseForm}>
                        <h2 className={styles.formTitle}>Create New Course</h2>
                        <form onSubmit={handleCreate} className={styles.formSection}>
                            <div className={styles.formGroup}>
                                <label>Course Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    placeholder="e.g. Introduction to React"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Course Code *</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    required
                                    placeholder="e.g. CS101"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                    className={styles.textarea}
                                    placeholder="Course description..."
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        placeholder="e.g. Web Development"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Level</label>
                                    <select value={level} onChange={e => setLevel(e.target.value)} className={styles.selectInput}>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={startTimestamp}
                                        onChange={e => setStartTimestamp(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={endTimestamp}
                                        onChange={e => setEndTimestamp(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={hasPractical}
                                        onChange={e => setHasPractical(e.target.checked)}
                                        style={{ marginRight: '8px' }}
                                    />
                                    Has Practical Session?
                                </label>
                            </div>

                            {/* Basic Verifier Selection (mock UI, real select would be better) */}
                            {verifiers.length > 0 && (
                                <div className={styles.formGroup}>
                                    <label>Assign Verifiers</label>
                                    <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                                        {verifiers.map(v => (
                                            <label key={v._id} style={{ display: 'block', marginBottom: '5px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedVerifiers.includes(v._id)}
                                                    onChange={e => {
                                                        if (e.target.checked) setSelectedVerifiers([...selectedVerifiers, v._id]);
                                                        else setSelectedVerifiers(selectedVerifiers.filter(id => id !== v._id));
                                                    }}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                {v.name} ({v.email})
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.formActions}>
                                <button type="button" onClick={() => router.back()} className={styles.cancelButton}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.nextButton} disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </PrivateRoute>
    );
}
