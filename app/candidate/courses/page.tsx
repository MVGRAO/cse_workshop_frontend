'use client';

import PrivateRoute from '@/components/PrivateRoute';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

interface Course {
  _id: string;
  title: string;
  description: string;
  status: string;
}

export default function CandidateCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/student/courses/available`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCourses(data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <PrivateRoute>
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
                    <Link
                      href={`/candidate/courses/${course._id}`}
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      View Details
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
