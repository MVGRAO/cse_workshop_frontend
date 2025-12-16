'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, publishCourse } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/courseDetails.module.scss'; // Reuse styles
import { Loader2, PlayCircle, FileText, CheckCircle, Clock, BookOpen, User, ChevronLeft, Users } from 'lucide-react';

interface AdminCourseDetailsProps {
    courseId: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function AdminCourseDetails({ courseId }: AdminCourseDetailsProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [courseData, setCourseData] = useState<any>(null);
    const [enrollmentCount, setEnrollmentCount] = useState(0);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);

    useEffect(() => {
        if (courseId) {
            fetchCourseDetails();
        }
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            setLoading(true);
            const token = getAuthToken('admin');

            const res = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setCourseData(data.data);
                    setEnrollmentCount(data.data.enrollmentCount || 0);
                }
            } else {
                toast({ title: 'Error', description: 'Failed to load course details', variant: 'error' });
            }

        } catch (error) {
            console.error('Failed to fetch details:', error);
            toast({ title: 'Error', description: 'Failed to load course details', variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePublishCourse = async () => {
        try {
            await publishCourse(courseId);
            toast({
                title: 'Success',
                description: 'Course published successfully',
                variant: 'success',
            });
            setShowPublishConfirm(false);
            fetchCourseDetails(); // Refresh details
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to publish course',
                variant: 'error',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (!courseData) {
        return (
            <div className={styles.container}>
                <p>Course not found.</p>
                <button onClick={() => router.push('/admin')} className={styles.backButton}>Go Back</button>
            </div>
        );
    }

    const { course, lessons } = courseData;

    return (
        <div className={styles.container}>
            <button onClick={() => router.push('/admin')} className={styles.backButton}>
                <ChevronLeft size={20} />
                Back to Dashboard
            </button>

            <div className={styles.grid}>
                {/* Left Column: About & Outline */}
                <div className={styles.mainColumn}>

                    {/* About Section */}
                    <div className={styles.card}>
                        <h2 className={styles.sectionTitle}>What you'll learn</h2>
                        <div className={styles.description}>
                            {course.description}
                        </div>
                    </div>

                    {/* Course Outline Section */}
                    <div className={styles.card}>
                        <div className={styles.outlineHeader}>
                            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Course Outline</h2>
                            <span className={styles.outlineStats}>
                                {lessons?.length || 0} Lessons •
                            </span>
                        </div>

                        <div className={styles.outlineList}>
                            {lessons?.map((lesson: any) => (
                                <div key={lesson._id} className={styles.outlineItem}>
                                    <div className={styles.itemIcon}>
                                        <PlayCircle size={20} />
                                    </div>
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemTitle}>{lesson.title}</div>
                                        <div className={styles.itemMeta}>
                                            <span>{lesson.modules?.length || 0} Modules</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.card}>
                        <h1 className={styles.courseTitle}>{course.title}</h1>

                        <div className={styles.metaList}>
                            <div className={styles.metaItem}>
                                <div className="p-1.5 bg-gray-100 rounded-md">
                                    <BookOpen size={20} className="w-5 h-5 text-gray-500" />
                                </div>
                                <span>{lessons?.length || 0} Total Lessons</span>
                            </div>
                            <div className={styles.metaItem}>
                                <div className="p-1.5 bg-gray-100 rounded-md">
                                    <FileText size={20} className="w-5 h-5 text-gray-500" />
                                </div>
                                <span>{lessons?.reduce((acc: number, l: any) => acc + (l.modules?.length || 0), 0) || 0} Total Modules</span>
                            </div>
                            <div className={styles.metaItem}>
                                <div className="p-1.5 bg-gray-100 rounded-md">
                                    <CheckCircle size={20} className="w-5 h-5 text-gray-500" />
                                </div>
                                <span>{lessons?.reduce((acc: number, l: any) => acc + (l.modules?.filter((m: any) => m.assignment).length || 0), 0) || 0} Total Assignments</span>
                            </div>
                            <div className={styles.metaItem}>
                                <div className="p-1.5 bg-gray-100 rounded-md">
                                    <User size={20} className="w-5 h-5 text-gray-500" />
                                </div>
                                <span>Instructor: {course.createdBy?.name || 'CSE Workshop'}</span>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Total Enrollments</p>
                                <p className="text-xl font-bold text-gray-900">{enrollmentCount}</p>
                            </div>
                        </div>

                        {/* Verifiers Count */}
                        <div className="mt-4 p-4 bg-purple-50 rounded-lg flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Number of Verifiers</p>
                                <p className="text-xl font-bold text-gray-900">{course.verifiers?.length || 0}</p>
                            </div>
                        </div>

                        {course.status !== 'published' && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <button
                                    onClick={() => setShowPublishConfirm(true)}
                                    className={styles.uploadButton}
                                    style={{
                                        width: '100%',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Publish Course
                                </button>
                            </div>
                        )}

                        {course.status === 'published' && (
                            <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '0.5rem', background: '#d1fae5', color: '#065f46', borderRadius: '0.5rem', fontWeight: 500 }}>
                                ✓ Course Published
                            </div>
                        )}

                    </div>
                </aside>
            </div>

            {/* Custom Styled Confirm Modal */}
            {showPublishConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        width: '90%',
                        maxWidth: '450px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '4rem',
                            height: '4rem',
                            backgroundColor: '#ecfdf5',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <CheckCircle size={32} color="#10b981" />
                        </div>

                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>Ready to Publish?</h3>
                        <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: '1.5' }}>
                            You are about to publish <strong>{course.title}</strong>. This will make the course immediately visible to all students for enrollment.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowPublishConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.5rem',
                                    color: '#374151',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePublishCourse}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    backgroundColor: '#10b981',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                                }}
                            >
                                Yes, Publish Course
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
