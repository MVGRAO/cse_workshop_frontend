'use client';

import { use } from 'react';
import PrivateRoute from '@/components/PrivateRoute';
import EnrollmentResults from '@/components/Candidate/EnrollmentResults';

interface PageProps {
  params: Promise<{ enrollmentId: string }>;
}

export default function EnrollmentResultsPage(props: PageProps) {
  const params = use(props.params);
  return (
    <PrivateRoute allowedRoles={['student']}>
      <EnrollmentResults enrollmentId={params.enrollmentId} />
    </PrivateRoute>
  );
}



