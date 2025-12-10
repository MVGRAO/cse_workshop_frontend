'use client';

import PrivateRoute from '@/components/PrivateRoute';
import FeedbackForm from '@/components/Candidate/Feedback/FeedbackForm';

export default function FeedbackPage() {
  return (
    <PrivateRoute>
      <FeedbackForm />
    </PrivateRoute>
  );
}

