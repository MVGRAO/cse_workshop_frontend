'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken, getUserRole, hasRoleToken } from '@/lib/api';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Determine expected role from pathname if not specified
    let expectedRole: string | null = null;
    if (pathname?.startsWith('/admin')) {
      expectedRole = 'admin';
    } else if (pathname?.startsWith('/employer') || pathname?.startsWith('/verifier')) {
      expectedRole = 'verifier';
    } else if (pathname?.startsWith('/candidate') || pathname?.startsWith('/student')) {
      expectedRole = 'student';
    }

    // If allowedRoles specified, use first one as expected role
    if (allowedRoles && allowedRoles.length > 0) {
      expectedRole = allowedRoles[0];
    }

    // Get token for expected role (allows separate tabs)
    const token = expectedRole ? getAuthToken(expectedRole) : getAuthToken();
    const role = expectedRole ? getUserRole(expectedRole) : getUserRole();

    if (!token) {
      // No token - redirect to appropriate login page
      const loginPage = expectedRole === 'admin' ? '/admin' : expectedRole === 'verifier' ? '/employer' : '/candidate';
      router.replace(loginPage);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      // Check if current role matches allowed roles
      if (!role || !allowedRoles.includes(role)) {
        // User doesn't have required role - redirect to their role's home
        const fallback = role === 'admin' ? '/admin' : role === 'verifier' ? '/employer' : '/candidate/dashboard';
        router.replace(fallback);
        return;
      }
    } else if (expectedRole && role !== expectedRole) {
      // Role mismatch - redirect to correct role home
      const fallback = role === 'admin' ? '/admin' : role === 'verifier' ? '/employer/dashboard' : '/candidate/dashboard';
      router.replace(fallback);
      return;
    }

    setIsChecking(false);
  }, [router, allowedRoles, pathname]);

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

