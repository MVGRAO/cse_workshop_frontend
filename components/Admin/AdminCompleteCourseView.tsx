'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';
import { Loader2, ArrowLeft, ChevronDown, ChevronUp, FileText, PlayCircle, CheckCircle, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '@/styles/courseDetails.module.scss'; // Reusing existing styles or create specific ones
import markdownStyles from '@/styles/markdown.module.scss';

// Inline simple styles to avoid creating another SCSS file if possible, or reuse
const viewStyles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    header: {
        marginBottom: '2rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '1rem',
    },
    section: {
        marginBottom: '2rem',
        backgroundColor: '#fff',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
    },
    lessonTitle: {
        fontSize: '1.5rem',
        fontWeight: 700,
        marginBottom: '1rem',
        color: '#111827',
    },
    moduleCard: {
        marginBottom: '1.5rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.5rem',
        overflow: 'hidden',
    },
    moduleHeader: {
        background: '#f9fafb',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        borderBottom: '1px solid #e5e7eb',
    },
    moduleContent: {
        padding: '1.5rem',
        backgroundColor: '#fff',
    },
    tag: {
        display: 'inline-block',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        marginLeft: '0.5rem',
    },
    video: {
        backgroundColor: '#e0f2fe',
        color: '#0284c7',
    },
    reading: {
        backgroundColor: '#fef3c7',
        color: '#d97706',
    },
    assignment: {
        backgroundColor: '#f3e8ff',
        color: '#9333ea',
    },
    questionCard: {
        backgroundColor: '#f8fafc',
        padding: '1rem',
        marginBottom: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
    },
    correctAnswer: {
        marginTop: '0.5rem',
        padding: '0.5rem',
        backgroundColor: '#d1fae5',
        color: '#065f46',
        borderRadius: '0.25rem',
        fontSize: '0.9rem',
        fontWeight: 500,
    }
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function AdminCompleteCourseView({ courseId }: { courseId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [courseData, setCourseData] = useState<any>(null);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = getAuthToken('admin');
                const res = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setCourseData(data.data);
                        // Auto-expand all modules initially or just the first lesson?
                        // Let's collapse by default to avoid clutter
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) fetchDetails();
    }, [courseId]);

    const toggleModule = (moduleId: string) => {
        const newSet = new Set(expandedModules);
        if (newSet.has(moduleId)) {
            newSet.delete(moduleId);
        } else {
            newSet.add(moduleId);
        }
        setExpandedModules(newSet);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Loading course content...</p>
            </div>
        );
    }

    if (!courseData) {
        return <div className="p-8 text-center">Course not found</div>;
    }

    const { course, lessons } = courseData;

    return (
        <div style={viewStyles.container}>
            <div style={viewStyles.header}>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-gray-500 mt-2">Complete Course Overview (Instructor View)</p>
            </div>

            <div style={viewStyles.section}>
                <h2 className="text-xl font-bold mb-4">Description</h2>
                <div className={`${styles.description} ${markdownStyles.markdownContent}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {course.description}
                    </ReactMarkdown>
                </div>
            </div>

            <div className="space-y-8">
                {lessons.map((lesson: any, lIdx: number) => (
                    <div key={lesson._id} style={{ ...viewStyles.section, padding: 0, overflow: 'hidden' }}>
                        <div className="p-6 bg-gray-50 border-b border-gray-200">
                            <h2 style={viewStyles.lessonTitle}>Lesson {lIdx + 1}: {lesson.title}</h2>
                            {lesson.description && <p className="text-gray-600">{lesson.description}</p>}
                        </div>

                        <div className="p-6 bg-white space-y-4">
                            {lesson.modules.map((module: any, mIdx: number) => {
                                const isExpanded = expandedModules.has(module._id);
                                const hasAssignment = !!module.assignment;

                                return (
                                    <div key={module._id} style={viewStyles.moduleCard}>
                                        <div
                                            style={viewStyles.moduleHeader}
                                            onClick={() => toggleModule(module._id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {module.videoUrl ? <PlayCircle size={20} color="#0284c7" /> : hasAssignment ? <HelpCircle size={20} color="#9333ea" /> : <FileText size={20} color="#d97706" />}
                                                <span className="font-semibold text-gray-700">{module.title}</span>
                                                {module.videoUrl && <span style={{ ...viewStyles.tag, ...viewStyles.video }}>Video</span>}
                                                {!module.videoUrl && !hasAssignment && <span style={{ ...viewStyles.tag, ...viewStyles.reading }}>Reading</span>}
                                                {hasAssignment && <span style={{ ...viewStyles.tag, ...viewStyles.assignment }}>Assignment</span>}
                                            </div>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>

                                        {isExpanded && (
                                            <div style={viewStyles.moduleContent}>
                                                {/* Content */}
                                                {module.videoUrl && (
                                                    <div className="mb-4">
                                                        <span className="text-sm font-semibold text-gray-500 block mb-1">Video URL:</span>
                                                        <a href={module.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                                            {module.videoUrl}
                                                        </a>
                                                    </div>
                                                )}

                                                {module.description && (
                                                    <div className={`mb-6 p-4 bg-gray-50 rounded-md ${markdownStyles.markdownContent}`}>
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{module.description}</ReactMarkdown>
                                                    </div>
                                                )}

                                                {/* Assignment */}
                                                {hasAssignment && (
                                                    <div className="mt-6 border-t pt-6">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                            <CheckCircle size={20} className="text-green-600" />
                                                            Assignment ({module.assignment.maxScore} Marks)
                                                        </h3>

                                                        <div className="space-y-4">
                                                            {module.assignment.questions?.map((q: any, qIdx: number) => (
                                                                <div key={q._id || qIdx} style={viewStyles.questionCard}>
                                                                    <div className="flex justify-between mb-2">
                                                                        <span className="font-bold text-gray-700">Question {qIdx + 1}</span>
                                                                        <span className="text-sm text-gray-500">{q.maxMarks} Marks</span>
                                                                    </div>
                                                                    <p className="mb-3 text-gray-800">{q.questionText}</p>

                                                                    {q.qType === 'mcq' && (
                                                                        <div className="pl-4 border-l-2 border-gray-200">
                                                                            <p className="text-xs font-semibold text-gray-500 mb-2">Options:</p>
                                                                            <ul className="list-disc pl-5 space-y-1">
                                                                                {q.options.map((opt: string, oIdx: number) => (
                                                                                    <li key={oIdx} className={q.correctOptionIndex === oIdx ? 'text-green-700 font-medium' : 'text-gray-600'}>
                                                                                        {opt} {q.correctOptionIndex === oIdx && '(Correct)'}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                            {q.correctOptionIndex !== undefined && (
                                                                                <div style={viewStyles.correctAnswer}>
                                                                                    Correct Answer: Option {q.correctOptionIndex + 1}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {q.qType !== 'mcq' && q.answerExplanation && (
                                                                        <div style={viewStyles.correctAnswer}>
                                                                            Expected Answer / Key: {q.answerExplanation}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
