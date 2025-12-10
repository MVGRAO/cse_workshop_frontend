'use client';

import PrivateRoute from '@/components/PrivateRoute';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

interface Enrollment {
  _id: string;
  course: {
    _id: string;
    title: string;
    description: string;
  };
  status: string;
  progress: number;
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/student/enrollments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setEnrollments(data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  return (
    <PrivateRoute>
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
                <div key={enrollment._id} className="bg-white rounded-lg shadow p-6">
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
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      enrollment.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {enrollment.status}
                    </span>
                    <Link
                      href={`/candidate/courses/${enrollment.course._id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Continue →
                    </Link>
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

