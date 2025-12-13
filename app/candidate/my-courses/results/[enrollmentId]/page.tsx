'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { getStudentEnrollments } from '@/lib/api';

interface PageProps {
  params: Promise<{ enrollmentId: string }>;
}

export default function EnrollmentResultsPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollment();
  }, []);

  const fetchEnrollment = async () => {
    try {
      setLoading(true);
      const response = await getStudentEnrollments();
      if (response.success && response.data) {
        const found = response.data.find((e: any) => e._id === params.enrollmentId);
        if (found) {
          setEnrollment(found);
        }
      }
    } catch (error) {
      console.error('Failed to fetch enrollment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PrivateRoute allowedRoles={['student']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PrivateRoute>
    );
  }

  if (!enrollment || !enrollment.certificate) {
    return (
      <PrivateRoute allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">Results not available yet.</p>
              <button
                onClick={() => router.push('/candidate/my-courses')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Back to My Courses
              </button>
            </div>
          </div>
        </div>
      </PrivateRoute>
    );
  }

  const { certificate, course } = enrollment;

  return (
    <PrivateRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push('/candidate/my-courses')}
              className="text-blue-600 hover:text-blue-700 mb-4"
            >
              ← Back to My Courses
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Course Results</h1>
            <p className="text-gray-600 mt-2">{course.title}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Theory Score</h3>
                <p className="text-3xl font-bold text-blue-600">{certificate.theoryScore.toFixed(2)}</p>
              </div>
              {certificate.practicalScore !== undefined && (
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Practical Score</h3>
                  <p className="text-3xl font-bold text-green-600">{certificate.practicalScore.toFixed(2)}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Score</h3>
                <p className="text-2xl font-bold text-gray-900">{certificate.totalScore.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Grade</h3>
                <span className={`px-4 py-2 rounded text-lg font-bold ${
                  certificate.grade === 'A' ? 'bg-green-100 text-green-800' :
                  certificate.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                  certificate.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                  certificate.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {certificate.grade}
                </span>
              </div>
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">
                  <strong>Certificate Number:</strong> {certificate.certificateNumber}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}

