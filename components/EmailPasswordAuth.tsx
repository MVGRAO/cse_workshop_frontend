'use client';

import { useState } from 'react';
import { register, login, storeAuthToken } from '@/lib/api';
import styles from '@/styles/shared/candidate.module.scss';

interface EmailPasswordAuthProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function EmailPasswordAuth({ onSuccess, onError }: EmailPasswordAuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    classYear: '',
    mobile: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await login(formData.email, formData.password);
        storeAuthToken(response.data.token);
        onSuccess();
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          onError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          onError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }

        const response = await register(
          formData.email,
          formData.password,
          formData.name,
          formData.college || undefined,
          formData.classYear || undefined,
          formData.mobile || undefined
        );
        storeAuthToken(response.data.token);
        onSuccess();
      }
    } catch (err: any) {
      onError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {!isLogin && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            required={!isLogin}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Enter your name"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="your.email@college.edu"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="Enter your password"
          minLength={6}
        />
      </div>

      {!isLogin && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required={!isLogin}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              College (Optional)
            </label>
            <input
              type="text"
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Your college name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Year (Optional)
              </label>
              <input
                type="text"
                value={formData.classYear}
                onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile (Optional)
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Phone number"
              />
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full ${styles.googleButton}`}
        style={{ marginTop: '1rem' }}
      >
        {loading ? (
          <span className={styles.loader} />
        ) : (
          <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>

      {!isLogin && (
        <div className="text-center">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Forgot password?
          </button>
        </div>
      )}
    </form>
  );
}

