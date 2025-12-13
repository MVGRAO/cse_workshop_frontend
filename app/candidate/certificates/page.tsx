'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { authenticatedFetch, getAuthToken } from '@/lib/api';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

interface Certificate {
  _id: string;
  course: {
    _id: string;
    title: string;
    code: string;
  };
  certificateNumber: string;
  theoryScore: number;
  practicalScore?: number;
  totalScore: number;
  grade: string;
  issueDate: string;
}

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = getAuthToken('student');
      if (!token) {
        router.replace('/candidate');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/student/certificates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCertificates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
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

  return (
    <PrivateRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificates</h1>
          <p className="text-gray-600 mb-8">
            {certificates.length === 0 
              ? 'No certificates yet' 
              : `You have ${certificates.length} certificate${certificates.length > 1 ? 's' : ''}`}
          </p>

          {certificates.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Certificates</h2>
              <p className="text-gray-500 mb-6">You haven't earned any certificates yet. Complete courses to earn certificates!</p>
              <Link
                href="/candidate/courses"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Browse Courses →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((certificate) => (
                <div key={certificate._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {certificate.course.title}
                      </h3>
                      <p className="text-sm text-gray-600">{certificate.course.code}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      certificate.grade === 'A' ? 'bg-green-100 text-green-800' :
                      certificate.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                      certificate.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      certificate.grade === 'D' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {certificate.grade}
                    </span>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Theory Score:</span>
                      <span className="font-medium text-gray-900">{certificate.theoryScore.toFixed(2)}</span>
                    </div>
                    {certificate.practicalScore !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Practical Score:</span>
                        <span className="font-medium text-gray-900">{certificate.practicalScore.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-900 font-semibold">Total Score:</span>
                      <span className="font-bold text-gray-900">{certificate.totalScore.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500">
                      Certificate #: {certificate.certificateNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      Issued: {new Date(certificate.issueDate).toLocaleDateString()}
                    </p>
                  </div>

                  <Link
                    href={`/candidate/certificates/${certificate._id}`}
                    className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    View Certificate
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}

