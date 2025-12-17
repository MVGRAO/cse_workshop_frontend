'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, enrollInCourse } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/courseDetails.module.scss';
import markdownStyles from '@/styles/markdown.module.scss';
import { Loader2, PlayCircle, FileText, CheckCircle, Clock, BookOpen, User, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CourseDetailsProps {
    courseId: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function CourseDetails({ courseId }: CourseDetailsProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [courseData, setCourseData] = useState<any>(null);
    const [enrolled, setEnrolled] = useState(false);

    // Enrollment Form State
    const [showEnrollForm, setShowEnrollForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        classYear: '',
        college: '',
        mobile: '',
        verifierId: '',
    });

    const openEnrollForm = async () => {
        setSubmitting(false); // Reset submitting state
        setShowEnrollForm(true);

        // Fetch User Me Details
        try {
            // We can assume we have token since we are in private route, or at least check
            const token = getAuthToken('student');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const json = await response.json();
                if (json.success && json.data) {
                    const user = json.data;
                    setFormData(prev => ({
                        ...prev,
                        name: user.name || '',
                        email: user.email || '',
                        college: user.college || '',
                        classYear: user.classYear || '',
                        mobile: user.mobile || prev.mobile, // keep existing or fetch if available
                    }));
                }
            }
        } catch (e) {
            console.error("Failed to fetch user details for prefill", e);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchCourseDetails();
        }
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            setLoading(true);
            const token = getAuthToken('student');

            // Fetch Course Details (Outline)
            const detailsRes = await fetch(`${API_BASE_URL}/student/courses/${courseId}/details`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (detailsRes.ok) {
                const contentType = detailsRes.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const data = await detailsRes.json();
                    if (data.success) {
                        setCourseData(data.data);
                        // Use the server-provided enrollment status
                        setEnrolled(!!data.data.isEnrolled);

                        // Default Verifier for form
                        const verifiers = data.data.course.verifiers || [];
                        if (verifiers.length > 0) {
                            setFormData(prev => ({ ...prev, verifierId: verifiers[0]._id }));
                        }
                    }
                } else {
                    console.error("Received non-JSON response from details endpoint");
                    throw new Error("Invalid server response");
                }
            } else if (detailsRes.status === 403) {
                // Check if it's the "not published" case
                const errorData = await detailsRes.json();
                if (errorData.message === "Course not published") {
                    toast({
                        title: "Access Denied",
                        description: "Course still not published.",
                        variant: "error"
                    });
                    setCourseData({ error: 'Course still not published. Go back.' });
                    setLoading(false);
                    return;
                }
            }
            // Removed redundant enrollments fetch

        } catch (error) {
            console.error('Failed to fetch details:', error);
            toast({ title: 'Error', description: 'Failed to load course details', variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();

        if (courseData?.course?.verifiers?.length && !formData.verifierId) {
            toast({
                title: 'Select Verifier',
                description: 'Please choose a verifier before enrolling.',
                variant: 'error',
            });
            return;
        }

        try {
            setSubmitting(true);
            await enrollInCourse(courseId, formData);

            toast({
                title: 'Success',
                description: 'Enrolled successfully!',
                variant: 'success',
            });

            setEnrolled(true);
            setShowEnrollForm(false);

            // refreshing data
            fetchCourseDetails();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Enrollment failed',
                variant: 'error',
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading course details...</p>
            </div>
        );
    }

    if (!courseData || courseData.error) {
        return (
            <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151', marginBottom: '1.5rem' }}>
                    {courseData?.error || 'Course not found.'}
                </h2>
                <button
                    onClick={() => router.push('/candidate/courses')}
                    className={styles.backButton}
                    style={{
                        backgroundColor: '#374151',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        marginBottom: 0
                    }}
                >
                    Go Back to Courses
                </button>
            </div>
        );
    }

    const { course, lessons } = courseData;

    return (
        <div className={styles.container}>
            <button onClick={() => router.push('/candidate/courses')} className={styles.backButton}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', color: '#374151', fontWeight: 500 }}>
                    <ChevronLeft size={18} />
                    Back to Courses
                </div>
            </button>

            <div className={styles.grid}>
                {/* Left Column: About & Outline */}
                <div className={styles.mainColumn}>

                    {/* About Section */}
                    <div className={styles.card}>
                        <h2 className={styles.sectionTitle}>What you'll learn</h2>
                        <div className={`${styles.description} ${markdownStyles.markdownContent}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {course.description}
                            </ReactMarkdown>
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
                                <span>{lessons?.length || 0}  Lessons</span>
                            </div>
                            <div className={styles.metaItem}>
                                <div className="p-1.5 bg-gray-100 rounded-md">
                                    <FileText size={20} className="w-5 h-5 text-gray-500" />
                                </div>
                                <span>{lessons?.reduce((acc: number, l: any) => acc + (l.modules?.length || 0), 0) || 0} Modules</span>
                            </div>
                            <div className={styles.metaItem}>
                                <div className="p-1.5 bg-gray-100 rounded-md">
                                    <CheckCircle size={20} className="w-5 h-5 text-gray-500" />
                                </div>
                                <span>{lessons?.reduce((acc: number, l: any) => acc + (l.modules?.filter((m: any) => m.assignment).length || 0), 0) || 0} Assignments</span>
                            </div>
                            <div className={styles.metaItem}>
                                <div className="p-1.5 bg-gray-100 rounded-md">
                                    <User size={20} className="w-5 h-5 text-gray-500" />
                                </div>
                                <span>{courseData.enrollmentCount || 0} Students Enrolled</span>
                            </div>
                            <div className={styles.metaItem}>
                                <div className="p-1.5 bg-gray-100 rounded-md">
                                    <User size={20} className="w-5 h-5 text-gray-500" />
                                </div>
                                <span>Instructor: {course.createdBy?.name || 'CSE Workshop'}</span>
                            </div>
                        </div>

                        {enrolled ? (
                            <button className={styles.alreadyEnrolled} disabled>
                                Already Enrolled
                            </button>
                        ) : (
                            course.startTimestamp && new Date() > new Date(course.startTimestamp) ? (
                                <button className={styles.enrollButton} disabled style={{ backgroundColor: '#9ca3af', cursor: 'not-allowed' }}>
                                    Enrollment Ended
                                </button>
                            ) : (
                                <button className={styles.enrollButton} onClick={openEnrollForm}>
                                    Enroll for Free
                                </button>
                            )
                        )}

                    </div>
                </aside>
            </div>

            {/* Enrollment Modal */}
            {showEnrollForm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Enroll in {course.title}</h3>
                            <button onClick={() => setShowEnrollForm(false)} className={styles.closeModal}>&times;</button>
                        </div>

                        <form onSubmit={handleEnroll}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className={styles.input}
                                />
                            </div>
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className={styles.label}>Class Year</label>
                                    <input
                                        type="text"
                                        value={formData.classYear}
                                        onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                                        required
                                        className={styles.input}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className={styles.label}>College</label>
                                    <input
                                        type="text"
                                        value={formData.college}
                                        onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                                        required
                                        className={styles.input}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Mobile</label>
                                <input
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    required
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Verifier</label>
                                <select
                                    value={formData.verifierId}
                                    onChange={(e) => setFormData({ ...formData, verifierId: e.target.value })}
                                    className={styles.input}
                                    required={Boolean(course.verifiers?.length)}
                                >
                                    {course.verifiers?.length ? (
                                        <>
                                            <option value="">Select verifier</option>
                                            {course.verifiers.map((v: any) => (
                                                <option key={v._id} value={v._id}>
                                                    {v.name}
                                                </option>
                                            ))}
                                        </>
                                    ) : (
                                        <option value="">No verifier available</option>
                                    )}
                                </select>
                            </div>

                            <button type="submit" disabled={submitting} className={styles.submitBtn}>
                                {submitting ? 'Enrolling...' : 'Confirm Enrollment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
