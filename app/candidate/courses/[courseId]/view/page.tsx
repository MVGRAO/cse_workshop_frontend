'use client';

import { useParams } from 'next/navigation';
import CourseReviewPlayer from '@/components/Candidate/CourseReviewPlayer';
import PrivateRoute from '@/components/PrivateRoute';

export default function CourseViewPage() {
    const params = useParams();
    const courseId = params?.courseId as string;

    return (
        <PrivateRoute allowedRoles={['student']}>
            <CourseReviewPlayer courseId={courseId} />
        </PrivateRoute>
    );
}
