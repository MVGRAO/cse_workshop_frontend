'use client';

import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function CandidateDashboard() {
  const [stats, setStats] = useState({
    enrollments: 0,
    completed: 0,
    certificates: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        // Fetch dashboard data
        const response = await fetch(`${API_BASE_URL}/student/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats({
              enrollments: (data.data?.ongoingCourses?.length || 0) + (data.data?.retakeCourses?.length || 0),
              completed: data.data?.completedCourses?.length || 0,
              certificates: data.data?.certificatesCount || 0,
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Welcome to CSE Workshop
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats Cards */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Enrolled Courses
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {loading ? '...' : stats.enrollments}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Completed Courses
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {loading ? '...' : stats.completed}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Certificates Earned
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {loading ? '...' : stats.certificates}
              </p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Activity
            </h2>
            <p className="text-gray-500">No recent activity</p>
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}

