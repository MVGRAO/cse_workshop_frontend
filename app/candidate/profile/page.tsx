'use client';

import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/api';

export default function CandidateProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getCurrentUser();
        if (response.success) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <PrivateRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            My Profile
          </h1>

          <div className="bg-white rounded-lg shadow p-6">
            {user && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <p className="mt-1 text-lg text-gray-900">{user.name || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-lg text-gray-900">{user.email || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <p className="mt-1 text-lg text-gray-900 capitalize">{user.role || 'N/A'}</p>
                </div>

                {user.avatarUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}

