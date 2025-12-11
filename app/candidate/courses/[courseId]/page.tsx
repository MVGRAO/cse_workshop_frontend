'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getStudentCourseDetails } from '@/lib/api';
import PrivateRoute from '@/components/PrivateRoute';
import { useToast } from '@/components/common/ToastProvider';

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
    const [selectedModule, setSelectedModule] = useState<Module | null>(null);

    // Assignment state
    const [answers, setAnswers] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        fetchCourseContent();
    }, []);

    const fetchCourseContent = async () => {
        try {
            setLoading(true);
            const response = await getStudentCourseDetails(params.courseId);

            if (response.success && response.data) {
                // response.data is Array of Lessons with modules
                // Data format from controller: [{ lessonId, title, ... modules: [...] }]
                // Actually response.data might be the array directly or wrapped. 
                // Controller returns: success(res, 'Lessons with modules retrieved', lessonMap);
                // lessonMap is Array.

                const lessonsData = response.data;
                setLessons(lessonsData);

                // Select first module if available
                if (lessonsData.length > 0 && lessonsData[0].modules.length > 0) {
                    setSelectedModule(lessonsData[0].modules[0]);
                }
            }
        } catch (error: any) {
            console.error('Error loading course content:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load course content',
                variant: 'error',
            });
            // Redirect back if error (e.g. not enrolled)
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

    const handleModuleSelect = (module: Module) => {
        setSelectedModule(module);
        window.scrollTo(0, 0);
    };

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmitAssignment = () => {
        // TODO: Implement submission API
        console.log('Submitting answers:', answers);
        toast({
            title: 'Submitted',
            description: 'Assignment submitted successfully (Simulation)',
            variant: 'success'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <PrivateRoute allowedRoles={['student']}>
            <div className="flex h-screen bg-gray-100 overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 bg-white shadow-md flex-shrink-0 overflow-y-auto z-10">
                    <div className="p-4 border-b">
                        <button
                            onClick={() => router.push('/candidate/my-courses')}
                            className="text-sm text-gray-500 hover:text-gray-900 mb-2 block"
                        >
                            ← Back to My Courses
                        </button>
                        <h2 className="font-bold text-lg text-gray-800">Course Content</h2>
                    </div>

                    <div className="p-2">
                        {lessons.map((lesson, lIdx) => (
                            <div key={lesson.lessonId} className="mb-4">
                                <h3 className="px-2 py-1 font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                    {lIdx + 1}. {lesson.title}
                                </h3>
                                <div className="mt-1 space-y-1">
                                    {lesson.modules.map((module, mIdx) => (
                                        <button
                                            key={module._id}
                                            onClick={() => handleModuleSelect(module)}
                                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedModule?._id === module._id
                                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-start">
                                                <span className="mr-2 text-xs mt-1 bg-gray-200 text-gray-600 rounded px-1 min-w-[20px] text-center">
                                                    {mIdx + 1}
                                                </span>
                                                <span>{module.title}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {lessons.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No content available yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    {selectedModule ? (
                        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm min-h-[500px]">
                            {/* Video Player */}
                            {selectedModule.videoUrl && (
                                <div className="aspect-video w-full bg-black rounded-t-lg overflow-hidden relative group">
                                    <iframe
                                        src={selectedModule.videoUrl.replace('watch?v=', 'embed/')}
                                        className="w-full h-full"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        title={selectedModule.title}
                                    />
                                </div>
                            )}

                            <div className="p-8">
                                <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedModule.title}</h1>

                                {/* Description */}
                                {selectedModule.description && (
                                    <div className="prose max-w-none text-gray-700 mb-8 whitespace-pre-wrap">
                                        {selectedModule.description}
                                    </div>
                                )}

                                {/* Assignment */}
                                {selectedModule.assignment && selectedModule.assignment.questions && selectedModule.assignment.questions.length > 0 && (
                                    <div className="mt-8 border-t pt-8">
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                                            <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded mr-2">Assignment</span>
                                            knowledge Check
                                        </h2>

                                        <div className="space-y-8">
                                            {selectedModule.assignment.questions.map((q, idx) => (
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
                                                            rows={4}
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
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Select a module from the sidebar to start learning.
                        </div>
                    )}
                </div>
            </div>
        </PrivateRoute>
    );
}
