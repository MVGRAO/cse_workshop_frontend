'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentCourseDetails, startSubmission, submitAssignment, getStudentEnrollments, completeEnrollment } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/courseplayer.module.scss';

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
    const [assignmentMode, setAssignmentMode] = useState(false);
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<{ [key: string]: any }>({});
    const [moduleCompleted, setModuleCompleted] = useState<Set<string>>(new Set());
    const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

    useEffect(() => {
        fetchCourseContent();
        fetchEnrollmentId();
    }, []);

    const fetchEnrollmentId = async () => {
        try {
            const enrollments = await getStudentEnrollments();
            if (enrollments.success && enrollments.data) {
                const enrollment = enrollments.data.find((e: any) => e.course._id === courseId);
                if (enrollment) {
                    setEnrollmentId(enrollment._id);
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
                const lessonsData = Array.isArray(response.data) ? response.data : [];
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

    const handleConfirmStart = () => {
        setShowConfirmDialog(false);
        setCourseStarted(true);
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
        
        if (currentModuleIndex < currentLesson.modules.length - 1) {
            setCurrentModuleIndex(currentModuleIndex + 1);
        } else {
            if (currentLessonIndex < lessons.length - 1) {
                setCurrentLessonIndex(currentLessonIndex + 1);
                setCurrentModuleIndex(0);
            } else {
                handleCourseComplete();
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
                <p className={styles.loadingText}>Loading course...</p>
            </div>
        );
    }

    if (showConfirmDialog) {
        return (
            <div className={styles.confirmDialog}>
                <div className={styles.confirmCard}>
                    <h2 className={styles.confirmTitle}>Start Course</h2>
                    <p className={styles.confirmText}>
                        You are about to start this course. Once started, you must complete all modules and assignments in sequence.
                        You cannot skip ahead or go back to previous modules.
                    </p>
                    <div className={styles.confirmButtons}>
                        <button onClick={handleCancelStart} className={styles.cancelButton}>
                            Cancel
                        </button>
                        <button onClick={handleConfirmStart} className={styles.startButton}>
                            Start Course
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (assignmentMode && getCurrentModule()?.assignment) {
        const module = getCurrentModule()!;
        const assignment = module.assignment!;

        return (
            <div className={styles.assignmentFullscreen}>
                <div className={styles.assignmentContainer}>
                    <div className={styles.assignmentHeader}>
                        <h1 className={styles.assignmentTitle}>Assignment: {module.title}</h1>
                        <button onClick={handleExitAssignment} className={styles.exitButton}>
                            Exit Assignment
                        </button>
                    </div>

                    <div className={styles.questionsContainer}>
                        {assignment.questions.map((q, idx) => (
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
            </div>
        );
    }

    const currentModule = getCurrentModule();
    const currentLesson = lessons[currentLessonIndex];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <div>
                        <button onClick={() => router.push('/candidate/my-courses')} className={styles.backButton}>
                            ← Back to My Courses
                        </button>
                        <h2 className={styles.lessonTitle}>
                            Lesson {currentLessonIndex + 1} of {lessons.length}: {currentLesson?.title}
                        </h2>
                        <p className={styles.moduleInfo}>
                            Module {currentModuleIndex + 1} of {currentLesson?.modules.length}
                        </p>
                    </div>
                    <div className={styles.progress}>
                        Progress: {Math.round(((currentLessonIndex * 100 + ((currentModuleIndex + 1) / (currentLesson?.modules.length || 1)) * 100) / lessons.length))}%
                    </div>
                </div>
            </div>

            <div className={styles.mainContent}>
                {currentModule ? (
                    <div className={styles.moduleCard}>
                        {currentModule.videoUrl && (
                            <div className={styles.videoContainer}>
                                <iframe
                                    src={currentModule.videoUrl.replace('watch?v=', 'embed/')}
                                    className={styles.videoIframe}
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    title={currentModule.title}
                                />
                            </div>
                        )}

                        <div className={styles.moduleContent}>
                            <h1 className={styles.moduleTitle}>{currentModule.title}</h1>

                            {currentModule.description && (
                                <div className={styles.moduleDescription}>
                                    {currentModule.description}
                                </div>
                            )}

                            {currentModule.assignment && currentModule.assignment.questions && currentModule.assignment.questions.length > 0 && !moduleCompleted.has(currentModule._id) && (
                                <div className={styles.assignmentSection}>
                                    <div className={styles.assignmentInfo}>
                                        <div>
                                            <h2 className={styles.assignmentHeading}>Assignment</h2>
                                            <p className={styles.assignmentDetails}>
                                                {currentModule.assignment.questions.length} question(s) • {currentModule.assignment.maxScore || 'N/A'} total marks
                                            </p>
                                        </div>
                                        <button onClick={handleStartAssignment} className={styles.startAssignmentButton}>
                                            Start Assignment
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {currentModule.assignment && moduleCompleted.has(currentModule._id) && (
                                <div className={styles.completedSection}>
                                    <div className={styles.completedMessage}>
                                        <p>✓ Assignment completed! You can proceed to the next module.</p>
                                    </div>
                                </div>
                            )}

                            {(!currentModule.assignment || currentModule.assignment.questions.length === 0) && (
                                <div className={styles.navigationButtons}>
                                    {currentLessonIndex === lessons.length - 1 && currentModuleIndex === currentLesson.modules.length - 1 ? (
                                        <button onClick={moveToNext} className={styles.completeButton}>
                                            Complete Course ✓
                                        </button>
                                    ) : (
                                        <button onClick={moveToNext} className={styles.continueButton}>
                                            Continue to Next Module →
                                        </button>
                                    )}
                                </div>
                            )}

                            {moduleCompleted.has(currentModule._id) && currentModule.assignment && (
                                <div className={styles.navigationButtons}>
                                    {currentLessonIndex === lessons.length - 1 && currentModuleIndex === currentLesson.modules.length - 1 ? (
                                        <button onClick={moveToNext} className={styles.completeButton}>
                                            Complete Course ✓
                                        </button>
                                    ) : (
                                        <button onClick={moveToNext} className={styles.continueButton}>
                                            Next Module →
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.noContent}>
                        <p>Course completed!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
