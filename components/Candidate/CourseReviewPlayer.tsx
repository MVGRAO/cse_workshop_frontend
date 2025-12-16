'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentCourseDetails, getStudentEnrollments, getAssignmentReview, getCurrentUser } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import { Menu, X, ChevronLeft, ChevronRight, Check, FileText, PlayCircle } from 'lucide-react';
import YouTube from 'react-youtube';
import styles from '@/styles/courseplayer.module.scss';

const getVideoId = (url: string) => {
    try {
        if (!url) return '';
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1];
        } else if (url.includes('youtube.com/embed/')) {
            videoId = url.split('embed/')[1];
        } else if (url.includes('youtube.com/shorts/')) {
            videoId = url.split('shorts/')[1];
        } else {
            return url;
        }
        if (videoId.includes('&')) videoId = videoId.split('&')[0];
        if (videoId.includes('?')) videoId = videoId.split('?')[0];
        return videoId;
    } catch (e) {
        return '';
    }
};

interface Question {
    _id: string;
    qType: 'mcq' | 'short' | 'code';
    questionText: string;
    options?: string[];
    maxMarks: number;
}

interface Assignment {
    _id: string;
    questions: Question[];
    maxScore: number;
}

interface Module {
    _id: string;
    title: string;
    description: string;
    videoUrl?: string;
    textContent?: string;
    assignment?: Assignment;
}

interface Lesson {
    lessonId: string;
    title: string;
    index: number;
    modules: Module[];
}

interface CourseReviewPlayerProps {
    courseId: string;
}

export default function CourseReviewPlayer({ courseId }: CourseReviewPlayerProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [user, setUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [reviewData, setReviewData] = useState<any>(null);

    // Always fetch review data when module changes
    useEffect(() => {
        const loadReviewData = async () => {
            const module = getCurrentModule();
            if (module?.assignment?._id) {
                try {
                    const res = await getAssignmentReview(module.assignment._id);
                    if (res.success) {
                        setReviewData(res.data);
                    }
                } catch (err) {
                    console.error('Failed to load review data', err);
                }
            } else {
                setReviewData(null);
            }
        };
        loadReviewData();
    }, [currentLessonIndex, currentModuleIndex, lessons]);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);

        fetchCourseContent();
        fetchUserData();

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const fetchUserData = async () => {
        try {
            const userData = await getCurrentUser();
            if (userData && userData.success) {
                setUser(userData.data.user || userData.data);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const fetchCourseContent = async () => {
        try {
            setLoading(true);
            const response = await getStudentCourseDetails(courseId);
            if (response.success && response.data) {
                const lessonsData = Array.isArray(response.data) ? response.data : [];
                setLessons(lessonsData);
            }
        } catch (error: any) {
            console.error('Error loading course content:', error);
            toast({ title: 'Error', description: 'Failed to load course content', variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getCurrentModule = (): Module | null => {
        if (lessons.length === 0) return null;
        if (currentLessonIndex >= lessons.length) return null;
        const lesson = lessons[currentLessonIndex];
        if (currentModuleIndex >= lesson.modules.length) return null;
        return lesson.modules[currentModuleIndex];
    };

    const currentModule = getCurrentModule();

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Loading review...</p>
            </div>
        );
    }

    return (
        <div className={styles.layoutContainer}>
            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div className={styles.mobileOverlay} onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ''} ${isMobile && isSidebarOpen ? styles.sidebarMobileOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.sidebarTopRow}>
                        <button onClick={() => router.push('/candidate/my-courses')} className={styles.backButton} style={{ marginRight: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                            <ChevronLeft size={20} /> Back
                        </button>
                        {isMobile && (
                            <button onClick={() => setIsSidebarOpen(false)} className={styles.mobileCloseButton}>
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    <h2 className={styles.courseTitle}>Course Review</h2>
                </div>

                <div className={styles.stepperContainer}>
                    {lessons.map((lesson, lIdx) => (
                        <div key={lesson.lessonId || lIdx} className={styles.lessonStepperGroup}>
                            <div className={styles.lessonHeader}>{lesson.title}</div>
                            {lesson.modules.map((module, mIdx) => {
                                const isActive = currentLessonIndex === lIdx && currentModuleIndex === mIdx;
                                return (
                                    <div
                                        key={module._id}
                                        className={styles.stepperItem}
                                        onClick={() => {
                                            setCurrentLessonIndex(lIdx);
                                            setCurrentModuleIndex(mIdx);
                                            if (isMobile) setIsSidebarOpen(false);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.stepperLine}></div>
                                        <div className={`${styles.stepperNode} ${isActive ? styles.active : ''} ${styles.completed}`}>
                                            <Check size={10} color="white" strokeWidth={4} />
                                        </div>
                                        <div className={styles.stepperContent}>
                                            <div className={`${styles.stepperTitle} ${isActive ? styles.active : ''}`}>
                                                {module.title}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContentArea}>
                <div className={styles.contentHeader}>
                    <div className={styles.headerLeft}>
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={styles.toggleButton}>
                            {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
                        </button>
                        <h1 className={styles.contentTitle}>
                            {currentModule ? currentModule.title : 'End of Review'}
                        </h1>
                    </div>
                </div>

                <div className={styles.contentScrollable}>
                    {currentModule && (
                        <div className={styles.moduleCard}>
                            {currentModule.videoUrl && (
                                <div className={styles.videoWrapper}>
                                    <YouTube
                                        videoId={getVideoId(currentModule.videoUrl)}
                                        opts={{ width: '100%', height: '100%' }}
                                        className={styles.videoIframe}
                                    />
                                </div>
                            )}

                            <div className={styles.moduleContent}>
                                {currentModule.description && (
                                    <div className={styles.moduleDescription}>
                                        {currentModule.description}
                                    </div>
                                )}

                                {currentModule.assignment && reviewData && (
                                    <div className={styles.reviewSection} style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Assignment Review</h2>

                                        <div className={styles.scoreSummary} style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '2rem' }}>
                                                <div><strong>Total Score:</strong> {reviewData.totalScore} / {reviewData.maxScore}</div>
                                                {/* <div><strong>Grade:</strong> {reviewData.grade}</div> */}
                                            </div>
                                        </div>

                                        {reviewData.answers.map((ans: any, idx: number) => (
                                            <div key={ans.questionId} className={styles.questionCard} style={{ border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '1rem', background: 'white' }}>
                                                <div className={styles.questionHeader}>
                                                    <h3 className={styles.questionNumber}>Question {idx + 1}</h3>
                                                    <span className={styles.questionMarks}>{ans.marksAwarded} / {ans.maxMarks} marks</span>
                                                </div>
                                                <p className={styles.questionText} style={{ marginBottom: '1rem' }}>{ans.questionText}</p>

                                                {/* MCQ Options Display */}
                                                {ans.qType === 'mcq' && ans.options && (
                                                    <div className={styles.optionsContainer}>
                                                        {ans.options.map((opt: string, optIdx: number) => {
                                                            const isCorrect = optIdx === ans.correctOptionIndex;
                                                            const isSelected = optIdx === ans.studentSelectedOptionIndex;

                                                            let bgStyle = 'white';
                                                            let borderStyle = '1px solid #d1d5db';
                                                            let textStyle = '#374151';

                                                            if (isCorrect) {
                                                                bgStyle = '#dcfce7'; // green-100
                                                                borderStyle = '1px solid #22c55e'; // green-500
                                                                textStyle = '#15803d'; // green-700
                                                            } else if (isSelected) {
                                                                // Wrong selection
                                                                bgStyle = '#fee2e2'; // red-100
                                                                borderStyle = '1px solid #ef4444'; // red-500
                                                                textStyle = '#b91c1c'; // red-700
                                                            }

                                                            return (
                                                                <div key={optIdx} style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '0.75rem',
                                                                    borderRadius: '0.375rem',
                                                                    marginBottom: '0.5rem',
                                                                    backgroundColor: bgStyle,
                                                                    border: borderStyle,
                                                                    color: textStyle
                                                                }}>
                                                                    <div style={{
                                                                        width: '1.25rem',
                                                                        height: '1.25rem',
                                                                        borderRadius: '50%',
                                                                        border: '2px solid currentColor',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        marginRight: '0.75rem',
                                                                        flexShrink: 0
                                                                    }}>
                                                                        {isSelected && <div style={{ width: '0.6rem', height: '0.6rem', borderRadius: '50%', background: 'currentColor' }}></div>}
                                                                    </div>
                                                                    <span>{opt}</span>
                                                                    {isCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.875rem', fontWeight: 600 }}>Correct Answer</span>}
                                                                    {isSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: '0.875rem', fontWeight: 600 }}>Your Answer</span>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Short/Code Answer Display */}
                                                {(ans.qType === 'short' || ans.qType === 'code') && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                        <div>
                                                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Your Answer:</strong>
                                                            <div style={{
                                                                padding: '0.75rem',
                                                                backgroundColor: ans.marksAwarded > 0 ? '#f0fdf4' : '#fef2f2',
                                                                border: `1px solid ${ans.marksAwarded > 0 ? '#86efac' : '#fecaca'}`,
                                                                borderRadius: '0.375rem'
                                                            }}>
                                                                {ans.studentAnswerText || <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>No answer provided</span>}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Correct Answer / Explanation:</strong>
                                                            <div style={{
                                                                padding: '0.75rem',
                                                                backgroundColor: '#f3f4f6',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '0.375rem'
                                                            }}>
                                                                {ans.correctAnswerText || <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>No explanation available</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>
                                        ))}

                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
