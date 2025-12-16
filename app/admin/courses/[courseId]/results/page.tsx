import CourseResults from '@/components/Admin/CourseResults';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseResultsPage({ params }: PageProps) {
  const { courseId } = await params;
  return <CourseResults courseId={courseId} />;
}



