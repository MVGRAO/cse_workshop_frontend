'use client';

import { use } from 'react';
import PrivateRoute from '@/components/PrivateRoute';
import CourseDetails from '@/components/Candidate/CourseDetails';

interface PageProps {
    params: Promise<{ courseId: string }>;
}

export default function CourseDetailsPage(props: PageProps) {
    const params = use(props.params);
    return (
        <PrivateRoute allowedRoles={['student']}>
            <CourseDetails courseId={params.courseId} />
        </PrivateRoute>
    );
}
