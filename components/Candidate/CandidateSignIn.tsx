'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAuthToken, login, register, storeAuthToken, getUserRole } from "@/lib/api";
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import styles from "@/styles/candidatesignin.module.scss";

export default function CandidateSignIn(){
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  // Initialize Google Auth
  const { signIn: googleSignIn, isLoading: googleLoading, error: googleError } = useGoogleAuth({
    onSuccess: (data) => {
      if (!data.data?.user) {
        setErrorMessage('Google login failed. No user data received.');
        return;
      }
      
      if (data.data.user.role !== 'student') {
        setErrorMessage('This Google account is not a student account.');
        return;
      }
      
      // Token already stored by the hook
      router.push('/candidate/dashboard');
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Google login failed');
    }
  });

  // Redirect if already logged in as student
  useEffect(() => {
    const token = getAuthToken('student');
    const role = getUserRole('student');
    if (token && role === 'student') {
      router.push('/candidate/dashboard');
    }
  }, [router]);

  // Display Google Auth errors
  useEffect(() => {
    if (googleError) {
      setErrorMessage(googleError.message);
    }
  }, [googleError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (isLogin) {
        // Login
        const response = await login(formData.email, formData.password);
        
        if (!response.data.user || response.data.user.role !== 'student') {
          setErrorMessage('This account is not a student account. Please use the correct login page.');
          setLoading(false);
          return;
        }
        
        storeAuthToken(response.data.token, 'student');
        router.push('/candidate/dashboard');
      } else {
        // Register
        if (!formData.email.endsWith('@rguktn.ac.in')) {
          setErrorMessage('Only @rguktn.ac.in email addresses are allowed for registration.');
          setLoading(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setErrorMessage('Passwords do not match');
          setLoading(false);
          return;
        }

        if (formData.password.length < 6) {
          setErrorMessage('Password must be at least 6 characters');
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
        
        if (!response.data.user || response.data.user.role !== 'student') {
          setErrorMessage('Registration created wrong account type. Please contact support.');
          setLoading(false);
          return;
        }
        
        storeAuthToken(response.data.token, 'student');
        router.push('/candidate/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };




  return (
    <div className={styles.signInPage}>
      <h1 className={styles.mainTitle}>Candidate Sign In</h1>
      <div className={styles.signInCard}>
        <Image
          src="/Logonew.png"
          alt="CSE Workshop Logo"
          className={styles.logo}
          width={200}
          height={96}
          priority
        />
        
        <div className={styles.signInTextContainer}>
          <p className={styles.subheading}>Sign in to</p>
          <p className={styles.purposeText}>
            Access CSE Workshop Courses and Resources
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          {/* Your existing form fields stay 100% unchanged */}
          {!isLogin && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                required={!isLogin}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={styles.formInput}
                placeholder="Enter your name"
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Email <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={styles.formInput}
              placeholder="your.email@rguktn.ac.in"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Password <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={styles.formInput}
              placeholder="Enter your password (min. 6 characters)"
              minLength={6}
            />
          </div>

          {!isLogin && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Confirm Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="password"
                  required={!isLogin}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={styles.formInput}
                  placeholder="Confirm your password"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  College <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'normal' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className={styles.formInput}
                  placeholder="Your college name"
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Class Year <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'normal' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.classYear}
                    onChange={(e) => setFormData({ ...formData, classYear: e.target.value })}
                    className={styles.formInput}
                    placeholder="e.g., 2024"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Mobile <span style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'normal' }}>(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className={styles.formInput}
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className={styles.googleButton}
            style={{ marginTop: '1rem', width: '100%' }}
          >
            {loading ? (
              <span className={styles.loader} />
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>

          {/* Divider */}
          <div style={{ textAlign: 'center', margin: '1.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
            or
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={googleSignIn}
            disabled={loading || googleLoading}
            className={styles.googleButton}
            style={{ 
              marginTop: '0.5rem', 
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {googleLoading ? (
              <span className={styles.loader} />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.438 15.983 5.482 18 9.003 18z" fill="#34A853"/>
                  <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="text-center" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMessage(null);
                setFormData({
                  name: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  college: '',
                  classYear: '',
                  mobile: '',
                });
              }}
              className={styles.toggleLink}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className={styles.errorMessage}>
            <span>{errorMessage}</span>
            <button 
              className={styles.errorClose} 
              onClick={() => setErrorMessage(null)}
              aria-label="Close error message"
            >
              ✕
            </button>
          </div>
        )}

        <p className={styles.terms}>
          By continuing, you agree to our <br />
          <a target="_blank" href="/candidate/terms">
            Terms of Service
          </a>{" "}
          and{" "}
          <a target="_blank" href="/privacy-policy">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}