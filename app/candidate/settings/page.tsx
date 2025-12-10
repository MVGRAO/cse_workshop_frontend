'use client';

import PrivateRoute from '@/components/PrivateRoute';
import Settings from '@/components/Candidate/Settings/Settings';

export default function SettingsPage() {
  return (
    <PrivateRoute>
      <Settings />
    </PrivateRoute>
  );
}

