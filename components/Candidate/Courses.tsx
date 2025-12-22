'use client';

import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, getStudentEnrollments } from '@/lib/api';
import styles from '@/styles/courses.module.scss';
import { useCandidateProfile } from '@/context/CandidateProfileContext';

import { Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface Course {
  _id: string;
  title: string;
  description: string;
  status: string;
  image?: string;
  enrolled?: boolean;
}

export default function Courses() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken('student');
      console.log(token);
      if (!token) return;
      
      const [coursesRes, enrollmentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/student/courses/available`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        getStudentEnrollments().catch(() => ({ data: [] }))
      ]);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const enrollmentsData = enrollmentsRes.data || [];

        const enrollmentMap = new Map();
        enrollmentsData.forEach((e: any) => {
          const rawCourse = e.course;
          const courseId = rawCourse ? (rawCourse._id ?? rawCourse).toString() : null;
          if (courseId) enrollmentMap.set(courseId, e);
        });

        if (coursesData.success) {
          const formattedCourses = (coursesData.data || []).map((course: any) => {
            const enrollment = enrollmentMap.get(course._id);
            return {
              ...course,
              enrolled: !!enrollment,
            };
          });
          setCourses(formattedCourses);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (courseId: string) => {
    router.push(`/candidate/courses/${courseId}/details`);
  };

  return (
    <PrivateRoute allowedRoles={['student']}>
      <div className={styles.coursesContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Available Courses</h1>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
              <p className="text-gray-500 font-medium">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No courses available at the moment</p>
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {courses.map((course) => (
                <div key={course._id} className={styles.courseCard} onClick={() => handleCardClick(course._id)}>
                  {/* Course Image */}
                  <div className={styles.courseImageWrapper}>
                    <img
                      src={course.image || 'https://via.placeholder.com/400x200?text=Course+Image'}
                      alt={course.title}
                      className={styles.courseImage}
                    />
                    {course.enrolled && (
                      <div className={styles.enrolledBadge}>
                        Enrolled
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className={styles.cardContent}>
                    <h3 className={styles.courseTitle}>{course.title}</h3>
                    <div className={styles.courseDescription}>
                      {course.description ? (course.description.length > 100 ? course.description.substring(0, 100) + '...' : course.description) : 'No description available'}
                    </div>
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