'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { authenticatedFetch, getAuthToken } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

interface PageProps {
  params: Promise<{ certificateId: string }>;
}

interface Certificate {
  _id: string;
  student: {
    name: string;
    email: string;
  };
  course: {
    title: string;
    code: string;
    description?: string;
  };
  certificateNumber: string;
  theoryScore: number;
  practicalScore?: number;
  totalScore: number;
  grade: string;
  issueDate: string;
}

export default function CertificateViewPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificate();
  }, []);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const token = getAuthToken('student');
      if (!token) {
        router.replace('/candidate');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/student/certificates/${params.certificateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCertificate(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !certificate) return;

    const htmlContent = generateCertificateHTML(certificate);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generateCertificateHTML = (cert: Certificate) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${cert.certificateNumber}</title>
          <style>
            @media print {
              @page {
                size: A4 landscape;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .certificate-container {
              background: white;
              padding: 60px;
              border: 20px solid #d4af37;
              box-shadow: 0 0 30px rgba(0,0,0,0.3);
              max-width: 1000px;
              text-align: center;
            }
            .certificate-header {
              font-size: 48px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 4px;
            }
            .certificate-subtitle {
              font-size: 24px;
              color: #7f8c8d;
              margin-bottom: 40px;
            }
            .certificate-body {
              font-size: 28px;
              color: #2c3e50;
              margin: 40px 0;
              line-height: 1.8;
            }
            .student-name {
              font-size: 36px;
              font-weight: bold;
              color: #2c3e50;
              text-decoration: underline;
              margin: 20px 0;
            }
            .course-name {
              font-size: 32px;
              font-weight: bold;
              color: #667eea;
              margin: 20px 0;
            }
            .scores {
              margin: 40px 0;
              display: flex;
              justify-content: center;
              gap: 40px;
              flex-wrap: wrap;
            }
            .score-item {
              text-align: center;
            }
            .score-label {
              font-size: 18px;
              color: #7f8c8d;
              margin-bottom: 10px;
            }
            .score-value {
              font-size: 32px;
              font-weight: bold;
              color: #2c3e50;
            }
            .grade {
              font-size: 48px;
              font-weight: bold;
              color: #27ae60;
              margin: 30px 0;
            }
            .certificate-footer {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              font-size: 16px;
              color: #7f8c8d;
            }
            .certificate-number {
              font-size: 14px;
              color: #95a5a6;
              margin-top: 40px;
            }
            .signature-line {
              border-top: 2px solid #2c3e50;
              width: 200px;
              margin: 60px auto 10px;
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <div class="certificate-header">Certificate of Completion</div>
            <div class="certificate-subtitle">This is to certify that</div>
            <div class="student-name">${cert.student.name}</div>
            <div class="certificate-body">
              has successfully completed the course
            </div>
            <div class="course-name">${cert.course.title}</div>
            <div class="course-name" style="font-size: 24px; color: #7f8c8d;">${cert.course.code}</div>
            
            <div class="scores">
              <div class="score-item">
                <div class="score-label">Theory Score</div>
                <div class="score-value">${cert.theoryScore.toFixed(2)}</div>
              </div>
              ${cert.practicalScore !== undefined ? `
              <div class="score-item">
                <div class="score-label">Practical Score</div>
                <div class="score-value">${cert.practicalScore.toFixed(2)}</div>
              </div>
              ` : ''}
              <div class="score-item">
                <div class="score-label">Total Score</div>
                <div class="score-value">${cert.totalScore.toFixed(2)}</div>
              </div>
            </div>
            
            <div class="grade">Grade: ${cert.grade}</div>
            
            <div class="signature-line"></div>
            <div style="font-size: 18px; color: #2c3e50; margin-top: 10px;">Authorized Signature</div>
            
            <div class="certificate-footer">
              <div>
                <div style="font-weight: bold; margin-bottom: 5px;">Date Issued</div>
                <div>${new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              <div>
                <div style="font-weight: bold; margin-bottom: 5px;">Certificate Number</div>
                <div>${cert.certificateNumber}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
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

  if (!certificate) {
    return (
      <PrivateRoute allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">Certificate not found.</p>
              <button
                onClick={() => router.push('/candidate/certificates')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Back to Certificates
              </button>
            </div>
          </div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push('/candidate/certificates')}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to Certificates
            </button>
            <div className="flex gap-4">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Print
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Download
              </button>
            </div>
          </div>

          {/* Certificate Display */}
          <div className="bg-white rounded-lg shadow-lg p-8 print:shadow-none print:p-0">
            <div 
              className="certificate-container"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '40px',
                minHeight: '600px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  background: 'white',
                  padding: '60px',
                  border: '20px solid #d4af37',
                  boxShadow: '0 0 30px rgba(0,0,0,0.3)',
                  maxWidth: '1000px',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '4px' }}>
                  Certificate of Completion
                </div>
                <div style={{ fontSize: '24px', color: '#7f8c8d', marginBottom: '40px' }}>
                  This is to certify that
                </div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2c3e50', textDecoration: 'underline', margin: '20px 0' }}>
                  {certificate.student.name}
                </div>
                <div style={{ fontSize: '28px', color: '#2c3e50', margin: '40px 0', lineHeight: '1.8' }}>
                  has successfully completed the course
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', margin: '20px 0' }}>
                  {certificate.course.title}
                </div>
                <div style={{ fontSize: '24px', color: '#7f8c8d', marginBottom: '40px' }}>
                  {certificate.course.code}
                </div>

                <div style={{ margin: '40px 0', display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#7f8c8d', marginBottom: '10px' }}>Theory Score</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2c3e50' }}>{certificate.theoryScore.toFixed(2)}</div>
                  </div>
                  {certificate.practicalScore !== undefined && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', color: '#7f8c8d', marginBottom: '10px' }}>Practical Score</div>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2c3e50' }}>{certificate.practicalScore.toFixed(2)}</div>
                    </div>
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', color: '#7f8c8d', marginBottom: '10px' }}>Total Score</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2c3e50' }}>{certificate.totalScore.toFixed(2)}</div>
                  </div>
                </div>

                <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#27ae60', margin: '30px 0' }}>
                  Grade: {certificate.grade}
                </div>

                <div style={{ borderTop: '2px solid #2c3e50', width: '200px', margin: '60px auto 10px' }}></div>
                <div style={{ fontSize: '18px', color: '#2c3e50', marginTop: '10px' }}>Authorized Signature</div>

                <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', color: '#7f8c8d' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Date Issued</div>
                    <div>{new Date(certificate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Certificate Number</div>
                    <div>{certificate.certificateNumber}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}

