'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentCourseDetails, startSubmission, submitAssignment, authenticatedFetch, getAuthToken, getStudentEnrollments, completeEnrollment } from '@/lib/api';
import PrivateRoute from '@/components/PrivateRoute';
import { useToast } from '@/components/common/ToastProvider';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

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

interface PageProps {
    params: Promise<{ courseId: string }>;
}

export default function CoursePlayerPage(props: PageProps) {
    const params = use(props.params);
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
                const enrollment = enrollments.data.find((e: any) => e.course._id === params.courseId);
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
            const response = await getStudentCourseDetails(params.courseId);

            if (response.success && response.data) {
                // response.data is the array of lessons with modules
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
            // Convert answers to submission format
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

            // Mark module as completed
            const moduleId = module._id;
            setModuleCompleted(prev => new Set([...prev, moduleId]));

            // Exit assignment mode
            setAssignmentMode(false);
            setAnswers({});
            setSubmissionId(null);

            // Move to next module or lesson
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
        
        // Check if there are more modules in current lesson
        if (currentModuleIndex < currentLesson.modules.length - 1) {
            setCurrentModuleIndex(currentModuleIndex + 1);
        } else {
            // Move to next lesson
            if (currentLessonIndex < lessons.length - 1) {
                setCurrentLessonIndex(currentLessonIndex + 1);
                setCurrentModuleIndex(0);
            } else {
                // Course completed!
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

            // Mark enrollment as completed
            await completeEnrollment(enrollmentId);

            toast({
                title: 'Congratulations! 🎉',
                description: 'You have completed all course modules! Your course will now be reviewed by your verifier.',
                variant: 'success',
            });

            // Redirect to dashboard after a delay
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
            <PrivateRoute allowedRoles={['student']}>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </PrivateRoute>
        );
    }

    // Confirm start dialog
    if (showConfirmDialog) {
        return (
            <PrivateRoute allowedRoles={['student']}>
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Start Course</h2>
                        <p className="text-gray-600 mb-6">
                            You are about to start this course. Once started, you must complete all modules and assignments in sequence.
                            You cannot skip ahead or go back to previous modules.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={handleCancelStart}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmStart}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Start Course
                            </button>
                        </div>
                    </div>
                </div>
            </PrivateRoute>
        );
    }

    // Fullscreen assignment mode
    if (assignmentMode && getCurrentModule()?.assignment) {
        const module = getCurrentModule()!;
        const assignment = module.assignment!;

        return (
            <PrivateRoute allowedRoles={['student']}>
                <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
                    <div className="max-w-4xl mx-auto p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Assignment: {module.title}</h1>
                            <button
                                onClick={handleExitAssignment}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Exit Assignment
                            </button>
                        </div>

                        <div className="space-y-8">
                            {assignment.questions.map((q, idx) => (
                                <div key={q._id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                    <div className="flex justify-between mb-4">
                                        <h3 className="font-semibold text-gray-800">Question {idx + 1}</h3>
                                        <span className="text-sm text-gray-500">{q.maxMarks} marks</span>
                                    </div>
                                    <p className="text-gray-700 mb-4 text-lg">{q.questionText}</p>

                                    {q.qType === 'mcq' && q.options && (
                                        <div className="space-y-3">
                                            {q.options.map((opt, optIdx) => (
                                                <label key={optIdx} className="flex items-start p-3 bg-white border rounded cursor-pointer hover:bg-blue-50 transition-colors">
                                                    <input
                                                        type="radio"
                                                        name={`q_${q._id}`}
                                                        className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                                                        onChange={() => handleAnswerChange(q._id, optIdx)}
                                                        checked={answers[q._id] === optIdx}
                                                    />
                                                    <span className="text-gray-700">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {(q.qType === 'short' || q.qType === 'code') && (
                                        <textarea
                                            className="w-full p-4 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows={6}
                                            placeholder="Type your answer here..."
                                            onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                            value={answers[q._id] || ''}
                                        />
                                    )}
                                </div>
                            ))}

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSubmitAssignment}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-shadow shadow-md"
                                >
                                    Submit Assignment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </PrivateRoute>
        );
    }

    // Normal course view (no sidebar, sequential)
    const currentModule = getCurrentModule();
    const currentLesson = lessons[currentLessonIndex];

    return (
        <PrivateRoute allowedRoles={['student']}>
            <div className="min-h-screen bg-gray-100">
                {/* Header - no sidebar, just back button */}
                <div className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                        <div>
                            <button
                                onClick={() => router.push('/candidate/my-courses')}
                                className="text-sm text-gray-500 hover:text-gray-900 mb-1"
                            >
                                ← Back to My Courses
                            </button>
                            <h2 className="font-bold text-lg text-gray-800">
                                Lesson {currentLessonIndex + 1} of {lessons.length}: {currentLesson?.title}
                            </h2>
                            <p className="text-sm text-gray-600">
                                Module {currentModuleIndex + 1} of {currentLesson?.modules.length}
                            </p>
                        </div>
                        <div className="text-sm text-gray-600">
                            Progress: {Math.round(((currentLessonIndex * 100 + ((currentModuleIndex + 1) / (currentLesson?.modules.length || 1)) * 100) / lessons.length))}%
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-5xl mx-auto p-8">
                    {currentModule ? (
                        <div className="bg-white rounded-lg shadow-sm">
                            {/* Video Player */}
                            {currentModule.videoUrl && (
                                <div className="aspect-video w-full bg-black rounded-t-lg overflow-hidden">
                                    <iframe
                                        src={currentModule.videoUrl.replace('watch?v=', 'embed/')}
                                        className="w-full h-full"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        title={currentModule.title}
                                    />
                                </div>
                            )}

                            <div className="p-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentModule.title}</h1>

                                {/* Description */}
                                {currentModule.description && (
                                    <div className="prose max-w-none text-gray-700 mb-8 whitespace-pre-wrap">
                                        {currentModule.description}
                                    </div>
                                )}

                                {/* Start Assignment Button */}
                                {currentModule.assignment && currentModule.assignment.questions && currentModule.assignment.questions.length > 0 && !moduleCompleted.has(currentModule._id) && (
                                    <div className="mt-8 border-t pt-8">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 mb-2">Assignment</h2>
                                                <p className="text-gray-600">
                                                    {currentModule.assignment.questions.length} question(s) • {currentModule.assignment.maxScore || 'N/A'} total marks
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleStartAssignment}
                                                className="bg-purple-600 text-white px-6 py-3 rounded-md font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-shadow shadow-md"
                                            >
                                                Start Assignment
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Assignment Completed Message */}
                                {currentModule.assignment && moduleCompleted.has(currentModule._id) && (
                                    <div className="mt-8 border-t pt-8">
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <p className="text-green-800 font-medium">✓ Assignment completed! You can proceed to the next module.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Next Module/Complete Course Button (if no assignment) */}
                                {(!currentModule.assignment || currentModule.assignment.questions.length === 0) && (
                                    <div className="mt-8 flex justify-end">
                                        {currentLessonIndex === lessons.length - 1 && currentModuleIndex === currentLesson.modules.length - 1 ? (
                                            <button
                                                onClick={moveToNext}
                                                className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700"
                                            >
                                                Complete Course ✓
                                            </button>
                                        ) : (
                                            <button
                                                onClick={moveToNext}
                                                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
                                            >
                                                Continue to Next Module →
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Next button after assignment completion */}
                                {moduleCompleted.has(currentModule._id) && currentModule.assignment && (
                                    <div className="mt-8 flex justify-end">
                                        {currentLessonIndex === lessons.length - 1 && currentModuleIndex === currentLesson.modules.length - 1 ? (
                                            <button
                                                onClick={moveToNext}
                                                className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700"
                                            >
                                                Complete Course ✓
                                            </button>
                                        ) : (
                                            <button
                                                onClick={moveToNext}
                                                className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
                                            >
                                                Next Module →
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <p className="text-gray-500">Course completed!</p>
                        </div>
                    )}
                </div>
            </div>
        </PrivateRoute>
    );
}
