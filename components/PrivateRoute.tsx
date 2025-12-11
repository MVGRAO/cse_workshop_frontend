'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, getUserRole } from '@/lib/api';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const role = getUserRole();

    if (!token) {
      router.replace('/candidate');
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
      const fallback = role === 'admin' ? '/admin' : role === 'verifier' ? '/employer' : '/candidate';
      router.replace(fallback);
      return;
    }

    setIsChecking(false);
  }, [router, allowedRoles]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

