'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { getCourseResults } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

interface CourseResult {
  enrollment: {
    _id: string;
    student: {
      _id: string;
      name: string;
      email: string;
      college?: string;
      classYear?: string;
    };
    verifier?: {
      _id: string;
      name: string;
      email: string;
    };
    status: string;
    completedAt?: string;
  };
  certificate: {
    _id: string;
    theoryScore: number;
    practicalScore?: number;
    totalScore: number;
    grade: string;
    certificateNumber: string;
    issueDate: string;
  } | null;
}

export default function CourseResultsPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const { toast } = useToast();
  const [results, setResults] = useState<CourseResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await getCourseResults(params.courseId);
      if (response.success) {
        setResults(response.data || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load course results',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PrivateRoute allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Course Results</h1>
              <p className="text-gray-600 mt-2">View all completed enrollments and their results</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              ← Back
            </button>
          </div>

          {results.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">No completed enrollments found for this course.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theory Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Practical Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.enrollment._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.enrollment.student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.enrollment.student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.enrollment.student.college || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.certificate ? result.certificate.theoryScore.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.certificate && result.certificate.practicalScore !== undefined 
                          ? result.certificate.practicalScore.toFixed(2) 
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {result.certificate ? result.certificate.totalScore.toFixed(2) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {result.certificate ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result.certificate.grade === 'A' ? 'bg-green-100 text-green-800' :
                            result.certificate.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            result.certificate.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            result.certificate.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.certificate.grade}
                          </span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {result.certificate ? (
                          <span className="text-green-600 font-medium">✓ Verified</span>
                        ) : (
                          <span className="text-yellow-600 font-medium">Awaiting Verification</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}

