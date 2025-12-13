'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PrivateRoute from '@/components/PrivateRoute';
import { getVerifierOverview, removeAuthToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function EmployerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<{ totalCandidates: number; perCourse: Array<{ title: string; code: string; count: number }> }>({
    totalCandidates: 0,
    perCourse: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const resp = await getVerifierOverview();
        setOverview({
          totalCandidates: resp.data?.totalCandidates || 0,
          perCourse: resp.data?.perCourse || [],
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    removeAuthToken('verifier');
    router.replace('/employer');
  };

  return (
    <PrivateRoute allowedRoles={['verifier']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Verifier Dashboard</h1>
            <p className="text-gray-600">Overview of candidates assigned to you</p>
          </div>

          {loading ? (
            <div className="bg-white rounded shadow p-6 text-center">Loading...</div>
          ) : error ? (
            <div className="bg-white rounded shadow p-6 text-center text-red-600">{error}</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded shadow p-6">
                  <p className="text-sm text-gray-500">Total candidates assigned</p>
                  <p className="text-3xl font-bold text-gray-900">{overview.totalCandidates}</p>
                </div>
              </div>

              <div className="bg-white rounded shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">By Course</h2>
                {overview.perCourse.length === 0 ? (
                  <p className="text-gray-500">No candidates yet.</p>
                ) : (
                  <div className="space-y-3">
                    {overview.perCourse.map((c) => (
                      <div key={c.code} className="flex items-center justify-between border rounded px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-900">{c.title}</p>
                          <p className="text-sm text-gray-600">{c.code}</p>
                        </div>
                        <div className="text-lg font-bold text-gray-900">{c.count}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}


