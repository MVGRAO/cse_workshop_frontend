'use client';

import PrivateRoute from '@/components/PrivateRoute';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAuthToken, enrollInCourse, getStudentEnrollments } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

interface Course {
  _id: string;
  title: string;
  description: string;
  status: string;
  enrolled?: boolean;
  verifiers?: { _id: string; name: string; email: string }[];
  availableVerifiers?: { _id: string; name: string; email: string }[];
}

export default function CandidateCourses() {
  const router = useRouter();
  const { toast } = useToast();
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
      const token = getAuthToken();
      if (!token) return;

      // Parallel fetch courses and enrollments
      const [coursesRes, enrollmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/student/courses/available`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        getStudentEnrollments().catch(() => ({ data: [] }))
      ]);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const enrollmentsData = enrollmentsRes.data || [];

        // Extract course IDs from enrollments
        const enrolledCourseIds = new Set(enrollmentsData.map((e: any) => {
          const id = e.course?._id || e.course;
          return typeof id === 'object' ? id.toString() : id;
        }));

        if (coursesData.success) {
          const formattedCourses = (coursesData.data || []).map((course: any) => ({
            ...course,
            verifiers: course.availableVerifiers || course.verifiers || [],
            enrolled: enrolledCourseIds.has(course._id)
          }));
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

      setCourses(prev => prev.map(c =>
        c._id === selectedCourse._id ? { ...c, enrolled: true } : c
      ));
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Available Courses
            </h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="mt-8 text-center text-gray-500">
              <p>No courses available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course._id} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {course.description || 'No description available'}
                    </p>
                    {course.enrolled ? (
                      <div className="flex gap-3">
                        <button
                          disabled
                          className="w-full bg-gray-100 text-gray-400 px-4 py-2 rounded cursor-not-allowed border border-gray-200"
                        >
                          Already Enrolled
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEnrollForm(course)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                        >
                          Enroll
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Enroll in {selectedCourse.title}</h3>
                <p className="text-gray-600 text-sm">Provide your details and choose a verifier</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnroll} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Must match your account email</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Year</label>
                  <input
                    type="text"
                    value={formData.classYear}
                    onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verifier</label>
                <select
                  value={formData.verifierId}
                  onChange={(e) => setFormData({ ...formData, verifierId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <p className="text-xs text-gray-500 mt-1">Only one verifier can be chosen</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70"
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
