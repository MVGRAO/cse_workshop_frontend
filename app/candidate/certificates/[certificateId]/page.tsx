'use client';

import { use } from 'react';
import PrivateRoute from '@/components/PrivateRoute';
import CertificateView from '@/components/Candidate/CertificateView';

interface PageProps {
  params: Promise<{ certificateId: string }>;
}

export default function CertificateViewPage(props: PageProps) {
  const params = use(props.params);
  return (
    <PrivateRoute allowedRoles={['student']}>
      <CertificateView certificateId={params.certificateId} />
    </PrivateRoute>
  );
}



