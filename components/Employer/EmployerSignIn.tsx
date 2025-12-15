'use client';

import Image from "next/image";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "@/styles/employersignin.module.scss";
import { getAuthToken, getUserRole, storeAuthToken, verifierLogin } from "@/lib/api";

export default function EmployerSignIn() {
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    // Check for verifier token specifically
    const token = getAuthToken('verifier');
    const role = getUserRole('verifier');
    if (token && role === 'verifier') {
      router.replace('/employer/dashboard');
    }
    // Don't redirect if user has different role - let them login as verifier in this tab
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!loginForm.email || !loginForm.password) {
      setMessage({ type: 'error', text: 'Please enter email and password' });
      return;
    }

    try {
      setLoadingLogin(true);
      const resp = await verifierLogin(loginForm.email, loginForm.password);
      
      // Verify it's a verifier role
      if (!resp.data.user || resp.data.user.role !== 'verifier') {
        setMessage({ type: 'error', text: 'This account is not a verifier account. Please use the correct login page.' });
        setLoadingLogin(false);
        return;
      }
      
      storeAuthToken(resp.data.token, 'verifier');
      router.push('/employer/dashboard');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to sign in' });
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <Image
            src="/Logonew.png"
            alt="RGUKT logo"
            width={100}
            height={40}
            priority
          />

          <div className={styles.content}>
            <h1 className={styles.title}>Verifier / Employer Access</h1>

            {message && (
              <div
                style={{
                  color: message.type === 'error' ? '#ef4444' : '#047857',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  padding: '0.75rem',
                  backgroundColor: message.type === 'error' ? '#fee2e2' : '#d1fae5',
                  borderRadius: '0.25rem',
                  width: '100%',
                  marginBottom: '0.5rem',
                }}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleLogin} className={styles.form}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className={styles.input}
                placeholder="your.email@rguktn.ac.in"
                required
              />

              <label className={styles.label}>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className={styles.input}
                placeholder="Enter password"
                minLength={6}
                required
              />

              <button
                type="submit"
                className={styles.signInButton}
                disabled={loadingLogin}
                style={{ opacity: loadingLogin ? 0.7 : 1 }}
              >
                {loadingLogin ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className={styles.needAccess}>
              Need access?{" "}
              <a href="/employer/request" className={styles.link}>
                Request Access
              </a>
            </p>
          </div>

          <p className={styles.agreement}>
            By continuing, you agree to our{" "}
             <Link href="/employer/terms" className={styles.link}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/employer/privacy-policy" className={styles.link}>
              Privacy Policy
            </Link>
          </p>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Not an employer?{" "}
            <a href="/candidate" className={styles.link}>
              Sign in as Candidate
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
