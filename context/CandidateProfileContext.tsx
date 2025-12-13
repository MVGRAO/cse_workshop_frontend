'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, getAuthToken } from '@/lib/api';

interface CandidateProfileContextType {
  profileUrl: string | null;
  userName: string | null;
  user: any;
  isLoading: boolean;
  refreshProfile: () => void;
}

const CandidateProfileContext = createContext<CandidateProfileContextType | undefined>(undefined);

export function CandidateProfileProvider({ children }: { children: ReactNode }) {
  const [profileUrl, setProfileUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      // Candidate profile should use student token
      const token = getAuthToken('student');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await getCurrentUser('student');
      if (response.success && response.data) {
        const userData = response.data;
        setUser(userData);
        setUserName(userData.name || null);
        setProfileUrl(userData.avatarUrl || null);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const refreshProfile = () => {
    setIsLoading(true);
    fetchProfile();
  };

  return (
    <CandidateProfileContext.Provider
      value={{
        profileUrl,
        userName,
        user,
        isLoading,
        refreshProfile,
      }}
    >
      {children}
    </CandidateProfileContext.Provider>
  );
}

export function useCandidateProfile() {
  const context = useContext(CandidateProfileContext);
  if (!context) {
    throw new Error('useCandidateProfile must be used within a CandidateProfileProvider');
  }
  return context;
}

