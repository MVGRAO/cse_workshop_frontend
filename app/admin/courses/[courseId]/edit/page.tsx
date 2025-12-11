'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    getCourseDetails,
    updateCourse,
    updateLesson,
    createLesson,
    updateModule,
    createModule,
    createAssignment,
    updateAssignment
} from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '../../../admin.module.scss'; // Assuming reuse of admin styles

interface Question {
    _id?: string;
    qType: 'mcq' | 'short' | 'code';
    questionText: string;
    options?: string[];
    correctOptionIndex?: number;
    answerText?: string;
    maxMarks: number;
}

interface AssignmentData {
    _id?: string;
    questions: Question[];
    maxScore?: number;
}

interface ModuleData {
    _id?: string;
    title: string;
    description: string;
    videoUrl: string;
    assignment: AssignmentData;
}

interface LessonData {
    _id?: string;
    title: string;
    numModules: number;
    modules: ModuleData[];
}

interface PageProps {
    params: Promise<{ courseId: string }>;
}

export default function CourseEditPage(props: PageProps) {
    const params = use(props.params);
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Course data
    const [courseData, setCourseData] = useState<any>(null);
    const [courseName, setCourseName] = useState('');
    const [courseCode, setCourseCode] = useState('');
    const [numLessons, setNumLessons] = useState(1);

    // Lesson and module data
    const [lessons, setLessons] = useState<LessonData[]>([]);

    // Navigation
    const [currentStep, setCurrentStep] = useState<'course' | 'lesson-setup' | 'module' | 'complete'>('course');
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

    useEffect(() => {
        fetchCourseData();
    }, []);

    const fetchCourseData = async () => {
        try {
            setLoading(true);
            const response = await getCourseDetails(params.courseId);

            if (response.success && response.data) {
                const { course, lessons: fetchedLessons } = response.data;
                setCourseData(course);
                setCourseName(course.title);
                setCourseCode(course.code);

                // Map fetched lessons to state structure
                const mappedLessons = fetchedLessons.map((l: any) => ({
                    _id: l._id,
                    title: l.title,
                    numModules: l.modules.length || 1, // Ensure at least 1 for logic
                    modules: l.modules.map((m: any) => ({
                        _id: m._id,
                        title: m.title,
                        description: m.description || '',
                        videoUrl: m.videoUrl || '',
                        assignment: {
                            _id: m.assignment?._id,
                            questions: m.assignment?.questions?.map((q: any) => ({
                                _id: q._id,
                                qType: q.qType,
                                questionText: q.questionText,
                                options: q.options || ['', '', '', ''],
                                correctOptionIndex: q.correctOptionIndex,
                                answerText: q.answerText || '',
                                maxMarks: q.maxMarks || 10
                            })) || [{
                                qType: 'mcq' as const,
                                questionText: '',
                                options: ['', '', '', ''],
                                correctOptionIndex: 0,
                                answerText: '',
                                maxMarks: 10
                            }]
                        }
                    }))
                }));

                // If no lessons, initialize empty
                if (mappedLessons.length === 0) {
                    setNumLessons(1);
                    setLessons([]);
                } else {
                    setNumLessons(mappedLessons.length);
                    setLessons(mappedLessons);
                }
            }
        } catch (error: any) {
            console.error('Error fetching course:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load course details',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers (Reuse logic mainly) ---

    const handleCourseNext = async () => {
        if (!courseName.trim() || !courseCode.trim() || numLessons < 1) {
            toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'error' });
            return;
        }

        try {
            setIsSubmitting(true);
            // Update basic course details immediately
            await updateCourse(params.courseId, {
                title: courseName,
                code: courseCode.toUpperCase(),
            });

            // Initialize lessons array if growing
            if (lessons.length < numLessons) {
                const newLessons = [...lessons];
                for (let i = lessons.length; i < numLessons; i++) {
                    newLessons.push({
                        title: '',
                        numModules: 1,
                        modules: []
                    });
                }
                setLessons(newLessons);
            } else if (lessons.length > numLessons) {
                // Warning: reducing lessons might lose data. For now, just slice (backend won't delete unless we explicitly do, but we are just updating structure in memory first)
                // Ideally verify deletion.
                setLessons(lessons.slice(0, numLessons));
            }

            setCurrentStep('lesson-setup');
            setCurrentLessonIndex(0);
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLessonSetup = (field: string, value: any) => {
        const updatedLessons = [...lessons];

        if (field === 'title') {
            updatedLessons[currentLessonIndex].title = value;
        } else if (field === 'numModules') {
            const num = Math.max(1, parseInt(value) || 1);
            updatedLessons[currentLessonIndex].numModules = num;

            const currentModules = updatedLessons[currentLessonIndex].modules;
            if (currentModules.length < num) {
                // Add modules
                for (let i = currentModules.length; i < num; i++) {
                    currentModules.push({
                        title: '',
                        description: '',
                        videoUrl: '',
                        assignment: {
                            questions: [{
                                qType: 'mcq' as const,
                                questionText: '',
                                options: ['', '', '', ''],
                                correctOptionIndex: 0,
                                answerText: '',
                                maxMarks: 10,
                            }],
                        },
                    });
                }
            } else if (currentModules.length > num) {
                updatedLessons[currentLessonIndex].modules = currentModules.slice(0, num);
            }
        }
        setLessons(updatedLessons);
    };

    const handleLessonSetupNext = () => {
        if (!lessons[currentLessonIndex].title.trim()) {
            toast({ title: 'Error', description: 'Lesson title required', variant: 'error' });
            return;
        }

        // Ensure modules are initialized
        const lesson = lessons[currentLessonIndex];
        if (lesson.modules.length === 0) {
            const updatedLessons = [...lessons];
            updatedLessons[currentLessonIndex].modules = Array.from({ length: lesson.numModules }, () => ({
                title: '',
                description: '',
                videoUrl: '',
                assignment: {
                    questions: [{
                        qType: 'mcq',
                        questionText: '',
                        options: ['', '', '', ''],
                        correctOptionIndex: 0,
                        answerText: '',
                        maxMarks: 10,
                    }]
                }
            }));
            setLessons(updatedLessons);
        }

        setCurrentModuleIndex(0);
        setCurrentStep('module');
    };

    const handleModuleChange = (field: string, value: any) => {
        const updatedLessons = [...lessons];
        const module = updatedLessons[currentLessonIndex].modules[currentModuleIndex];
        if (field === 'title') module.title = value;
        else if (field === 'description') module.description = value;
        else if (field === 'videoUrl') module.videoUrl = value;
        setLessons(updatedLessons);
    };

    const handleQuestionChange = (qIndex: number, field: string, value: any) => {
        const updatedLessons = [...lessons];
        const q = updatedLessons[currentLessonIndex].modules[currentModuleIndex].assignment.questions[qIndex];

        if (field === 'questionText') q.questionText = value;
        else if (field === 'qType') {
            q.qType = value;
            if (value === 'mcq' && !q.options) q.options = ['', '', '', ''];
        }
        else if (field === 'maxMarks') q.maxMarks = parseInt(value) || 0;
        else if (field === 'correctOptionIndex') q.correctOptionIndex = parseInt(value);
        else if (field === 'answerText') q.answerText = value;
        else if (field.startsWith('option_')) {
            const idx = parseInt(field.split('_')[1]);
            if (q.options) q.options[idx] = value;
        }
        setLessons(updatedLessons);
    };

    const addQuestion = () => {
        const updatedLessons = [...lessons];
        updatedLessons[currentLessonIndex].modules[currentModuleIndex].assignment.questions.push({
            qType: 'mcq' as const,
            questionText: '',
            options: ['', '', '', ''],
            correctOptionIndex: 0,
            answerText: '',
            maxMarks: 10,
        });
        setLessons(updatedLessons);
    };

    const removeQuestion = (index: number) => {
        const updatedLessons = [...lessons];
        updatedLessons[currentLessonIndex].modules[currentModuleIndex].assignment.questions.splice(index, 1);
        setLessons(updatedLessons);
    };

    const handleModuleNext = async () => {
        const module = lessons[currentLessonIndex].modules[currentModuleIndex];
        if (!module.title.trim()) {
            toast({ title: 'Error', description: 'Module title required', variant: 'error' });
            return;
        }

        const lesson = lessons[currentLessonIndex];

        // Logic for next navigation (same as creation)
        if (currentModuleIndex < lesson.modules.length - 1) {
            setCurrentModuleIndex(currentModuleIndex + 1);
        } else if (currentLessonIndex < lessons.length - 1) {
            setCurrentLessonIndex(currentLessonIndex + 1);
            setCurrentStep('lesson-setup');
        } else {
            setCurrentStep('complete');
            await handleCompleteUpdate();
        }
    };

    const handleCompleteUpdate = async () => {
        setIsSubmitting(true);
        try {
            console.log('Updating entire course...');

            for (let lIdx = 0; lIdx < lessons.length; lIdx++) {
                const lesson = lessons[lIdx];
                let lessonId = lesson._id;

                // Update or Create Lesson
                if (lessonId) {
                    await updateLesson(lessonId, {
                        title: lesson.title,
                        index: lIdx + 1 // Ensure index is correct
                    });
                } else {
                    const res = await createLesson(params.courseId, {
                        index: lIdx + 1,
                        title: lesson.title
                    });
                    if (!res.success) throw new Error('Failed to create lesson');
                    lessonId = res.data._id;
                    // Update state ID
                    const newLessons = [...lessons];
                    newLessons[lIdx]._id = lessonId;
                    setLessons(newLessons);
                }

                // Modules
                for (let mIdx = 0; mIdx < lesson.modules.length; mIdx++) {
                    const module = lesson.modules[mIdx];
                    let moduleId = module._id;

                    const modulePayload = {
                        index: mIdx + 1,
                        title: module.title,
                        description: module.description,
                        videoUrl: module.videoUrl,
                        textContent: module.description,
                    };

                    if (moduleId) {
                        await updateModule(moduleId, modulePayload);
                    } else {
                        const res = await createModule(lessonId!, modulePayload);
                        if (!res.success) throw new Error('Failed to create module');
                        moduleId = res.data._id;
                    }

                    // Assignment
                    const hasQuestions = module.assignment.questions.length > 0 && module.assignment.questions[0].questionText.trim();
                    if (hasQuestions) {
                        const assignmentPayload = {
                            course: params.courseId,
                            module: moduleId,
                            type: 'theory',
                            questions: module.assignment.questions.map(q => ({
                                qType: q.qType,
                                questionText: q.questionText,
                                options: q.options,
                                correctOptionIndex: q.correctOptionIndex,
                                answerText: q.answerText,
                                maxMarks: q.maxMarks
                            })),
                            maxScore: module.assignment.questions.reduce((sum, q) => sum + q.maxMarks, 0),
                        };

                        if (module.assignment._id) {
                            await updateAssignment(module.assignment._id, assignmentPayload);
                        } else {
                            const res = await createAssignment(assignmentPayload as any);
                            if (res.success) {
                                // Link to module if created
                                await updateModule(moduleId!, { assignment: res.data._id });
                            }
                        }
                    }
                }
            }

            toast({ title: 'Success', description: 'Course updated successfully!', variant: 'success' });
            router.push('/admin');

        } catch (error: any) {
            console.error(error);
            toast({ title: 'Error', description: error.message, variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;

    // --- Render (Simplified for brevity, similar to existing) ---

    const currentLesson = lessons[currentLessonIndex];
    const currentModule = currentLesson?.modules?.[currentModuleIndex];

    return (
        <div className={styles.dashboard}>
            <div className={styles.courseForm}>
                {currentStep === 'course' && (
                    <>
                        <h2 className={styles.formTitle}>Update Course Details</h2>
                        <div className={styles.formSection}>
                            <div className={styles.formGroup}>
                                <label>Course Name</label>
                                <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} disabled={isSubmitting} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Course Code</label>
                                <input type="text" value={courseCode} onChange={e => setCourseCode(e.target.value.toUpperCase())} disabled={isSubmitting} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Number of Lessons</label>
                                <input type="number" value={numLessons} onChange={e => setNumLessons(parseInt(e.target.value))} min="1" disabled={isSubmitting} />
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button onClick={() => router.back()} className={styles.cancelButton}>Cancel</button>
                            <button onClick={handleCourseNext} className={styles.nextButton}>Next</button>
                        </div>
                    </>
                )}

                {currentStep === 'lesson-setup' && (
                    <>
                        <h2 className={styles.formTitle}>Lesson {currentLessonIndex + 1}</h2>
                        <div className={styles.formSection}>
                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input type="text" value={currentLesson.title} onChange={e => handleLessonSetup('title', e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Modules</label>
                                <input type="number" value={currentLesson.numModules} onChange={e => handleLessonSetup('numModules', e.target.value)} min="1" />
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button onClick={() => currentLessonIndex > 0 ? setCurrentLessonIndex(currentLessonIndex - 1) : setCurrentStep('course')} className={styles.cancelButton}>Back</button>
                            <button onClick={handleLessonSetupNext} className={styles.nextButton}>Next</button>
                        </div>
                    </>
                )}

                {currentStep === 'module' && currentModule && (
                    <>
                        <h2 className={styles.formTitle}>Module {currentLessonIndex + 1}.{currentModuleIndex + 1}</h2>
                        <div className={styles.formSection}>
                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input type="text" value={currentModule.title} onChange={e => handleModuleChange('title', e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description (Markdown)</label>
                                <textarea value={currentModule.description} onChange={e => handleModuleChange('description', e.target.value)} rows={5} className={styles.textarea} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Video URL</label>
                                <input type="text" value={currentModule.videoUrl} onChange={e => handleModuleChange('videoUrl', e.target.value)} />
                            </div>
                        </div>

                        <div className={styles.assignmentSection}>
                            <h3>Assignment</h3>
                            {currentModule.assignment.questions.map((q, idx) => (
                                <div key={idx} className={styles.questionCard} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h4>Question {idx + 1}</h4>
                                        <button onClick={() => removeQuestion(idx)} style={{ color: 'red' }}>Remove</button>
                                    </div>
                                    <select value={q.qType} onChange={e => handleQuestionChange(idx, 'qType', e.target.value)} className={styles.selectInput}>
                                        <option value="mcq">MCQ</option>
                                        <option value="short">Short Answer</option>
                                        <option value="code">Code</option>
                                    </select>
                                    <textarea value={q.questionText} onChange={e => handleQuestionChange(idx, 'questionText', e.target.value)} placeholder="Question" className={styles.textarea} style={{ marginTop: '0.5rem' }} />

                                    {q.qType === 'mcq' && (
                                        <div>
                                            {q.options?.map((opt, optIdx) => (
                                                <div key={optIdx} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                    <input type="radio" checked={q.correctOptionIndex === optIdx} onChange={() => handleQuestionChange(idx, 'correctOptionIndex', optIdx)} />
                                                    <input type="text" value={opt} onChange={e => handleQuestionChange(idx, `option_${optIdx}`, e.target.value)} placeholder={`Option ${optIdx + 1}`} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.9em', color: '#666' }}>
                                            {q.qType === 'mcq' ? 'Answer Explanation:' : 'Correct Answer Text:'}
                                        </label>
                                        <textarea value={q.answerText} onChange={e => handleQuestionChange(idx, 'answerText', e.target.value)} placeholder={q.qType === 'mcq' ? "Explanation" : "Correct answer..."} className={styles.textarea} rows={2} />
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <label>Marks: </label>
                                        <input type="number" value={q.maxMarks} onChange={e => handleQuestionChange(idx, 'maxMarks', e.target.value)} style={{ width: '60px' }} />
                                    </div>
                                </div>
                            ))}
                            <button onClick={addQuestion} className={styles.addQuestionButton}>+ Add Question</button>
                        </div>

                        <div className={styles.formActions}>
                            <button onClick={() => currentModuleIndex > 0 ? setCurrentModuleIndex(currentModuleIndex - 1) : setCurrentStep('lesson-setup')} className={styles.cancelButton}>Back</button>
                            <button onClick={handleModuleNext} className={styles.nextButton}>
                                {currentModuleIndex < currentLesson.modules.length - 1 ? 'Next Module' : (currentLessonIndex < lessons.length - 1 ? 'Next Lesson' : 'Finish Update')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
