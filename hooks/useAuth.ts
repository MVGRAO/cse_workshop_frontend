'use client';

import { useState, useEffect } from 'react';
import { getAuthToken, removeAuthToken, getUserRole } from '@/lib/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const role = getUserRole();
    const token = role ? getAuthToken(role) : null;
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const logout = () => {
    const role = getUserRole();
    if (role) {
      removeAuthToken(role);
    }
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    logout,
  };
}

