import CourseEdit from '@/components/Admin/CourseEdit';

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseEditPage({ params }: PageProps) {
  const { courseId } = await params;
  return <CourseEdit courseId={courseId} />;
}
