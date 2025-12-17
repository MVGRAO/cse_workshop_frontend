import AdminCompleteCourseView from '@/components/Admin/AdminCompleteCourseView';

interface PageProps {
    params: Promise<{
        courseId: string;
    }>;
}

export default async function ViewCompleteCoursePage({ params }: PageProps) {
    const resolvedParams = await params;
    return <AdminCompleteCourseView courseId={resolvedParams.courseId} />;
}
