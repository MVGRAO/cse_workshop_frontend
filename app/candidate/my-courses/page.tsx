'use client';

import PrivateRoute from '@/components/PrivateRoute';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStudentEnrollments } from '@/lib/api';

interface Enrollment {
  _id: string;
  course: {
    _id: string;
    title: string;
    description: string;
    status?: string;
  };
  status: string;
  progress: number;
  certificate?: {
    theoryScore: number;
    practicalScore?: number;
    totalScore: number;
    grade: string;
    certificateNumber: string;
  } | null;
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await getStudentEnrollments();
        if (response.success) {
          setEnrollments(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchEnrollments();

    // Poll for updates in case enrollment was created elsewhere
    const interval = setInterval(fetchEnrollments, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PrivateRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            My Enrolled Courses
          </h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading enrollments...</p>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">You haven't enrolled in any courses yet.</p>
              <Link
                href="/candidate/courses"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700"
              >
                Browse available courses →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <div key={enrollment._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {enrollment.course.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {enrollment.course.description}
                  </p>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{enrollment.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${enrollment.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${enrollment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                        }`}>
                        {enrollment.status}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${enrollment.course.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                        }`}>
                        {enrollment.course.status || 'draft'}
                      </span>
                    </div>
                    {enrollment.status === 'completed' ? (
                      enrollment.certificate ? (
                        <Link
                          href={`/candidate/my-courses/results/${enrollment._id}`}
                          className="inline-flex items-center text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                          Review Results
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center text-gray-500 bg-gray-200 px-4 py-2 rounded text-sm font-medium cursor-not-allowed"
                        >
                          Course Completed ✓
                        </button>
                      )
                    ) : enrollment.course.status === 'published' ? (
                      <Link
                        href={`/candidate/courses/${enrollment.course._id}`}
                        className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition-colors"
                      >
                        Start Course →
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center text-gray-500 bg-gray-200 px-4 py-2 rounded text-sm font-medium cursor-not-allowed"
                      >
                        Start Course (waiting for publish)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}
