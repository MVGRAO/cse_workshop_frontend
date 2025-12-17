'use client';

import PrivateRoute from '@/components/PrivateRoute';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStudentEnrollments } from '@/lib/api';
import styles from '@/styles/mycourses.module.scss';

interface Enrollment {
  _id: string;
  course?: {
    _id: string;
    title: string;
    description: string;
    status: string;
    resultsGenerated?: boolean;
  } | null;
  status: string;
  progress: number;
  certificate?: {
    theoryScore: number;
    practicalScore?: number;
    totalScore: number;
    grade: string;
    certificateNumber: string;
  } | null;
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTab, setSelectedTab] = useState<'ongoing' | 'completed'>('ongoing');

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await getStudentEnrollments();
        if (response.success) {
          setEnrollments(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch enrollments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
    const interval = setInterval(fetchEnrollments, 5000);
    return () => clearInterval(interval);
  }, []);

  const ongoingCourses = enrollments.filter(e => e.status !== 'completed');
  const completedCourses = enrollments.filter(e => e.status === 'completed');

  return (
    <PrivateRoute allowedRoles={['student']}>
      <div className={styles.myCoursesContainer}>
        <div className={styles.contentWrapper}>
          <h1 className={styles.title}>
            My Enrolled Courses
          </h1>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setSelectedTab('ongoing')}
              style={{
                padding: '0.75rem 1.5rem',
                borderBottom: selectedTab === 'ongoing' ? '3px solid #2563eb' : '3px solid transparent',
                color: selectedTab === 'ongoing' ? '#2563eb' : '#6b7280',
                fontWeight: 600,
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Ongoing ({ongoingCourses.length})
            </button>
            <button
              onClick={() => setSelectedTab('completed')}
              style={{
                padding: '0.75rem 1.5rem',
                borderBottom: selectedTab === 'completed' ? '3px solid #2563eb' : '3px solid transparent',
                color: selectedTab === 'completed' ? '#2563eb' : '#6b7280',
                fontWeight: 600,
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Completed ({completedCourses.length})
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading enrollments...</p>
            </div>
          ) : (selectedTab === 'ongoing' ? ongoingCourses : completedCourses).length === 0 ? (
            <div className={styles.emptyState}>
              <p>No {selectedTab} courses found.</p>
              {selectedTab === 'ongoing' && (
                <Link href="/candidate/courses" className={styles.browseLink}>
                  Browse available courses →
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {(selectedTab === 'ongoing' ? ongoingCourses : completedCourses).map((enrollment) => (
                <div key={enrollment._id} className={styles.courseCard}>
                  <h3 className={styles.courseTitle}>
                    {enrollment.course?.title ?? 'Removed course'}
                  </h3>
                  <p className={styles.courseDescription}>
                    {enrollment.course?.description ?? 'Course content no longer available.'}
                  </p>
                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span>Progress</span>
                      <span>{enrollment.progress || 0}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${enrollment.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <div className={styles.badges}>
                      <span className={`${styles.badge} ${enrollment.status === 'completed' ? styles.badgeGreen : styles.badgeBlue}`}>
                        {enrollment.status}
                      </span>
                      <span className={`${styles.badge} ${enrollment.course?.status === 'published' ? styles.badgeEmerald : styles.badgeGray}`}>
                        {enrollment.course?.status || 'draft'}
                      </span>
                    </div>
                    {enrollment.status === 'completed' ? (
                      enrollment.course?.resultsGenerated ? (
                        <div className={styles.cardActions}>
                          <Link
                            href={`/candidate/my-courses/results/${enrollment._id}`}
                            className={styles.resultsButton}
                          >
                            Review Results
                          </Link>
                          {enrollment.course?._id ? (
                            <Link
                              href={`/candidate/courses/${enrollment.course._id}/view`}
                              className={styles.viewCourseButton}
                            >
                              View Course
                            </Link>
                          ) : (
                            <button disabled className={styles.disabledButton}>
                              Course removed
                            </button>
                          )}
                        </div>
                      ) : (
                        <button disabled className={styles.completedButton}>
                          Results Pending
                        </button>
                      )
                    ) : enrollment.course?.status === 'published' ? (
                      enrollment.course?._id ? (
                        <Link
                          href={`/candidate/courses/${enrollment.course._id}`}
                          className={styles.startButton}
                        >
                          Start Course →
                        </Link>
                      ) : (
                        <button disabled className={styles.disabledButton}>
                          Course removed
                        </button>
                      )
                    ) : (
                      <button disabled className={styles.disabledButton}>
                        Start Course (waiting for publish)
                      </button>
                    )}
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


// 'use client';

// import PrivateRoute from '@/components/PrivateRoute';
// import Link from 'next/link';
// import { useEffect, useState } from 'react';
// import { getStudentEnrollments } from '@/lib/api';

// interface Enrollment {
//   _id: string;
//   course?: {
//     _id: string;
//     title: string;
//     description: string;
//     status: string;
//     resultsGenerated?: boolean;
//   } | null;
//   status: string;
//   progress: number;
// }

// export default function MyCourses() {
//   const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [tab, setTab] = useState<'ongoing' | 'completed'>('completed');

//   useEffect(() => {
//     const fetchData = async () => {
//       const res = await getStudentEnrollments();
//       if (res?.success) setEnrollments(res.data || []);
//       setLoading(false);
//     };
//     fetchData();
//   }, []);

//   const list =
//     tab === 'ongoing'
//       ? enrollments.filter(e => e.status !== 'completed')
//       : enrollments.filter(e => e.status === 'completed');

//   return (
//     <PrivateRoute allowedRoles={['student']}>
//       <div className="page">
//         <h1 className="title">My Courses</h1>

//         <div className="tabs">
//           <button
//             className={tab === 'ongoing' ? 'active' : ''}
//             onClick={() => setTab('ongoing')}
//           >
//             Ongoing
//           </button>
//           <button
//             className={tab === 'completed' ? 'active' : ''}
//             onClick={() => setTab('completed')}
//           >
//             Completed
//           </button>
//         </div>

//         {loading ? (
//           <p>Loading...</p>
//         ) : (
//           <div className="grid">
//             {list.map(e => (
//               <div key={e._id} className="card">
//                 <div className="content">
//                   <h3>{e.course?.title ?? 'Removed course'}</h3>

//                   {e.course?.description && (
//                     <p className="desc">{e.course.description}</p>
//                   )}

//                   <div className="progress">
//                     <span>Progress {e.progress}%</span>
//                     <div className="bar">
//                       <div style={{ width: `${e.progress}%` }} />
//                     </div>
//                   </div>

//                   <div className="badges">
//                     <span className="badge green">{e.status}</span>
//                     <span className="badge green">
//                       {e.course?.status ?? 'draft'}
//                     </span>
//                   </div>
//                 </div>

//                 {/* ✅ ACTIONS – ALWAYS STACKED */}
//                 <div className="actions">
//                   {e.course?.resultsGenerated ? (
//                     <Link
//                       href={`/candidate/my-courses/results/${e._id}`}
//                       className="btn red"
//                     >
//                       Review Results
//                     </Link>
//                   ) : (
//                     <div className="btn pending">Results Pending</div>
//                   )}

//                   {e.course?._id && (
//                     <Link
//                       href={`/candidate/courses/${e.course._id}/view`}
//                       className="btn green"
//                     >
//                       View Course
//                     </Link>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ✅ CSS – MATCHES YOUR IMAGE EXACTLY */}
//       <style jsx>{`
//         .page {
//           padding: 1rem;
//           width: 100%;
//           overflow-x: hidden;
//         }

//         .title {
//           font-size: 1.5rem;
//           font-weight: 700;
//           margin-bottom: 1rem;
//         }

//         .pending {
//   background: linear-gradient(90deg, #f59e0b, #d97706); /* yellow-orange */
//   color: #fff;
//   cursor: not-allowed;
//   opacity: 0.9;
// }


//         .tabs {
//           display: flex;
//           gap: 1.5rem;
//           margin-bottom: 1rem;
//         }

//         .tabs button {
//           background: none;
//           border: none;
//           font-weight: 600;
//           cursor: pointer;
//           padding-bottom: 0.5rem;
//         }

//         .tabs .active {
//           color: #2563eb;
//           border-bottom: 2px solid #2563eb;
//         }

//         /* ✅ GRID */
//         .grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
//           gap: 1rem;
//         }

//         /* ✅ CARD */
//         .card {
//           background: #fff;
//           border-radius: 12px;
//           padding: 1rem;
//           box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);

//           display: flex;
//           flex-direction: column;
//           justify-content: space-between;

//           min-width: 0;
//         }

//         h3 {
//           margin-bottom: 0.5rem;
//         }

//         .desc {
//           font-size: 0.9rem;
//           color: #6b7280;
//           margin-bottom: 0.5rem;
//         }

//         .progress {
//           margin-top: 0.5rem;
//         }

//         .bar {
//           height: 6px;
//           background: #e5e7eb;
//           border-radius: 4px;
//           overflow: hidden;
//         }

//         .bar div {
//           height: 100%;
//           background: #d1d5db;
//         }

//         .badges {
//           display: flex;
//           gap: 0.5rem;
//           margin-top: 0.75rem;
//           flex-wrap: wrap;
//         }

//         .badge {
//           padding: 0.3rem 0.7rem;
//           border-radius: 999px;
//           font-size: 0.75rem;
//           background: #d1fae5;
//           color: #065f46;
//         }

//         /* ✅ ACTIONS */
//         .actions {
//           display: flex;
//           flex-direction: column;
//           gap: 0.6rem;
//           margin-top: 1rem;
//         }

//         .btn {
//           width: 100%;
//           padding: 0.7rem;
//           text-align: center;
//           border-radius: 10px;
//           font-weight: 600;
//           color: #fff;
//         }

//         .red {
//           background: linear-gradient(90deg, #ef4444, #dc2626);
//         }

//         .green {
//           background: linear-gradient(90deg, #10b981, #059669);
//         }

//         .pending {
//           text-align: center;
//           font-weight: 600;
//         }

//         /* ✅ MOBILE – ONE COLUMN */
//         @media (max-width: 1100px) {
//           .grid {
//             grid-template-columns: 1fr;
//           }
//         }
//       `}</style>
//     </PrivateRoute>
//   );
// }





// 'use client';

// import PrivateRoute from '@/components/PrivateRoute';
// import Link from 'next/link';
// import { useEffect, useState } from 'react';
// import { getStudentEnrollments } from '@/lib/api';

// interface Enrollment {
//   _id: string;
//   course?: {
//     _id: string;
//     title: string;
//     description: string;
//     status: string;
//     resultsGenerated?: boolean;
//   } | null;
//   status: string;
//   progress: number;
// }

// export default function MyCourses() {
//   const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [tab, setTab] = useState<'ongoing' | 'completed'>('completed');

//   useEffect(() => {
//     const fetchData = async () => {
//       const res = await getStudentEnrollments();
//       if (res?.success) setEnrollments(res.data || []);
//       setLoading(false);
//     };
//     fetchData();
//   }, []);

//   const list =
//     tab === 'ongoing'
//       ? enrollments.filter(e => e.status !== 'completed')
//       : enrollments.filter(e => e.status === 'completed');

//   return (
//     <PrivateRoute allowedRoles={['student']}>
//       <div className="page">
//         <h1 className="title">My Courses</h1>

//         <div className="tabs">
//           <button onClick={() => setTab('ongoing')} className={tab === 'ongoing' ? 'active' : ''}>
//             Ongoing
//           </button>
//           <button onClick={() => setTab('completed')} className={tab === 'completed' ? 'active' : ''}>
//             Completed
//           </button>
//         </div>

//         {loading ? (
//           <p>Loading...</p>
//         ) : (
//           <div className="grid">
//             {list.map(e => (
//               <div key={e._id} className="card">
//                 <div className="content">
//                   <h3>{e.course?.title ?? 'Removed course'}</h3>

//                   {e.course?.description && (
//                     <p className="desc">{e.course.description}</p>
//                   )}

//                   <div className="progress">
//                     <span>Progress {e.progress}%</span>
//                     <div className="bar">
//                       <div style={{ width: `${e.progress}%` }} />
//                     </div>
//                   </div>

//                   <div className="badges">
//                     <span className="badge">{e.status}</span>
//                     <span className="badge">{e.course?.status ?? 'draft'}</span>
//                   </div>
//                 </div>

//                 {/* ACTIONS */}
//                 <div className="actions">
//                   {e.course?.resultsGenerated ? (
//                     <Link
//                       href={`/candidate/my-courses/results/${e._id}`}
//                       className="btn danger"
//                     >
//                       Review Results
//                     </Link>
//                   ) : (
//                     <div className="btn pending">Results Pending</div>
//                   )}

//                   {e.course?._id && (
//                     <Link
//                       href={`/candidate/courses/${e.course._id}/view`}
//                       className="btn success"
//                     >
//                       View Course
//                     </Link>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ✅ CSS – FIXED SPECIFICITY */}
//       <style jsx>{`
//         .page {
//           padding: 1rem;
//           width: 100%;
//           overflow-x: hidden;
//         }

//         .title {
//           font-size: 1.5rem;
//           font-weight: 700;
//           margin-bottom: 1rem;
//         }

//         .tabs {
//           display: flex;
//           gap: 1.5rem;
//           margin-bottom: 1rem;
//         }

//         .tabs button {
//           background: none;
//           border: none;
//           font-weight: 600;
//           cursor: pointer;
//         }

//         .tabs .active {
//           color: #2563eb;
//           border-bottom: 2px solid #2563eb;
//         }

//         .grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
//           gap: 1rem;
//         }

//         .card {
//           background: #fff;
//           border-radius: 14px;
//           padding: 1rem;
//           box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
//           display: flex;
//           flex-direction: column;
//           justify-content: space-between;
//           min-width: 0;
//         }

//         .desc {
//           font-size: 0.9rem;
//           color: #6b7280;
//         }

//         .bar {
//           height: 6px;
//           background: #e5e7eb;
//           border-radius: 4px;
//           overflow: hidden;
//         }

//         .bar div {
//           height: 100%;
//           background: #d1d5db;
//         }

//         .badges {
//           display: flex;
//           gap: 0.5rem;
//           margin-top: 0.75rem;
//         }

//         .badge {
//           padding: 0.3rem 0.7rem;
//           border-radius: 999px;
//           font-size: 0.75rem;
//           background: #d1fae5;
//           color: #065f46;
//         }

//         .actions {
//           display: flex;
//           flex-direction: column;
//           gap: 0.6rem;
//           margin-top: 1rem;
//         }

//         .btn {
//           width: 100%;
//           padding: 0.75rem;
//           border-radius: 12px;
//           font-weight: 600;
//           text-align: center;
//           color: #fff;
//         }

//         .btn.danger {
//           background: linear-gradient(90deg, #ef4444, #dc2626);
//         }

//         .btn.success {
//           background: linear-gradient(90deg, #10b981, #059669);
//         }

//         /* 🔥 FIX HERE */
//         .btn.pending {
//           background: linear-gradient(90deg, #f59e0b, #d97706);
//           cursor: not-allowed;
//           opacity: 0.95;
//         }

//         @media (max-width: 1100px) {
//           .grid {
//             grid-template-columns: 1fr;
//           }
//         }
//       `}</style>
//     </PrivateRoute>
//   );
// }
