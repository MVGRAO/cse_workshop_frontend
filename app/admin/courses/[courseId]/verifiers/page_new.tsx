import CourseVerifiers from '@/components/Admin/CourseVerifiers';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function ManageVerifiersPage({ params }: PageProps) {
  const { courseId } = await params;
  return <CourseVerifiers courseId={courseId} />;
}
