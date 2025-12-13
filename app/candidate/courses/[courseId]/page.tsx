'use client';

import { use } from 'react';
import PrivateRoute from '@/components/PrivateRoute';
import CoursePlayer from '@/components/Candidate/CoursePlayer';

interface PageProps {
    params: Promise<{ courseId: string }>;
}

export default function CoursePlayerPage(props: PageProps) {
    const params = use(props.params);
    return (
        <PrivateRoute allowedRoles={['student']}>
            <CoursePlayer courseId={params.courseId} />
        </PrivateRoute>
    );
}
