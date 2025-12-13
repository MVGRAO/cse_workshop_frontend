'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import styles from "../../styles/shared/employer.module.scss";
import { getAuthToken, getUserRole, storeAuthToken, submitVerifierRequest, verifierLogin } from "@/lib/api";

const EMAIL_PATTERN = /^(?!n\d)[A-Za-z0-9._%+-]+@[\w.-]*rguktn\.ac\.in$/i;

export default function EmployerSignIn() {
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [requestForm, setRequestForm] = useState({ name: '', email: '', phone: '', college: '' });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);
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

  const emailError = useMemo(() => {
    if (!requestForm.email) return '';
    if (!EMAIL_PATTERN.test(requestForm.email)) {
      return 'Use your rguktn.ac.in email and avoid "n" followed by a number';
    }
    return '';
  }, [requestForm.email]);

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

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!requestForm.name || !requestForm.email || !requestForm.college) {
      setMessage({ type: 'error', text: 'Name, email and college are required' });
      return;
    }

    if (emailError) {
      setMessage({ type: 'error', text: emailError });
      return;
    }

    try {
      setLoadingRequest(true);
      await submitVerifierRequest(requestForm);
      setMessage({ type: 'success', text: 'Request sent! We will notify you once approved.' });
      setRequestForm({ name: '', email: '', phone: '', college: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not send request' });
    } finally {
      setLoadingRequest(false);
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
          </div>

          <div className={styles.divider}>Need access?</div>

          <form onSubmit={handleRequest} className={styles.form}>
            <div className={styles.inlineFields}>
              <div className={styles.field}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  value={requestForm.name}
                  onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                  className={styles.input}
                  placeholder="Verifier name"
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>College</label>
                <input
                  type="text"
                  value={requestForm.college}
                  onChange={(e) => setRequestForm({ ...requestForm, college: e.target.value })}
                  className={styles.input}
                  placeholder="RGUKT campus"
                  required
                />
              </div>
            </div>

            <label className={styles.label}>College Email (rguktn.ac.in)</label>
            <input
              type="email"
              value={requestForm.email}
              onChange={(e) => setRequestForm({ ...requestForm, email: e.target.value })}
              className={styles.input}
              placeholder="example@rguktn.ac.in"
              required
            />
            {emailError && <p className={styles.helperError}>{emailError}</p>}

            <label className={styles.label}>Phone (optional)</label>
            <input
              type="tel"
              value={requestForm.phone}
              onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
              className={styles.input}
              placeholder="Phone number"
            />

            <button
              type="submit"
              className={styles.secondaryButton}
              disabled={loadingRequest}
              style={{ opacity: loadingRequest ? 0.7 : 1 }}
            >
              {loadingRequest ? 'Sending request...' : 'Send Request Access'}
            </button>
          </form>

          <p className={styles.agreement}>
            By continuing, you agree to our{" "}
            <a href="#" className={styles.link}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className={styles.link}>
              Privacy Policy
            </a>
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
