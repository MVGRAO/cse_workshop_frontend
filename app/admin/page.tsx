'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  adminLogin,
  storeAuthToken,
  getAuthToken,
  getAllCourses,
  getCourseDetails,
  deleteCourse,
  createCourse,
  createLesson,
  getLessonsByCourse,
  createModule,
  createAssignment,
  publishCourse,
  authenticatedFetch,
  removeAuthToken
} from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from './admin.module.scss';

/**
 * Admin Login and Dashboard Page
 * - Shows login form if not authenticated
 * - Shows dashboard with course management if authenticated
 */
export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const token = getAuthToken();
    const role = typeof window !== 'undefined' ? localStorage.getItem('auth_role') : null;
    if (token && role === 'admin') {
      setIsAuthenticated(true);
    } else if (token && role && role !== 'admin') {
      router.replace(`/${role}`);
    }
    setIsLoading(false);
  }, [router]);

  /**
   * Handle admin login
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "error",
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      console.log("Attempting admin login...");
      const response = await adminLogin(email, password);

      if (response.success && response.data?.token) {
        // Store the token
        storeAuthToken(response.data.token, 'admin');
        console.log("Admin login successful, token stored");

        setIsAuthenticated(true);
        toast({
          title: "Success",
          description: "Admin login successful",
          variant: "success",
        });
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to login. Please check your credentials.",
        variant: "error",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    // Clear token from localStorage
    removeAuthToken();
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
      variant: "info",
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>Admin Login</h1>
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
                disabled={isLoggingIn}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={isLoggingIn}
              />
            </div>
            <button type="submit" className={styles.submitButton} disabled={isLoggingIn}>
              {isLoggingIn ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated
  return <AdminDashboard onLogout={handleLogout} />;
}

/**
 * Admin Dashboard Component
 * Shows course list and allows creating new courses
 */
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [showPublishConfirm, setShowPublishConfirm] = useState<string | null>(null);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  /**
   * Fetch all courses from the backend
   */
  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    try {
      console.log("Fetching all courses...");
      const response = await getAllCourses();

      if (response.success && response.data) {
        console.log("Courses fetched successfully:", response.data.length);
        setCourses(response.data);
      } else {
        throw new Error("Failed to fetch courses");
      }
    } catch (error: any) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load courses",
        variant: "error",
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  /**
   * Handle course creation success
   */
  const handleCourseCreated = () => {
    setShowCourseForm(false);
    fetchCourses(); // Refresh course list
    toast({
      title: "Success",
      description: "Course created successfully",
      variant: "success",
    });
  };

  /**
   * Publish a course
   */
  const handlePublishCourse = async (courseId: string) => {
    try {
      await publishCourse(courseId);
      toast({
        title: 'Success',
        description: 'Course published successfully',
        variant: 'success',
      });
      fetchCourses();
      setShowPublishConfirm(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish course',
        variant: 'error',
      });
    }
  };

  /**
   * Confirm deletion
   */
  const handleConfirmDelete = async (courseId: string) => {
    try {
      await deleteCourse(courseId);
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
        variant: 'success',
      });
      fetchCourses();
      setShowDeleteConfirm(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete course',
        variant: 'error',
      });
    }
  };

  /**
   * Cancel deletion
   */
  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.dashboardTitle}>Admin Dashboard</h1>
        <button onClick={onLogout} className={styles.logoutButton}>
          Logout
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.actions}>
          <button
            onClick={() => router.push('/admin/requests')}
            className={styles.addCourseButton}
            style={{ backgroundColor: '#111827', marginRight: '0.5rem' }}
          >
            View Requests
          </button>
          {!showCourseForm && (
            <button onClick={() => setShowCourseForm(true)} className={styles.addCourseButton}>
              + Add Course
            </button>
          )}
        </div>

        {showCourseForm ? (
          <CourseCreationForm onSuccess={handleCourseCreated} onCancel={() => setShowCourseForm(false)} />
        ) : selectedCourseId ? (
          <CourseDetailView
            courseId={selectedCourseId}
            onBack={() => setSelectedCourseId(null)}
            onCourseDeleted={() => {
              setSelectedCourseId(null);
              fetchCourses();
            }}
          />
        ) : (
          <CoursesList
            courses={courses}
            isLoading={isLoadingCourses}
            onCourseClick={(courseId) => setSelectedCourseId(courseId)}
            onEditClick={(courseId) => router.push(`/admin/courses/${courseId}/edit`)}
            onDeleteClick={(courseId) => setShowDeleteConfirm(courseId)}
            onPublishClick={(courseId) => setShowPublishConfirm(courseId)}
            showDeleteConfirm={showDeleteConfirm}
            onConfirmDelete={handleConfirmDelete}
            onCancelDelete={handleCancelDelete}
            showPublishConfirm={showPublishConfirm}
            onConfirmPublish={handlePublishCourse}
            onCancelPublish={() => setShowPublishConfirm(null)}
          />
        )}
      </div>
    </div>
  );
}


/**
 * Course Detail View Component
 */
function CourseDetailView({
  courseId,
  onBack,
  onCourseDeleted,
}: {
  courseId: string;
  onBack: () => void;
  onCourseDeleted: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching course details...');
      const response = await getCourseDetails(courseId);
      if (response.success && response.data) {
        console.log('Course details fetched successfully');
        setCourseDetails(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching course details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load course details',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourse(courseId);
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
        variant: 'success',
      });
      onCourseDeleted();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete course',
        variant: 'error',
      });
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading course details...</div>;
  }

  if (!courseDetails) {
    return (
      <div className={styles.emptyState}>
        <p>Course not found</p>
        <button onClick={onBack} className={styles.backButton}>
          Back to Courses
        </button>
      </div>
    );
  }

  const { course, lessons } = courseDetails;

  return (
    <div className={styles.courseDetailView}>
      <div className={styles.courseDetailHeader}>
        <div>
          <h2 className={styles.detailTitle}>{course.title}</h2>
          <p className={styles.detailCode}>Code: {course.code}</p>
          <p className={styles.detailStatus}>Status: {course.status}</p>
        </div>
        <div className={styles.detailActions}>
          <button
            onClick={() => {
              router.push(`/admin/courses/${course._id}/edit`);
            }}
            className={styles.updateButton}
          >
            Update
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={styles.deleteButton}
          >
            Delete
          </button>
          <button onClick={onBack} className={styles.backButton}>
            Back
          </button>
        </div>
      </div>

      {course.description && (
        <div className={styles.detailSection}>
          <h3>Description</h3>
          <p>{course.description}</p>
        </div>
      )}

      <div className={styles.detailSection}>
        <h3>Lessons ({lessons.length})</h3>
        {lessons.length === 0 ? (
          <p className={styles.emptyText}>No lessons in this course yet.</p>
        ) : (
          <div className={styles.lessonsContainer}>
            {lessons.map((lesson: any, lessonIndex: number) => (
              <div key={lesson._id} className={styles.lessonCard}>
                <h4 className={styles.lessonCardTitle}>
                  Lesson {lesson.index}: {lesson.title}
                </h4>
                {lesson.description && (
                  <p className={styles.lessonDescription}>{lesson.description}</p>
                )}
                <div className={styles.modulesContainer}>
                  <h5>Modules ({lesson.modules.length})</h5>
                  {lesson.modules.map((module: any, moduleIndex: number) => (
                    <div key={module._id} className={styles.moduleCard}>
                      <h6 className={styles.moduleCardTitle}>
                        Module {lesson.index}.{module.index}: {module.title}
                      </h6>
                      {module.description && (
                        <p className={styles.moduleDescription}>{module.description}</p>
                      )}
                      {module.videoUrl && (
                        <p className={styles.moduleVideo}>
                          <a href={module.videoUrl} target="_blank" rel="noopener noreferrer">
                            Watch Video
                          </a>
                        </p>
                      )}
                      {module.assignment && (
                        <div className={styles.assignmentCard}>
                          <h6>Assignment</h6>
                          <p>Questions: {module.assignment.questions?.length || 0}</p>
                          <p>Max Score: {module.assignment.maxScore || 0}</p>
                          {module.assignment.questions && module.assignment.questions.length > 0 && (
                            <div className={styles.questionsList}>
                              {module.assignment.questions.map((q: any, qIndex: number) => (
                                <div key={qIndex} className={styles.questionItem}>
                                  <p><strong>Q{qIndex + 1}:</strong> {q.questionText}</p>
                                  <p>Type: {q.qType.toUpperCase()}</p>
                                  <p>Marks: {q.maxMarks}</p>
                                  {q.qType === 'mcq' && q.options && (
                                    <div>
                                      <p>Options:</p>
                                      <ul>
                                        {q.options.map((opt: string, optIdx: number) => (
                                          <li key={optIdx}>
                                            {opt} {q.correctOptionIndex === optIdx ? '(Correct)' : ''}
                                          </li>
                                        ))}
                                      </ul>
                                      {q.answerText && (
                                        <p><strong>Answer:</strong> {q.answerText}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className={styles.deleteConfirmOverlay}>
          <div className={styles.deleteConfirmDialog}>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this course? This action cannot be undone.</p>
            <p><strong>This will delete all lessons, modules, and assignments associated with this course.</strong></p>
            <div className={styles.deleteConfirmActions}>
              <button
                onClick={handleDelete}
                className={styles.confirmDeleteButton}
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelDeleteButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Course Creation Form Component
 * Step-by-step wizard for creating courses with lessons, modules, and assignments
 */
function CourseCreationForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Course data
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [numLessons, setNumLessons] = useState(1);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  // Step tracking: 'course' -> 'lesson-setup' -> 'module' -> 'next-lesson' -> ... -> 'complete'
  const [currentStep, setCurrentStep] = useState<'course' | 'lesson-setup' | 'module' | 'complete'>('course');
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);

  // Lesson and module data
  const [lessons, setLessons] = useState<Array<{
    title: string;
    numModules: number;
    modules: Array<{
      title: string;
      description: string;
      videoUrl: string;
      assignment: {
        questions: Array<{
          qType: 'mcq' | 'short' | 'code';
          questionText: string;
          options?: string[];
          correctOptionIndex?: number;
          answerText?: string; // Answer explanation/text for MCQ
          maxMarks: number;
        }>;
      };
    }>;
  }>>([]);

  /**
   * Initialize lessons array when starting lesson setup
   */
  useEffect(() => {
    if (currentStep === 'lesson-setup' && lessons.length === 0 && numLessons > 0) {
      const newLessons = Array.from({ length: numLessons }, () => ({
        title: '',
        numModules: 1,
        modules: [],
      }));
      setLessons(newLessons);
    }
  }, [currentStep, numLessons]);

  /**
   * Handle course step: Create course and move to first lesson setup
   */
  const handleCourseNext = async () => {
    if (!courseName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a course name',
        variant: 'error',
      });
      return;
    }

    if (!courseCode.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a course code',
        variant: 'error',
      });
      return;
    }

    if (numLessons < 1) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least 1 lesson',
        variant: 'error',
      });
      return;
    }

    // Create the course first
    setIsSubmitting(true);
    try {
      console.log('Creating course...');
      const courseResponse = await createCourse({
        title: courseName,
        code: courseCode.toUpperCase(),
        description: '',
      });

      if (!courseResponse.success || !courseResponse.data?._id) {
        throw new Error('Failed to create course');
      }

      const courseId = courseResponse.data._id;
      console.log('Course created with ID:', courseId);
      setCreatedCourseId(courseId);

      // Move to first lesson setup
      setCurrentLessonIndex(0);
      setCurrentStep('lesson-setup');
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle lesson setup: title and number of modules
   */
  const handleLessonSetup = (field: string, value: any) => {
    const updatedLessons = [...lessons];

    if (field === 'title') {
      updatedLessons[currentLessonIndex].title = value;
    } else if (field === 'numModules') {
      const num = Math.max(1, parseInt(value) || 1);
      updatedLessons[currentLessonIndex].numModules = num;

      // Initialize modules array if needed
      if (updatedLessons[currentLessonIndex].modules.length === 0) {
        updatedLessons[currentLessonIndex].modules = Array.from({ length: num }, () => ({
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
        }));
      } else {
        // Adjust modules array size
        const currentModules = updatedLessons[currentLessonIndex].modules;
        if (num > currentModules.length) {
          // Add new modules
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
                  maxMarks: 10,
                }],
              },
            });
          }
        } else if (num < currentModules.length) {
          // Remove excess modules
          updatedLessons[currentLessonIndex].modules = currentModules.slice(0, num);
        }
      }
    }

    setLessons(updatedLessons);
  };

  /**
   * Move from lesson setup to first module
   */
  const handleLessonSetupNext = () => {
    const lesson = lessons[currentLessonIndex];

    if (!lesson.title.trim()) {
      toast({
        title: 'Validation Error',
        description: `Please enter a title for Lesson ${currentLessonIndex + 1}`,
        variant: 'error',
      });
      return;
    }

    if (lesson.numModules < 1) {
      toast({
        title: 'Validation Error',
        description: `Please enter at least 1 module for Lesson ${currentLessonIndex + 1}`,
        variant: 'error',
      });
      return;
    }

    // Initialize modules if not already done
    if (lesson.modules.length === 0) {
      const updatedLessons = [...lessons];
      updatedLessons[currentLessonIndex].modules = Array.from({ length: lesson.numModules }, () => ({
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
      }));
      setLessons(updatedLessons);
    }

    // Move to first module of this lesson (don't save to backend yet)
    setCurrentModuleIndex(0);
    setCurrentStep('module');
  };

  /**
   * Handle module field changes for current module
   */
  const handleModuleChange = (field: string, value: any) => {
    const updatedLessons = [...lessons];
    const module = updatedLessons[currentLessonIndex].modules[currentModuleIndex];

    if (field === 'title') {
      module.title = value;
    } else if (field === 'description') {
      module.description = value;
    } else if (field === 'videoUrl') {
      module.videoUrl = value;
    }

    setLessons(updatedLessons);
  };

  /**
   * Handle assignment question changes for current module
   */
  const handleQuestionChange = (questionIndex: number, field: string, value: any) => {
    const updatedLessons = [...lessons];
    const question = { ...updatedLessons[currentLessonIndex].modules[currentModuleIndex].assignment.questions[questionIndex] };

    if (field === 'questionText') {
      question.questionText = value;
    } else if (field === 'qType') {
      question.qType = value;
      if (value === 'mcq' && !question.options) {
        question.options = ['', '', '', ''];
      } else if (value !== 'mcq') {
        // Clear options for non-MCQ questions
        question.options = undefined;
        question.correctOptionIndex = undefined;
        question.answerText = undefined;
      }
    } else if (field === 'maxMarks') {
      question.maxMarks = parseInt(value) || 0;
    } else if (field === 'correctOptionIndex') {
      question.correctOptionIndex = parseInt(value);
    } else if (field === 'answerText') {
      question.answerText = value;
    } else if (field.startsWith('option_')) {
      const optIndex = parseInt(field.split('_')[1]);
      if (question.options) {
        const newOptions = [...question.options];
        newOptions[optIndex] = value;
        question.options = newOptions;
      }
    }

    // Update the question in the lessons array
    const updatedQuestions = [...updatedLessons[currentLessonIndex].modules[currentModuleIndex].assignment.questions];
    updatedQuestions[questionIndex] = question;
    updatedLessons[currentLessonIndex].modules[currentModuleIndex].assignment.questions = updatedQuestions;

    setLessons(updatedLessons);
  };

  /**
   * Add a new question to current module's assignment
   */
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

  /**
   * Remove a question from current module's assignment
   */
  const removeQuestion = (questionIndex: number) => {
    const updatedLessons = [...lessons];
    updatedLessons[currentLessonIndex].modules[currentModuleIndex].assignment.questions.splice(questionIndex, 1);
    setLessons(updatedLessons);
  };

  /**
   * Navigate to previous module
   */
  const handleModuleBack = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    } else {
      // Go back to lesson setup
      setCurrentStep('lesson-setup');
    }
  };

  /**
   * Navigate to next module or next lesson (without saving)
   */
  const handleModuleNext = () => {
    // Validate current module
    const module = lessons[currentLessonIndex].modules[currentModuleIndex];

    if (!module.title.trim()) {
      toast({
        title: 'Validation Error',
        description: `Please enter a title for Module ${currentLessonIndex + 1}.${currentModuleIndex + 1}`,
        variant: 'error',
      });
      return;
    }

    // Check if there are more modules in this lesson
    const lesson = lessons[currentLessonIndex];
    if (currentModuleIndex < lesson.modules.length - 1) {
      // Move to next module
      setCurrentModuleIndex(currentModuleIndex + 1);
    } else {
      // All modules of this lesson are done, move to next lesson
      if (currentLessonIndex < lessons.length - 1) {
        // Move to next lesson setup
        setCurrentLessonIndex(currentLessonIndex + 1);
        setCurrentStep('lesson-setup');
      } else {
        // All lessons are done, save everything to backend
        setCurrentStep('complete');
        handleCompleteCourse();
      }
    }
  };


  /**
   * Complete course creation - Save everything to backend
   */
  const handleCompleteCourse = async () => {
    setIsSubmitting(true);

    try {
      console.log('Starting to save entire course to backend...');

      if (!createdCourseId) {
        throw new Error('Course ID not found');
      }

      // Create all lessons and modules
      for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
        const lessonData = lessons[lessonIndex];

        console.log(`Creating lesson ${lessonIndex + 1}...`);
        const lessonResponse = await createLesson(createdCourseId, {
          index: lessonIndex + 1,
          title: lessonData.title,
        });

        if (!lessonResponse.success || !lessonResponse.data?._id) {
          throw new Error(`Failed to create lesson ${lessonIndex + 1}`);
        }

        const lessonId = lessonResponse.data._id;
        console.log(`Lesson ${lessonIndex + 1} created with ID:`, lessonId);

        // Create all modules for this lesson
        for (let moduleIndex = 0; moduleIndex < lessonData.modules.length; moduleIndex++) {
          const moduleData = lessonData.modules[moduleIndex];

          console.log(`Creating module ${lessonIndex + 1}.${moduleIndex + 1}...`);

          // Create module
          const moduleResponse = await createModule(lessonId, {
            index: moduleIndex + 1,
            title: moduleData.title,
            description: moduleData.description,
            videoUrl: moduleData.videoUrl,
            textContent: moduleData.description,
          });

          if (!moduleResponse.success || !moduleResponse.data?._id) {
            throw new Error(`Failed to create module ${lessonIndex + 1}.${moduleIndex + 1}`);
          }

          const moduleId = moduleResponse.data._id;
          console.log(`Module ${lessonIndex + 1}.${moduleIndex + 1} created with ID:`, moduleId);

          // Create assignment if it has questions
          if (moduleData.assignment.questions.length > 0 &&
            moduleData.assignment.questions[0].questionText.trim()) {
            try {
              const assignmentResponse = await createAssignment({
                course: createdCourseId,
                module: moduleId,
                type: 'theory',
                questions: moduleData.assignment.questions.map(q => ({
                  qType: q.qType,
                  questionText: q.questionText,
                  options: q.options,
                  correctOptionIndex: q.correctOptionIndex,
                  answerText: q.answerText, // Include answer text for MCQ
                  maxMarks: q.maxMarks,
                })),
                maxScore: moduleData.assignment.questions.reduce((sum, q) => sum + q.maxMarks, 0),
              });

              if (assignmentResponse.success && assignmentResponse.data?._id) {
                const assignmentId = assignmentResponse.data._id;
                console.log(`Assignment created with ID:`, assignmentId);

                // Update module with assignment reference
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
                await authenticatedFetch(`${API_BASE_URL}/admin/modules/${moduleId}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ assignment: assignmentId }),
                });
              }
            } catch (error) {
              console.error('Error creating assignment:', error);
              throw error; // Don't continue if assignment fails
            }
          }
        }
      }

      console.log('Course creation completed successfully!');
      toast({
        title: 'Success',
        description: 'Course created successfully!',
        variant: 'success',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error completing course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  // Get current lesson and module
  const currentLesson = lessons[currentLessonIndex];
  const currentModule = currentLesson?.modules[currentModuleIndex];

  // Render course step
  if (currentStep === 'course') {
    return (
      <div className={styles.courseForm}>
        <h2 className={styles.formTitle}>Create New Course</h2>
        <div className={styles.formSection}>
          <div className={styles.formGroup}>
            <label>Course Name *</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Enter course name"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Course Code *</label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
              placeholder="e.g., CS101"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Number of Lessons *</label>
            <input
              type="number"
              value={numLessons}
              onChange={(e) => setNumLessons(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className={styles.formActions}>
          <button onClick={onCancel} className={styles.cancelButton} disabled={isSubmitting}>
            Cancel
          </button>
          <button onClick={handleCourseNext} className={styles.nextButton} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  // Render lesson setup step
  if (currentStep === 'lesson-setup' && currentLesson) {
    return (
      <div className={styles.courseForm}>
        <h2 className={styles.formTitle}>
          Lesson {currentLessonIndex + 1} of {numLessons}
        </h2>
        <div className={styles.formSection}>
          <div className={styles.formGroup}>
            <label>Lesson Name *</label>
            <input
              type="text"
              value={currentLesson.title}
              onChange={(e) => handleLessonSetup('title', e.target.value)}
              placeholder={`Enter name for Lesson ${currentLessonIndex + 1}`}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Number of Modules *</label>
            <input
              type="number"
              value={currentLesson.numModules}
              onChange={(e) => handleLessonSetup('numModules', parseInt(e.target.value) || 1)}
              min="1"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className={styles.formActions}>
          <button
            onClick={() => {
              if (currentLessonIndex > 0) {
                setCurrentLessonIndex(currentLessonIndex - 1);
              } else {
                setCurrentStep('course');
              }
            }}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Back
          </button>
          <button onClick={handleLessonSetupNext} className={styles.nextButton} disabled={isSubmitting}>
            Next
          </button>
        </div>
      </div>
    );
  }

  // Render module step
  if (currentStep === 'module' && currentModule) {
    return (
      <div className={styles.courseForm}>
        <h2 className={styles.formTitle}>
          Module {currentLessonIndex + 1}.{currentModuleIndex + 1} of {currentLesson.numModules}
        </h2>

        <div className={styles.formSection}>
          <div className={styles.formGroup}>
            <label>Module Title *</label>
            <input
              type="text"
              value={currentModule.title}
              onChange={(e) => handleModuleChange('title', e.target.value)}
              placeholder={`Enter title for Module ${currentLessonIndex + 1}.${currentModuleIndex + 1}`}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description (Markdown Format) *</label>
            <textarea
              value={currentModule.description}
              onChange={(e) => handleModuleChange('description', e.target.value)}
              placeholder="Enter module description in markdown format..."
              rows={8}
              required
              className={styles.textarea}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Video URL</label>
            <input
              type="url"
              value={currentModule.videoUrl}
              onChange={(e) => handleModuleChange('videoUrl', e.target.value)}
              placeholder="Enter video URL (optional)"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Assignment Section */}
        <div className={styles.assignmentSection}>
          <h5 className={styles.assignmentTitle}>Assignment for Module {currentLessonIndex + 1}.{currentModuleIndex + 1}</h5>

          {currentModule.assignment.questions.map((question, questionIndex) => (
            <div key={questionIndex} className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <h6>Question {questionIndex + 1}</h6>
                {currentModule.assignment.questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(questionIndex)}
                    className={styles.removeButton}
                    disabled={isSubmitting}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Question Type *</label>
                <select
                  className={styles.selectInput}
                  value={question.qType}
                  onChange={(e) => handleQuestionChange(questionIndex, 'qType', e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="short">Short Answer</option>
                  <option value="code">Code</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Question Text *</label>
                <textarea
                  value={question.questionText}
                  onChange={(e) => handleQuestionChange(questionIndex, 'questionText', e.target.value)}
                  placeholder="Enter the question"
                  rows={3}
                  required
                  className={styles.textarea}
                  disabled={isSubmitting}
                />
              </div>

              {question.qType === 'mcq' && question.options && (
                <>
                  <div className={styles.formGroup}>
                    <label>Options *</label>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className={styles.optionRow}>
                        <input
                          type="radio"
                          name={`correct_${currentLessonIndex}_${currentModuleIndex}_${questionIndex}`}
                          checked={question.correctOptionIndex === optIndex}
                          onChange={() => handleQuestionChange(questionIndex, 'correctOptionIndex', optIndex)}
                          disabled={isSubmitting}
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleQuestionChange(questionIndex, `option_${optIndex}`, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                          required
                          className={styles.optionInput}
                          disabled={isSubmitting}
                        />
                      </div>
                    ))}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Answer Explanation/Text (for MCQ) *</label>
                    <textarea
                      value={question.answerText || ''}
                      onChange={(e) => handleQuestionChange(questionIndex, 'answerText', e.target.value)}
                      placeholder="Enter explanation or answer text for the correct option..."
                      rows={3}
                      required
                      className={styles.textarea}
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}

              <div className={styles.formGroup}>
                <label>Max Marks *</label>
                <input
                  type="number"
                  value={question.maxMarks}
                  onChange={(e) => handleQuestionChange(questionIndex, 'maxMarks', parseInt(e.target.value) || 0)}
                  min="1"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            className={styles.addQuestionButton}
            disabled={isSubmitting}
          >
            + Add Question
          </button>
        </div>

        <div className={styles.formActions}>
          <button onClick={handleModuleBack} className={styles.cancelButton} disabled={isSubmitting}>
            Back
          </button>
          <button onClick={handleModuleNext} className={styles.nextButton} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' :
              currentModuleIndex < currentLesson.modules.length - 1 ? 'Next Module' :
                currentLessonIndex < lessons.length - 1 ? 'Next Lesson' : 'Complete Course'}
          </button>
        </div>
      </div>
    );
  }

  // Render completion step
  if (currentStep === 'complete') {
    return (
      <div className={styles.courseForm}>
        <h2 className={styles.formTitle}>Course Created Successfully!</h2>
        <div className={styles.formSection}>
          <p>Your course "{courseName}" has been created successfully with all lessons and modules.</p>
        </div>
        <div className={styles.formActions}>
          <button onClick={onSuccess} className={styles.nextButton}>
            View Courses
          </button>
        </div>
      </div>
    );
  }

  return null;
}


interface CoursesListProps {
  courses: any[];
  isLoading: boolean;
  onCourseClick: (courseId: string) => void;
  onEditClick: (courseId: string) => void;
  onDeleteClick: (courseId: string) => void;
  onPublishClick: (courseId: string) => void;
  showDeleteConfirm: string | null;
  onConfirmDelete: (courseId: string) => void;
  onCancelDelete: () => void;
  showPublishConfirm: string | null;
  onConfirmPublish: (courseId: string) => void;
  onCancelPublish: () => void;
}

function CoursesList({
  courses,
  isLoading,
  onCourseClick,
  onEditClick,
  onDeleteClick,
  onPublishClick,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
  showPublishConfirm,
  onConfirmPublish,
  onCancelPublish
}: CoursesListProps) {
  if (isLoading) {
    return <div className={styles.loading}>Loading courses...</div>;
  }

  if (!courses || courses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No courses found. Create your first course!</p>
      </div>
    );
  }

  return (
    <div className={styles.coursesList}>
      <h2 className={styles.sectionTitle}>All Courses ({courses.length})</h2>
      <div className={styles.coursesGrid}>
        {courses.map((course) => (
          <div key={course._id} className={styles.courseCard}>
            <div
              className={styles.courseCardContent}
              onClick={() => onCourseClick(course._id)}
            >
              <h3 className={styles.courseTitle}>{course.title}</h3>
              <p className={styles.courseCode}>Code: {course.code}</p>
              <p className={styles.courseStatus}>Status: {course.status}</p>
              {course.description && (
                <p className={styles.courseDescription}>{course.description}</p>
              )}
            </div>

            <div className={styles.courseCardActions}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(course._id);
                }}
                className={styles.updateButton}
              >
                Update
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(course._id);
                }}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </div>

            {course.status !== 'published' &&
              (course.lessonCount > 0 || course.moduleCount > 0) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPublishClick(course._id);
                  }}
                  className={styles.updateButton}
                  style={{
                    backgroundColor: '#10b981',
                    marginLeft: '0.5rem',
                    marginTop: '0.5rem',
                    width: '100%'
                  }}
                >
                  Publish Course
                </button>
              )}

            {showDeleteConfirm === course._id && (
              <div className={styles.deleteConfirmDialog}>
                <p>Are you sure you want to delete this course? This action cannot be undone.</p>
                <div className={styles.deleteConfirmActions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmDelete(course._id);
                    }}
                    className={styles.confirmDeleteButton}
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelDelete();
                    }}
                    className={styles.cancelDeleteButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showPublishConfirm === course._id && (
              <div className={styles.deleteConfirmDialog}>
                <p>Are you sure you want to start the workshop? This will publish the course.</p>
                <div className={styles.deleteConfirmActions}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onConfirmPublish(course._id);
                    }}
                    className={styles.confirmDeleteButton}
                    style={{ backgroundColor: '#10b981' }}
                  >
                    Yes, Publish
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancelPublish();
                    }}
                    className={styles.cancelDeleteButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

