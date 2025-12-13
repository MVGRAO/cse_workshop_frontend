'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';
import styles from '@/styles/certificateview.module.scss';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

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

interface CertificateViewProps {
  certificateId: string;
}

export default function CertificateView({ certificateId }: CertificateViewProps) {
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

      const response = await fetch(`${API_BASE_URL}/student/certificates/${certificateId}`, {
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
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading certificate...</p>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <p className={styles.errorText}>Certificate not found.</p>
          <button
            onClick={() => router.push('/candidate/certificates')}
            className={styles.backButton}
          >
            Back to Certificates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={() => router.push('/candidate/certificates')}
          className={styles.backLink}
        >
          ← Back to Certificates
        </button>
        <div className={styles.actions}>
          <button onClick={handlePrint} className={styles.printButton}>
            Print
          </button>
          <button onClick={handleDownload} className={styles.downloadButton}>
            Download
          </button>
        </div>
      </div>

      <div className={styles.certificateWrapper}>
        <div className={styles.certificateBackground}>
          <div className={styles.certificateCard}>
            <div className={styles.certificateHeader}>Certificate of Completion</div>
            <div className={styles.certificateSubtitle}>This is to certify that</div>
            <div className={styles.studentName}>{certificate.student.name}</div>
            <div className={styles.certificateBody}>
              has successfully completed the course
            </div>
            <div className={styles.courseName}>{certificate.course.title}</div>
            <div className={styles.courseCode}>{certificate.course.code}</div>

            <div className={styles.scoresContainer}>
              <div className={styles.scoreItem}>
                <div className={styles.scoreLabel}>Theory Score</div>
                <div className={styles.scoreValue}>{certificate.theoryScore.toFixed(2)}</div>
              </div>
              {certificate.practicalScore !== undefined && (
                <div className={styles.scoreItem}>
                  <div className={styles.scoreLabel}>Practical Score</div>
                  <div className={styles.scoreValue}>{certificate.practicalScore.toFixed(2)}</div>
                </div>
              )}
              <div className={styles.scoreItem}>
                <div className={styles.scoreLabel}>Total Score</div>
                <div className={styles.scoreValue}>{certificate.totalScore.toFixed(2)}</div>
              </div>
            </div>

            <div className={styles.grade}>Grade: {certificate.grade}</div>

            <div className={styles.signatureLine}></div>
            <div className={styles.signatureText}>Authorized Signature</div>

            <div className={styles.certificateFooter}>
              <div>
                <div className={styles.footerLabel}>Date Issued</div>
                <div className={styles.footerValue}>
                  {new Date(certificate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div>
                <div className={styles.footerLabel}>Certificate Number</div>
                <div className={styles.footerValue}>{certificate.certificateNumber}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
