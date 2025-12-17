'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentCourseDetails, startSubmission, submitAssignment, getStudentEnrollments, completeEnrollment, getCurrentUser, getAssignmentReview } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import { Menu, X, ChevronLeft, ChevronRight, PlayCircle, FileText, BookOpen, Check } from 'lucide-react';
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
            return url; // fallback to assuming it might be an ID
        }

        // Clean up parameters (e.g. &t=10s)
        if (videoId.includes('&')) {
            videoId = videoId.split('&')[0];
        }
        if (videoId.includes('?')) {
            videoId = videoId.split('?')[0];
        }
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

interface CoursePlayerProps {
    courseId: string;
}

export default function CoursePlayer({ courseId }: CoursePlayerProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [courseStarted, setCourseStarted] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(true);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'content' | 'assignment'>('content'); // New state for sub-navigation
    const [assignmentMode, setAssignmentMode] = useState(false); // Keeps track if "Start Assignment" was clicked (Questions visible)
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<{ [key: string]: any }>({});
    const [moduleCompleted, setModuleCompleted] = useState<Set<string>>(new Set());
    const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isCourseCompleted, setIsCourseCompleted] = useState(false);
    const [isReviewMode, setIsReviewMode] = useState(false);
    const [reviewData, setReviewData] = useState<any>(null);


    useEffect(() => {
        const loadReviewData = async () => {
            const module = getCurrentModule();

            if (
                isReviewMode &&
                module?.assignment?._id
            ) {
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
    }, [currentLessonIndex, currentModuleIndex, isReviewMode]);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        fetchCourseContent();
        fetchEnrollmentId();
        fetchUserData();

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Reset to content tab when module changes
    useEffect(() => {
        // If independent navigation happens, we might want to default to content
        // But we handle explicit setting in sidebar click
    }, [currentLessonIndex, currentModuleIndex]);

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
    const fetchEnrollmentId = async () => {
        try {
            const enrollments = await getStudentEnrollments();
            if (enrollments.success && enrollments.data) {
                const enrollment = enrollments.data.find(
                    (e: any) => e.course?._id === courseId
                );

                if (enrollment) {
                    setEnrollmentId(enrollment._id);

                    if (enrollment.status === 'completed') {
                        setIsCourseCompleted(true);
                        setIsReviewMode(true);
                        setShowConfirmDialog(false);
                        setCourseStarted(true);
                    }

                }
            }
        } catch (error) {
            console.error('Error fetching enrollment:', error);
        }
    };


    const fetchCourseContent = async () => {
        try {
            setLoading(true);
            const response = await getStudentCourseDetails(courseId);

            if (response.success && response.data) {
                // Handle new response structure { course, lessons, isEnrolled, enrollmentId }
                const lessonsData = response.data.lessons || (Array.isArray(response.data) ? response.data : []);

                if (response.data.enrollmentId) {
                    setEnrollmentId(response.data.enrollmentId);
                }

                if (lessonsData.length === 0) {
                    toast({
                        title: 'No Content',
                        description: 'This course has no lessons yet.',
                        variant: 'info',
                    });
                }
                setLessons(lessonsData);
            }
        } catch (error: any) {
            console.error('Error loading course content:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load course content',
                variant: 'error',
            });
            if (error.message?.includes('not enrolled')) {
                router.push('/candidate/courses');
            }
            if (error.message?.toLowerCase().includes('not yet published')) {
                router.push('/candidate/my-courses');
            }
        } finally {
            setLoading(false);
        }
    };

    const [maxReached, setMaxReached] = useState({ l: 0, m: 0 });

    useEffect(() => {
        if (isReviewMode || isCourseCompleted) {
            setMaxReached({ l: lessons.length, m: 999 });
        }
    }, [isReviewMode, isCourseCompleted, lessons]);

    const handleConfirmStart = () => {
        setShowConfirmDialog(false);
        setCourseStarted(true);
        setMaxReached({ l: 0, m: 0 });
    };

    const handleCancelStart = () => {
        router.push('/candidate/my-courses');
    };

    const getCurrentModule = (): Module | null => {
        if (lessons.length === 0) return null;
        if (currentLessonIndex >= lessons.length) return null;
        const lesson = lessons[currentLessonIndex];
        if (currentModuleIndex >= lesson.modules.length) return null;
        return lesson.modules[currentModuleIndex];
    };

    const handleStartAssignment = async () => {
        if (isReviewMode) return;

        const module = getCurrentModule();
        if (!module?.assignment?._id) return;

        try {
            const response = await startSubmission(module.assignment._id);
            if (response.success && response.data?._id) {
                setSubmissionId(response.data._id);
                setAssignmentMode(true);
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to start assignment',
                variant: 'error',
            });
        }
    };

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmitAssignment = async () => {
        const module = getCurrentModule();
        if (!module?.assignment?._id || !submissionId) return;

        try {
            const submissionAnswers = Object.entries(answers).map(([questionId, value]) => ({
                questionId,
                selectedOptionIndex: typeof value === 'number' ? value : undefined,
                answerText: typeof value === 'string' ? value : undefined,
            }));

            await submitAssignment(module.assignment._id, {
                submissionId,
                answers: submissionAnswers,
            });

            toast({
                title: 'Success',
                description: 'Assignment submitted successfully!',
                variant: 'success',
            });

            const moduleId = module._id;
            setModuleCompleted(prev => new Set([...prev, moduleId]));
            setAssignmentMode(false);
            setAnswers({});
            setSubmissionId(null);

            // After submission, stay on assignment tab or move next?
            // Usually move next is good behavior
            moveToNext();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to submit assignment',
                variant: 'error',
            });
        }
    };

    const moveToNext = () => {
        const currentLesson = lessons[currentLessonIndex];
        const currentModule = currentLesson.modules[currentModuleIndex];

        // If currently on content tab and module has assignment, go to assignment tab
        const hasAssignment = !!currentModule.assignment;
        if (activeTab === 'content' && hasAssignment) {
            setActiveTab('assignment');
            return;
        }

        // Otherwise move to next module
        let nextL = currentLessonIndex;
        let nextM = currentModuleIndex;

        if (currentModuleIndex < currentLesson.modules.length - 1) {
            nextM = currentModuleIndex + 1;
        } else {
            if (currentLessonIndex < lessons.length - 1) {
                nextL = currentLessonIndex + 1;
                nextM = 0;
            } else {
                handleCourseComplete();
                return;
            }
        }

        setCurrentLessonIndex(nextL);
        setCurrentModuleIndex(nextM);
        setActiveTab('content'); // Default to content for new module
        setAssignmentMode(false);

        // Update max reached if we moved forward
        if (nextL > maxReached.l || (nextL === maxReached.l && nextM > maxReached.m)) {
            setMaxReached({ l: nextL, m: nextM });
        }
    };

    const moveToPrevious = () => {
        // If on assignment tab, go back to content tab (if video exists)
        // If content tab, go to previous module's assignment (if exists) or content

        const currentModule = getCurrentModule();
        const hasVideo = !!currentModule?.videoUrl || !!currentModule?.textContent;

        if (activeTab === 'assignment' && hasVideo) {
            setActiveTab('content');
            return;
        }

        // Go to previous module
        if (currentModuleIndex > 0) {
            const prevModule = lessons[currentLessonIndex].modules[currentModuleIndex - 1];
            setCurrentModuleIndex(currentModuleIndex - 1);
            // If prev module has assignment, default to assignment tab? 
            // Usually "Previous" implies going back to the end of the previous item.
            if (prevModule.assignment) {
                setActiveTab('assignment');
            } else {
                setActiveTab('content');
            }
        } else if (currentLessonIndex > 0) {
            const prevLesson = lessons[currentLessonIndex - 1];
            const prevModuleIdx = prevLesson.modules.length - 1;
            const prevModule = prevLesson.modules[prevModuleIdx];

            setCurrentLessonIndex(currentLessonIndex - 1);
            setCurrentModuleIndex(prevModuleIdx);

            if (prevModule.assignment) {
                setActiveTab('assignment');
            } else {
                setActiveTab('content');
            }
        }
    };

    const handleCourseComplete = async () => {
        try {
            if (!enrollmentId) {
                toast({
                    title: 'Error',
                    description: 'Enrollment not found',
                    variant: 'error',
                });
                return;
            }

            await completeEnrollment(enrollmentId);

            toast({
                title: 'Congratulations! 🎉',
                description: 'You have completed all course modules! Your course will now be reviewed by your verifier.',
                variant: 'success',
            });

            setTimeout(() => {
                router.push('/candidate/my-courses');
            }, 3000);
        } catch (error: any) {
            console.error('Error completing course:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to complete course',
                variant: 'error',
            });
        }
    };

    const handleExitAssignment = () => {
        setAssignmentMode(false);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p className={styles.loadingText}>Loading course content...</p>
            </div>
        );
    }

    const currentModule = getCurrentModule();
    const currentLesson = lessons[currentLessonIndex];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className={styles.layoutContainer}>
            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ''} ${isMobile && isSidebarOpen ? styles.sidebarMobileOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.sidebarTopRow}>
                        {user && (
                            <div className={styles.profileSection}>
                                <div className={styles.avatar}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} />
                                    ) : (
                                        <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                                    )}
                                </div>
                                <div className={styles.profileInfo}>
                                    <span className={styles.profileName}>{user.name}</span>
                                    <span className={styles.profileEmail}>{user.email}</span>
                                </div>
                            </div>
                        )}
                        {isMobile && (
                            <button onClick={() => setIsSidebarOpen(false)} className={styles.mobileCloseButton}>
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <h2 className={styles.courseTitle}>Course Content</h2>
                </div>

                <div className={styles.stepperContainer}>
                    {lessons.map((lesson, lIdx) => (
                        <div key={lesson.lessonId || lIdx} className={styles.lessonStepperGroup}>
                            <div className={styles.lessonHeader}>
                                {lesson.title}
                            </div>

                            {lesson.modules.map((module, mIdx) => {
                                // Determine if we need to split this module into Content + Assignment
                                const hasVideo = !!module.videoUrl || !!module.textContent;
                                const hasAssignment = !!module.assignment;

                                const isCompleted = moduleCompleted.has(module._id);

                                // Check if this step is "future"
                                const isLocked = !isReviewMode && !isCourseCompleted && (
                                    lIdx > maxReached.l ||
                                    (lIdx === maxReached.l && mIdx > maxReached.m)
                                );

                                const contentActive = currentLessonIndex === lIdx && currentModuleIndex === mIdx && activeTab === 'content';
                                const assignmentActive = currentLessonIndex === lIdx && currentModuleIndex === mIdx && activeTab === 'assignment';

                                const renderItems = [];

                                // Item 1: Content (Video/Text)
                                if (hasVideo || !hasAssignment) {
                                    renderItems.push(
                                        <div
                                            key={`${module._id}-content`}
                                            className={`${styles.stepperItem} ${isLocked ? styles.locked : ''}`}
                                            onClick={() => {
                                                if (isLocked) return;
                                                setCurrentLessonIndex(lIdx);
                                                setCurrentModuleIndex(mIdx);
                                                setActiveTab('content');
                                                setAssignmentMode(false);
                                                if (isMobile) setIsSidebarOpen(false);
                                            }}
                                            style={{ cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.5 : 1 }}
                                        >
                                            <div className={`${styles.stepperLine} ${isCompleted ? styles.completed : ''}`}></div>
                                            <div className={`${styles.stepperNode} ${contentActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}>
                                                {isCompleted && (hasAssignment ? (!assignmentActive && !contentActive ? <Check size={10} color="white" strokeWidth={4} /> : null) : <Check size={10} color="white" strokeWidth={4} />)}
                                            </div>

                                            <div className={styles.stepperContent}>
                                                <div className={`${styles.stepperTitle} ${contentActive ? styles.active : ''}`}>
                                                    {module.title}
                                                </div>
                                                <div className={styles.stepperType}>
                                                    {module.videoUrl ? 'Video' : 'Reading'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                // Item 2: Assignment
                                if (hasAssignment) {
                                    renderItems.push(
                                        <div
                                            key={`${module._id}-assignment`}
                                            className={`${styles.stepperItem} ${isLocked ? styles.locked : ''}`}
                                            onClick={() => {
                                                if (isLocked) return;
                                                setCurrentLessonIndex(lIdx);
                                                setCurrentModuleIndex(mIdx);
                                                setActiveTab('assignment');
                                                // Should we auto-start? Maybe not, forcing user to click "Start" is fine
                                                // setAssignmentMode(false); 
                                                if (isMobile) setIsSidebarOpen(false);
                                            }}
                                            style={{ cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.5 : 1 }}
                                        >
                                            <div className={`${styles.stepperLine} ${isCompleted ? styles.completed : ''}`}></div>
                                            <div className={`${styles.stepperNode} ${assignmentActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}>
                                                {isCompleted && <Check size={10} color="white" strokeWidth={4} />}
                                            </div>

                                            <div className={styles.stepperContent}>
                                                <div className={`${styles.stepperTitle} ${assignmentActive ? styles.active : ''}`}>
                                                    {module.title} (Assignment)
                                                </div>
                                                <div className={styles.stepperType}>
                                                    Assignment
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return <div key={module._id}>{renderItems}</div>;
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContentArea}>
                <div className={styles.contentHeader}>
                    <div className={styles.headerLeft}>
                        <button onClick={toggleSidebar} className={styles.toggleButton} title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}>
                            {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
                        </button>
                        <h1 className={styles.contentTitle}>
                            {currentModule ?
                                (activeTab === 'assignment' ? `Assignment: ${currentModule.title}` : currentModule.title)
                                : lessons.length === 0 ? 'No Content' : 'Course Completed'}
                        </h1>
                    </div>
                </div>

                <div className={styles.contentScrollable}>
                    {/* Render Content Logic based on activeTab */}

                    {currentModule ? (
                        <>
                            {/* VIDEO / TEXT VIEW */}
                            {activeTab === 'content' && (
                                <div className={styles.moduleCard}>
                                    {currentModule.videoUrl && (
                                        <div className={styles.videoWrapper}>
                                            <YouTube
                                                videoId={getVideoId(currentModule.videoUrl)}
                                                opts={{
                                                    width: '100%',
                                                    height: '100%',
                                                    playerVars: {
                                                        autoplay: 0,
                                                        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
                                                    },
                                                }}
                                                className={styles.videoIframe}
                                                iframeClassName={styles.videoIframe}
                                                onError={() => {
                                                    toast({
                                                        title: 'Video Error',
                                                        description: 'Unable to load video',
                                                        variant: 'error'
                                                    });
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className={styles.moduleContent}>
                                        {currentModule.description && (
                                            <div className={styles.moduleDescription}>
                                                {currentModule.description}
                                            </div>
                                        )}

                                        {/* Navigation Footer for Content View */}
                                        <div className={styles.navigationButtons}>
                                            <button
                                                onClick={moveToPrevious}
                                                className={styles.navButton}
                                                disabled={currentLessonIndex === 0 && currentModuleIndex === 0}
                                            >
                                                Previous
                                            </button>

                                            <button onClick={moveToNext} className={styles.continueButton}>
                                                {currentModule.assignment ? 'Go to Assignment →' : 'Next Module →'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ASSIGNMENT VIEW */}
                            {activeTab === 'assignment' && (
                                <>
                                    {assignmentMode ? (
                                        // DOING QUIZ
                                        <div className={styles.assignmentContainer}>
                                            <div className={styles.assignmentHeader}>
                                                <h2 className={styles.assignmentTitle}>Questions</h2>
                                                <button onClick={handleExitAssignment} className={styles.exitButton}>
                                                    Exit Assignment
                                                </button>
                                            </div>

                                            <div className={styles.questionsContainer}>
                                                {currentModule.assignment?.questions.map((q, idx) => (
                                                    <div key={q._id} className={styles.questionCard}>
                                                        <div className={styles.questionHeader}>
                                                            <h3 className={styles.questionNumber}>Question {idx + 1}</h3>
                                                            <span className={styles.questionMarks}>{q.maxMarks} marks</span>
                                                        </div>
                                                        <p className={styles.questionText}>{q.questionText}</p>

                                                        {q.qType === 'mcq' && q.options && (
                                                            <div className={styles.optionsContainer}>
                                                                {q.options.map((opt, optIdx) => (
                                                                    <label key={optIdx} className={styles.optionLabel}>
                                                                        <input
                                                                            type="radio"
                                                                            name={`q_${q._id}`}
                                                                            className={styles.optionRadio}
                                                                            onChange={() => handleAnswerChange(q._id, optIdx)}
                                                                            checked={answers[q._id] === optIdx}
                                                                        />
                                                                        <span>{opt}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {(q.qType === 'short' || q.qType === 'code') && (
                                                            <textarea
                                                                className={styles.answerTextarea}
                                                                rows={6}
                                                                placeholder="Type your answer here..."
                                                                onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                                                value={answers[q._id] || ''}
                                                            />
                                                        )}
                                                    </div>
                                                ))}

                                                <div className={styles.submitContainer}>
                                                    <button onClick={handleSubmitAssignment} className={styles.submitButton}>
                                                        Submit Assignment
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // START SCREEN / DONE SCREEN
                                        <div className={styles.moduleCard}>
                                            <div className={styles.moduleContent}>
                                                {currentModule.assignment && currentModule.assignment.questions && currentModule.assignment.questions.length > 0 && !moduleCompleted.has(currentModule._id) && (
                                                    <div className={styles.assignmentSection}>
                                                        <div className={styles.assignmentInfo}>
                                                            <div>
                                                                <h2 className={styles.assignmentHeading}>Assignment Task</h2>
                                                                <p className={styles.assignmentDetails}>
                                                                    {currentModule.assignment.questions.length} question(s) • {currentModule.assignment.maxScore || 'N/A'} total marks
                                                                </p>
                                                                <p style={{ marginTop: '1rem', color: '#666' }}>
                                                                    Click the button below to start your assignment. You will be presented with questions to answer.
                                                                </p>
                                                            </div>
                                                            {!isReviewMode &&
                                                                currentModule.assignment &&
                                                                !moduleCompleted.has(currentModule._id) && (
                                                                    <div style={{ marginTop: '2rem' }}>
                                                                        <button
                                                                            onClick={handleStartAssignment}
                                                                            className={styles.startAssignmentButton}
                                                                        >
                                                                            Start Assignment
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            {isReviewMode && (
                                                                <span className={styles.reviewBadge}>
                                                                    Review Mode
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {isReviewMode && currentModule.assignment && reviewData && (
                                                    <div className={styles.reviewSection}>
                                                        <h2>Assignment Review</h2>
                                                        {reviewData.answers.map((ans: any, idx: number) => (
                                                            <div key={ans.questionId} className={styles.reviewCard}>
                                                                <h3>Question {idx + 1}</h3>
                                                                <p><strong>Your Answer:</strong></p>
                                                                <div className={styles.studentAnswer}>
                                                                    {ans.studentAnswer ?? 'Not answered'}
                                                                </div>
                                                                <p><strong>Correct Answer:</strong></p>
                                                                <div className={styles.correctAnswer}>
                                                                    {ans.correctAnswer}
                                                                </div>
                                                                <p className={styles.marks}>
                                                                    Marks: {ans.marksAwarded} / {ans.maxMarks}
                                                                </p>
                                                            </div>
                                                        ))}
                                                        <div className={styles.scoreSummary}>
                                                            <strong>Total Score:</strong> {reviewData.totalScore} <br />
                                                            <strong>Grade:</strong> {reviewData.grade}
                                                        </div>
                                                    </div>
                                                )}

                                                {currentModule.assignment && moduleCompleted.has(currentModule._id) && (
                                                    <div className={styles.completedSection}>
                                                        <div className={styles.completedMessage}>
                                                            <p>✓ Assignment completed!</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Navigation Footer for Assignment Standalone View */}
                                                <div className={styles.navigationButtons} style={{ marginTop: '3rem' }}>
                                                    <button
                                                        onClick={moveToPrevious}
                                                        className={styles.navButton}
                                                    >
                                                        Previous
                                                    </button>

                                                    {(moduleCompleted.has(currentModule._id) || !currentModule.assignment || currentModule.assignment.questions.length === 0) ? (
                                                        currentLessonIndex === lessons.length - 1 && currentModuleIndex === currentLesson.modules.length - 1 ? (
                                                            <button onClick={moveToNext} className={styles.completeButton}>
                                                                Complete Course ✓
                                                            </button>
                                                        ) : (
                                                            <button onClick={moveToNext} className={styles.continueButton}>
                                                                Next Module →
                                                            </button>
                                                        )
                                                    ) : (
                                                        <button disabled className={styles.navButton} style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                            Complete Assignment to Proceed
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : lessons.length === 0 ? (
                        <div className={styles.noContent}>
                            <h2>No Lessons Available</h2>
                            <p>This course content is not available yet.</p>
                            <button onClick={() => router.push('/candidate/my-courses')} className={styles.finishButton}>
                                Return to Dashboard
                            </button>
                        </div>
                    ) : (
                        <div className={styles.noContent}>
                            <h2>🎉 Course Completed!</h2>
                            <p>You have successfully finished all modules.</p>
                            <button onClick={() => router.push('/candidate/my-courses')} className={styles.finishButton}>
                                Return to Dashboard
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Start Course Confirmation Dialog */}
            {showConfirmDialog && !loading && !isCourseCompleted && (
                <div className={styles.confirmDialog}>
                    <div className={styles.confirmCard}>
                        <h2 className={styles.confirmTitle}>Start Course</h2>
                        <p className={styles.confirmText}>
                            Are you ready to begin <strong>{lessons[0]?.title || 'this course'}</strong>?
                        </p>
                        <div className={styles.confirmButtons}>
                            <button onClick={handleCancelStart} className={styles.cancelButton}>
                                Cancel
                            </button>
                            <button onClick={handleConfirmStart} className={styles.startButton}>
                                Start Learning
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
