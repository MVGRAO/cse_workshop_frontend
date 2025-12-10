'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../../styles/shared/employer.module.scss";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

export default function EmployerSignIn() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { signIn, isLoading, error } = useGoogleAuth({
    onSuccess: (data) => {
      // Redirect to employer dashboard or home page after successful login
      // You can customize this based on your routing structure
      router.push('/employer/dashboard'); // Adjust this route as needed
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to sign in with Google');
    },
  });

  // Display error from hook if present
  const displayError = error?.message || errorMessage;

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
            <h1 className={styles.title}>
              Employer Sign In
            </h1>

            {displayError && (
              <div style={{ 
                color: '#ef4444', 
                fontSize: '0.875rem', 
                textAlign: 'center',
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                borderRadius: '0.25rem',
                width: '100%',
                marginBottom: '0.5rem'
              }}>
                {displayError}
              </div>
            )}
            
            <button 
              onClick={signIn} 
              className={styles.signInButton}
              disabled={isLoading}
              style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              <Image
                src="/download.png"
                alt="Google"
                width={20}
                height={20}
              />
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
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
            New to Skillina?{" "}
            <a href="#" className={styles.link}>
              Request access as an employer.
            </a>
          </p>
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
