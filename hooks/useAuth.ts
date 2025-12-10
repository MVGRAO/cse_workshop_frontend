'use client';

import { useState, useEffect } from 'react';
import { getAuthToken, removeAuthToken } from '@/lib/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const logout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    logout,
  };
}

