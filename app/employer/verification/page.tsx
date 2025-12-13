'use client';

import { useState, useEffect } from 'react';
import PrivateRoute from '@/components/PrivateRoute';
import { getCompletedStudentsForVerification, verifyAndGenerateCertificate, getVerifiedStudents } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';

interface CompletedStudent {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  course: {
    _id: string;
    title: string;
    code: string;
    hasPracticalSession: boolean;
  };
  status: string;
  completedAt: string;
}

export default function VerificationPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<CompletedStudent[]>([]);
  const [verifiedStudents, setVerifiedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [practicalScores, setPracticalScores] = useState<{ [key: string]: string }>({});
  const [practicalMarksAdded, setPracticalMarksAdded] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchStudents();
    fetchVerifiedStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getCompletedStudentsForVerification();
      if (response.success) {
        setStudents(response.data || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load completed students',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVerifiedStudents = async () => {
    try {
      const response = await getVerifiedStudents();
      if (response.success) {
        setVerifiedStudents(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to load verified students:', error);
    }
  };

  const handleAddPracticalMarks = (enrollmentId: string) => {
    const score = practicalScores[enrollmentId];
    if (!score || isNaN(parseFloat(score)) || parseFloat(score) < 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid practical score',
        variant: 'error',
      });
      return;
    }
    
    // Mark practical marks as added
    setPracticalMarksAdded(prev => ({ ...prev, [enrollmentId]: true }));
    toast({
      title: 'Success',
      description: 'Practical marks added. You can now verify the student.',
      variant: 'success',
    });
  };

  const handleVerify = async (enrollmentId: string, hasPractical: boolean) => {
    // If course has practical, require practical marks to be added first
    if (hasPractical && !practicalMarksAdded[enrollmentId]) {
      toast({
        title: 'Error',
        description: 'Please add practical marks before verifying',
        variant: 'error',
      });
      return;
    }

    try {
      setVerifyingId(enrollmentId);
      const practicalScore = hasPractical ? parseFloat(practicalScores[enrollmentId]) : undefined;
      
      if (hasPractical && (isNaN(practicalScore!) || practicalScore! < 0)) {
        toast({
          title: 'Error',
          description: 'Please enter a valid practical score',
          variant: 'error',
        });
        return;
      }

      const response = await verifyAndGenerateCertificate(enrollmentId, practicalScore);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Certificate generated! Theory: ${response.data.certificate.theoryScore}, Total: ${response.data.certificate.totalScore}`,
          variant: 'success',
        });
        
        // Remove from unverified list and add to verified list
        const verifiedStudent = students.find(s => s._id === enrollmentId);
        if (verifiedStudent) {
          setVerifiedStudents(prev => [...prev, { ...verifiedStudent, certificate: response.data.certificate }]);
        }
        setStudents(prev => prev.filter(s => s._id !== enrollmentId));
        setPracticalScores(prev => {
          const newScores = { ...prev };
          delete newScores[enrollmentId];
          return newScores;
        });
        setPracticalMarksAdded(prev => {
          const newMarks = { ...prev };
          delete newMarks[enrollmentId];
          return newMarks;
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify and generate certificate',
        variant: 'error',
      });
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <PrivateRoute allowedRoles={['verifier']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute allowedRoles={['verifier']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Verification</h1>

          {/* Unverified Students Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Awaiting Verification</h2>
            {students.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">No completed students awaiting verification.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Add Practical Marks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verify</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.student._id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.course.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {student.course.hasPracticalSession ? (
                            practicalMarksAdded[student._id] ? (
                              <span className="text-green-600 font-medium">✓ Added: {practicalScores[student._id]}</span>
                            ) : (
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  placeholder="Practical marks"
                                  value={practicalScores[student._id] || ''}
                                  onChange={(e) => setPracticalScores(prev => ({ ...prev, [student._id]: e.target.value }))}
                                  className="border border-gray-300 rounded px-3 py-1 w-32 text-sm"
                                />
                                <button
                                  onClick={() => handleAddPracticalMarks(student._id)}
                                  className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
                                >
                                  Add
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleVerify(student._id, student.course.hasPracticalSession)}
                            disabled={verifyingId === student._id || (student.course.hasPracticalSession && !practicalMarksAdded[student._id])}
                            className={`px-4 py-2 rounded text-sm ${
                              (student.course.hasPracticalSession && !practicalMarksAdded[student._id])
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            } disabled:bg-gray-400`}
                          >
                            {verifyingId === student._id ? 'Verifying...' : 'Verify'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Verified Students Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Verified Students</h2>
            {verifiedStudents.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">No verified students yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theory Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Practical Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {verifiedStudents.map((student: any) => (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.student._id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.course.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.certificate?.theoryScore || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.certificate?.practicalScore || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {student.certificate?.totalScore || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="text-green-600 font-medium">✓ Verified</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}


