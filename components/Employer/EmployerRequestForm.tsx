'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import styles from "@/styles/employerrequestform.module.scss";
import { submitVerifierRequest } from "@/lib/api";

const EMAIL_PATTERN = /^(?!n\d)[A-Za-z0-9._%+-]+@[\w.-]*rguktn\.ac\.in$/i;

export default function EmployerRequestForm() {
  const router = useRouter();
  const [requestForm, setRequestForm] = useState({ name: '', email: '', phone: '', college: '' });
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const emailError = useMemo(() => {
    if (!requestForm.email) return '';
    if (!EMAIL_PATTERN.test(requestForm.email)) {
      return 'Use your rguktn.ac.in email and avoid "n" followed by a number';
    }
    return '';
  }, [requestForm.email]);

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
            <h1 className={styles.title}>Request Verifier Access</h1>
            <p className={styles.subtitle}>
              Fill in your details to request access as a verifier or employer
            </p>

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
                className={styles.submitButton}
                disabled={loadingRequest}
                style={{ opacity: loadingRequest ? 0.7 : 1 }}
              >
                {loadingRequest ? 'Sending request...' : 'Send Request Access'}
              </button>
            </form>

            <p className={styles.haveAccount}>
              Already have access?{" "}
              <a href="/employer" className={styles.link}>
                Sign in
              </a>
            </p>
          </div>

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
