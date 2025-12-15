'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAuthToken, login, register, storeAuthToken, getUserRole } from "@/lib/api";
import styles from "@/styles/candidatesignin.module.scss";

export default function CandidateSignIn(){
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    classYear: '',
    mobile: '',
  });

  // Redirect if already logged in as student
  useEffect(() => {
    const token = getAuthToken('student');
    const role = getUserRole('student');
    if (token && role === 'student') {
      router.push('/candidate/dashboard');
    }
  }, [router]);

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

  // NEW: Google Sign-In Handler
  const handleGoogleLogin = async (credentialResponse: any) => {
  console.log("Google callback triggered with:", credentialResponse);  // ← Add this

  if (!credentialResponse?.credential) {
    setErrorMessage('No credential received from Google');
    setGoogleLoading(false);
    return;
  }

  setGoogleLoading(true);
  setErrorMessage(null);
  try {
    const res = await fetch('http://localhost:5000/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: credentialResponse.credential })
    });

    const data = await res.json();
    console.log("Backend response:", data);  // ← Add this – this is key!

    if (!data.success) {
      setErrorMessage(data.message || 'Google login failed');
      setGoogleLoading(false);
      return;
    }
    if (!data.data?.user) {
  setErrorMessage('Google login failed. No user data received.');
  setGoogleLoading(false);
  return;
}

if (data.data.user.role !== 'student') {
  setErrorMessage('This Google account is not a student account.');
  setGoogleLoading(false);
  return;
}

// Correct paths
storeAuthToken(data.data.token, 'student');
router.push('/candidate/dashboard');

    // ... rest of your code
  } catch (err: any) {
    console.error("Fetch error:", err);  // ← Add this
    setErrorMessage(err.message || 'Google login failed');
    setGoogleLoading(false);
  }
  
  
};

  // Load Google SDK
    // FIXED: Load Google SDK properly for Next.js
  useEffect(() => {
  // Define FIRST
  const initializeGoogleButton = () => {
    // @ts-ignore
    if (!window.google?.accounts) return;

    // @ts-ignore
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleGoogleLogin,
    });

    // @ts-ignore
    try {
      const el = document.getElementById('googleButtonDiv');
      if (!el) {
        console.warn('Google button element not found: #googleButtonDiv');
        return;
      }

      window.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: '100%',
      });
    } catch (err) {
      console.error('Error rendering Google button', err);
    }
  };

  // If Google SDK already loaded
  if ((window as any).google?.accounts) {
    initializeGoogleButton();
    return;
  }

  // Load Google SDK
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;

  script.onload = initializeGoogleButton;

  document.body.appendChild(script);
}, []);


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
              placeholder="your.email@college.edu"
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

          {/* NEW: Google Sign-In Button */}
          <div style={{ marginTop: '1rem', position: 'relative' }}>
            <div id="googleButtonDiv" style={{ width: '100%' }}></div>
            {googleLoading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}>
                <span className={styles.loader} />
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ textAlign: 'center', margin: '1.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
            or
          </div>

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