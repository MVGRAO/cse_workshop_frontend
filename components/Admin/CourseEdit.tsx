'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ListChecks, Trash2, Info, PlusCircle } from 'lucide-react';

import {
  getCourseDetails,
  updateCourse,
  updateLesson,
  createLesson,
  updateModule,
  createModule,
  createAssignment,
  updateAssignment,
  getUsers,
  uploadImage
} from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/courseedit.module.scss';

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

interface CourseEditProps {
  courseId: string;
}

export default function CourseEdit({ courseId }: CourseEditProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Course data
  const [courseData, setCourseData] = useState<any>(null);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [numLessons, setNumLessons] = useState(1);
  const [allVerifiers, setAllVerifiers] = useState<any[]>([]);
  const [selectedVerifiers, setSelectedVerifiers] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Lesson and module data
  const [lessons, setLessons] = useState<LessonData[]>([]);

  // Navigation
  const [currentStep, setCurrentStep] = useState<'course' | 'lesson-setup' | 'module' | 'complete'>('course');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  /* =======================
     MARKDOWN HELPERS
  ======================== */
  const applyInlineFormat = (before: string, after = before) => {
    const textarea = document.getElementById('module-description-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const currentDesc = lessons[currentLessonIndex].modules[currentModuleIndex].description || '';
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentDesc.slice(start, end) || 'text';

    const updated =
      currentDesc.slice(0, start) +
      before +
      selected +
      after +
      currentDesc.slice(end);

    handleModuleChange('description', updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 0);
  };

  const applyHeading = (level: 1 | 2) => {
    const textarea = document.getElementById('module-description-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const currentDesc = lessons[currentLessonIndex].modules[currentModuleIndex].description || '';
    const cursor = textarea.selectionStart;
    const lines = currentDesc.split('\n');

    let charCount = 0;
    const lineIndex = lines.findIndex(line => {
      charCount += line.length + 1;
      return charCount > cursor;
    });

    const headingPrefix = level === 1 ? '# ' : '## ';
    const currentLine = lines[lineIndex] || '';

    const cleanedLine = currentLine.replace(/^#{1,2}\s/, '');
    lines[lineIndex] = headingPrefix + cleanedLine;

    handleModuleChange('description', lines.join('\n'));

    setTimeout(() => textarea.focus(), 0);
  };

  useEffect(() => {
    fetchCourseData();
  }, []);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, verifiersRes] = await Promise.all([
        getCourseDetails(courseId),
        getUsers('verifier')
      ]);

      if (courseRes.success && courseRes.data) {
        const { course, lessons: fetchedLessons } = courseRes.data;
        setCourseData(course);
        setCourseName(course.title);
        setCourseCode(course.code);
        setImageUrl(course.image || '');

        // set selected verifiers
        if (course.verifiers) {
          setSelectedVerifiers(course.verifiers.map((v: any) => v._id || v));
        }

        // Map fetched lessons to state structure
        const mappedLessons = fetchedLessons.map((l: any) => ({
          _id: l._id,
          title: l.title,
          numModules: l.modules.length || 1,
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

        if (mappedLessons.length === 0) {
          setNumLessons(1);
          setLessons([]);
        } else {
          setNumLessons(mappedLessons.length);
          setLessons(mappedLessons);
        }
      }

      if (verifiersRes.success && verifiersRes.data) {
        setAllVerifiers(verifiersRes.data);
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



  /* =======================
     IMAGE UPLOAD
  ======================== */
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleCourseNext = async () => {
    if (!courseName.trim() || !courseCode.trim() || numLessons < 1) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('title', courseName);
      formData.append('code', courseCode.toUpperCase());
      selectedVerifiers.forEach(id => formData.append('verifiers', id));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      await updateCourse(courseId, formData);

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

        if (lessonId) {
          await updateLesson(lessonId, {
            title: lesson.title,
            index: lIdx + 1
          });
        } else {
          const res = await createLesson(courseId, {
            index: lIdx + 1,
            title: lesson.title
          });
          if (!res.success) throw new Error('Failed to create lesson');
          lessonId = res.data._id;
          const newLessons = [...lessons];
          newLessons[lIdx]._id = lessonId;
          setLessons(newLessons);
        }

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

          const hasQuestions = module.assignment.questions.length > 0 && module.assignment.questions[0].questionText.trim();
          if (hasQuestions) {
            const assignmentPayload = {
              course: courseId,
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

  if (loading) {
    return (
      <PrivateRoute allowedRoles={['admin']}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading course...</p>
          </div>
        </div>
      </PrivateRoute>
    );
  }

  const currentLesson = lessons[currentLessonIndex];
  const currentModule = currentLesson?.modules?.[currentModuleIndex];

  return (
    <PrivateRoute allowedRoles={['admin']}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.courseForm}>
            {currentStep === 'course' && (
              <>
                <h2 className={styles.formTitle}>Update Course Details</h2>
                <div className={styles.formSection}>
                  <div className={styles.formGroup}>
                    <label>Course Name</label>
                    <input
                      type="text"
                      value={courseName}
                      onChange={e => setCourseName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Course Code</label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={e => setCourseCode(e.target.value.toUpperCase())}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Course Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isSubmitting || uploading}
                    />
                    {uploading && <small>Uploading...</small>}
                    {imageUrl && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <img src={imageUrl} alt="Preview" style={{ maxHeight: '200px', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                      </div>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Number of Lessons</label>
                    <input
                      type="number"
                      value={numLessons}
                      onChange={e => setNumLessons(parseInt(e.target.value))}
                      min="1"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Assign Verifiers</label>
                    <div className={styles.verifiersGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {allVerifiers.map(verifier => {
                        // Check if this verifier was ORIGINALLY assigned to the course
                        // The requirement says: "disabling the already assigned verifiers (it means it should be always selected)"
                        // We check against courseData.verifiers (original state)
                        const isOriginallyAssigned = courseData?.verifiers?.some((v: any) => (v._id || v) === verifier._id);
                        const isSelected = selectedVerifiers.includes(verifier._id);

                        return (
                          <label
                            key={verifier._id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.5rem',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.375rem',
                              backgroundColor: isOriginallyAssigned ? '#f3f4f6' : 'white',
                              cursor: isOriginallyAssigned ? 'not-allowed' : 'pointer',
                              opacity: isOriginallyAssigned ? 0.7 : 1
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isOriginallyAssigned}
                              onChange={(e) => {
                                if (isOriginallyAssigned) return;
                                if (e.target.checked) {
                                  setSelectedVerifiers([...selectedVerifiers, verifier._id]);
                                } else {
                                  setSelectedVerifiers(selectedVerifiers.filter(id => id !== verifier._id));
                                }
                              }}
                              style={{ marginRight: '0.5rem' }}
                            />
                            <span>{verifier.name}</span>
                          </label>
                        );
                      })}
                      {allVerifiers.length === 0 && <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No verifiers found.</p>}
                    </div>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button onClick={() => router.back()} className={styles.cancelButton}>Cancel</button>
                  <button onClick={handleCourseNext} className={styles.nextButton} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Next'}
                  </button>
                </div>
              </>
            )}

            {currentStep === 'lesson-setup' && (
              <>
                <h2 className={styles.formTitle}>Lesson {currentLessonIndex + 1}</h2>
                <div className={styles.formSection}>
                  <div className={styles.formGroup}>
                    <label>Title</label>
                    <input
                      type="text"
                      value={currentLesson.title}
                      onChange={e => handleLessonSetup('title', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Modules</label>
                    <input
                      type="number"
                      value={currentLesson.numModules}
                      onChange={e => handleLessonSetup('numModules', e.target.value)}
                      min="1"
                    />
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button
                    onClick={() => currentLessonIndex > 0 ? setCurrentLessonIndex(currentLessonIndex - 1) : setCurrentStep('course')}
                    className={styles.cancelButton}
                  >
                    Back
                  </button>
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
                    <input
                      type="text"
                      value={currentModule.title}
                      onChange={e => handleModuleChange('title', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Description (Markdown)</label>
                    <div className={styles.editorToolbar}>
                      <button type="button" onClick={() => applyInlineFormat('**')}>B</button>
                      <button type="button" onClick={() => applyInlineFormat('*')}>I</button>
                      <button type="button" onClick={() => applyInlineFormat('`')}>Code</button>
                      <button type="button" onClick={() => applyHeading(1)}>H1</button>
                      <button type="button" onClick={() => applyHeading(2)}>H2</button>
                      <button type="button" onClick={() => applyInlineFormat('- ', '')}>List</button>
                    </div>

                    <div className={styles.editorGrid}>
                      <textarea
                        id="module-description-textarea"
                        value={currentModule.description}
                        onChange={e => handleModuleChange('description', e.target.value)}
                        placeholder="Write module description using Markdown..."
                      />
                      <div className={styles.markdownPreview}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {currentModule.description || '_Live preview will appear here_'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Video URL</label>
                    <input
                      type="text"
                      value={currentModule.videoUrl}
                      onChange={e => handleModuleChange('videoUrl', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.assignmentSection}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#fce7f3', padding: '0.5rem', borderRadius: '0.5rem' }}>
                      <ListChecks size={24} color="#db2777" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#831843' }}>Assignment Questions</h3>
                  </div>

                  {currentModule.assignment.questions.map((q, idx) => (
                    <div key={idx} className={styles.questionCard}>
                      <div className={styles.questionHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{
                            background: '#fce7f3', color: '#be185d', fontWeight: 700,
                            width: '2rem', height: '2rem', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontWeight: 600, color: '#374151' }}>Question</span>
                        </div>
                        <button onClick={() => removeQuestion(idx)} className={styles.removeButton} title="Remove Question">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>
                          Question Type
                        </label>
                        <select
                          value={q.qType}
                          onChange={e => handleQuestionChange(idx, 'qType', e.target.value)}
                          className={styles.selectInput}
                          style={{ width: '100%' }}
                        >
                          <option value="mcq">Multiple Choice (MCQ)</option>
                          <option value="short">Short Answer</option>
                          <option value="code">Code Snippet</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>
                          Question Text
                        </label>
                        <textarea
                          value={q.questionText}
                          onChange={e => handleQuestionChange(idx, 'questionText', e.target.value)}
                          placeholder="Type your question here..."
                          className={styles.textarea}
                          rows={3}
                          style={{ resize: 'vertical' }}
                        />
                      </div>

                      {q.qType === 'mcq' && (
                        <div className={styles.optionsContainer}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.5rem', display: 'block' }}>
                            Answer Options (Select the correct one)
                          </label>
                          {q.options?.map((opt, optIdx) => (
                            <div key={optIdx} className={styles.optionRow}>
                              <input
                                type="radio"
                                name={`correct-opt-${idx}`}
                                checked={q.correctOptionIndex === optIdx}
                                onChange={() => handleQuestionChange(idx, 'correctOptionIndex', optIdx)}
                                title="Mark as correct answer"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={e => handleQuestionChange(idx, `option_${optIdx}`, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.answerSection}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#0369a1', marginBottom: '0.5rem' }}>
                          <Info size={16} />
                          {q.qType === 'mcq' ? 'Explanation (Optional)' : 'Sample Answer / Key'}
                        </label>
                        <textarea
                          value={q.answerText}
                          onChange={e => handleQuestionChange(idx, 'answerText', e.target.value)}
                          placeholder={q.qType === 'mcq' ? "Explain why the answer is correct..." : "Provide the expected answer for grading reference..."}
                          className={styles.textarea}
                          rows={2}
                          style={{ background: 'white' }}
                        />
                      </div>

                      <div className={styles.marksSection}>
                        <label>Points/Marks:</label>
                        <input
                          type="number"
                          value={q.maxMarks}
                          onChange={e => handleQuestionChange(idx, 'maxMarks', e.target.value)}
                          min="1"
                        />
                      </div>
                    </div>
                  ))}

                  <button onClick={addQuestion} className={styles.addQuestionButton}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <PlusCircle size={20} />
                      <span>Add New Question</span>
                    </div>
                  </button>
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={() => currentModuleIndex > 0 ? setCurrentModuleIndex(currentModuleIndex - 1) : setCurrentStep('lesson-setup')}
                    className={styles.cancelButton}
                  >
                    Back
                  </button>
                  <button onClick={handleModuleNext} className={styles.nextButton} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (currentModuleIndex < currentLesson.modules.length - 1 ? 'Next Module' : (currentLessonIndex < lessons.length - 1 ? 'Next Lesson' : 'Finish Update'))}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PrivateRoute >
  );
}
