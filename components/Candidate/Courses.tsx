'use client';

import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useState } from 'react';
import { getAuthToken, enrollInCourse, getStudentEnrollments } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/courses.module.scss';
import { useCandidateProfile } from '@/context/CandidateProfileContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

interface Course {
  _id: string;
  title: string;
  description: string;
  status: string;
  image?: string;
  enrolled?: boolean;
  enrollment?: any;
  certificate?: any;
  verifiers?: { _id: string; name: string; email: string }[];
  availableVerifiers?: { _id: string; name: string; email: string }[];
}

export default function Courses() {
  const { toast } = useToast();
  const { user } = useCandidateProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    classYear: '',
    college: '',
    mobile: '',
    verifierId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken('student');
      if (!token) return;

      const [coursesRes, enrollmentsRes, certificatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/student/courses/available`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        getStudentEnrollments().catch(() => ({ data: [] })),
        fetch(`${API_BASE_URL}/student/certificates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).catch(() => ({ data: [] }))
      ]);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const enrollmentsData = enrollmentsRes.data || [];
        const certificatesData = certificatesRes.data || [];

        const enrollmentMap = new Map();
        enrollmentsData.forEach((e: any) => {
          const rawCourse = e.course;
          const courseId = rawCourse ? (rawCourse._id ?? rawCourse).toString() : null;
          if (courseId) enrollmentMap.set(courseId, e);
        });

        const certificateMap = new Map();
        certificatesData.forEach((c: any) => {
          const rawCourse = c.course;
          const courseId = rawCourse ? (rawCourse._id ?? rawCourse).toString() : null;
          if (courseId) certificateMap.set(courseId, c);
        });

        if (coursesData.success) {
          const formattedCourses = (coursesData.data || []).map((course: any) => {
            const enrollment = enrollmentMap.get(course._id);
            return {
              ...course,
              verifiers: course.availableVerifiers || course.verifiers || [],
              enrolled: !!enrollment,
              enrollment,
              certificate: certificateMap.get(course._id),
            };
          });
          setCourses(formattedCourses);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEnrollForm = (course: Course) => {
    setSelectedCourse(course);
    setShowForm(true);
    setFormData({
      name: '',
      email: '',
      classYear: '',
      college: '',
      mobile: '',
      verifierId: course.verifiers?.[0]?._id || '',
    });
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    if (selectedCourse.verifiers?.length && !formData.verifierId) {
      toast({
        title: 'Select Verifier',
        description: 'Please choose a verifier before enrolling.',
        variant: 'error',
      });
      return;
    }

    try {
      setSubmitting(true);
      await enrollInCourse(selectedCourse._id, formData);

      toast({
        title: 'Success',
        description: 'Enrolled successfully!',
        variant: 'success',
      });

      await fetchData();
      setShowForm(false);
      setSelectedCourse(null);
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

  return (
    <PrivateRoute allowedRoles={['student']}>
      <div className={styles.coursesContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Available Courses</h1>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No courses available at the moment</p>
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {courses.map((course) => (
                <div key={course._id} className={styles.courseCard}>
                  {/* Course Image */}
                  <div className={styles.courseImageWrapper}>
                    <img
                      src={course.image || 'https://via.placeholder.com/400x200?text=Course+Image'}
                      alt={course.title}
                      className={styles.courseImage}
                    />
                    {course.enrolled && (
                      <div className={styles.enrolledBadge}>
                        Enrolled
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className={styles.cardContent}>
                    <h3 className={styles.courseTitle}>{course.title}</h3>
                    <p className={styles.courseDescription}>
                      {course.description || 'No description available'}
                    </p>

                    <div className={styles.cardActions}>
                      {course.enrolled ? (
                        <button
                          disabled
                          className={styles.alreadyEnrolledButton}
                        >
                          Already Enrolled
                        </button>
                      ) : (
                        <button
                          onClick={() => openEnrollForm(course)}
                          className={styles.enrollButton}
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Enrollment Modal - EXACTLY AS YOUR ORIGINAL CODE */}
      {showForm && selectedCourse && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Enroll in {selectedCourse.title}</h3>
                <p className={styles.modalSubtitle}>Provide your details and choose a verifier</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnroll} className={styles.enrollForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={styles.formInput}
                />
                <p className={styles.formHint}>Must match your account email</p>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Class Year</label>
                  <input
                    type="text"
                    value={formData.classYear}
                    onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                    required
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>College</label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    required
                    className={styles.formInput}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mobile</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Verifier</label>
                <select
                  value={formData.verifierId}
                  onChange={(e) => setFormData({ ...formData, verifierId: e.target.value })}
                  className={styles.formInput}
                  required={Boolean(selectedCourse.verifiers?.length)}
                >
                  {selectedCourse.verifiers?.length ? (
                    <>
                      <option value="">Select verifier</option>
                      {selectedCourse.verifiers.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name} ({v.email})
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="">No verifier available</option>
                  )}
                </select>
                <p className={styles.formHint}>Only one verifier can be chosen</p>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.submitButton}
                >
                  {submitting ? 'Submitting...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PrivateRoute>
  );
}