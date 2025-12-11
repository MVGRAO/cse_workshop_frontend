'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/ToastProvider';
import styles from './verifier.module.scss';

/**
 * Verifier Login Page
 * Allows verifiers to login with email/password or request access
 */
export default function VerifierPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
      router.push('/verifier/dashboard');
    }
    setIsLoading(false);
  }, []);

  /**
   * Handle verifier login
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "error",
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch(`${API_BASE_URL}/verifier/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.token) {
        // Store the token
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_role', 'verifier');

        setIsAuthenticated(true);
        toast({
          title: "Success",
          description: "Verifier login successful",
          variant: "success",
        });

        router.push('/verifier/dashboard');
      } else {
        throw new Error(data.message || "Invalid credentials");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to login. Please check your credentials.",
        variant: "error",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Verifier Login</h1>
        <p className={styles.subtitle}>Sign in to access the verification dashboard</p>

        {!showRequestForm ? (
          <>
            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoggingIn}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoggingIn}
                />
              </div>
              <button type="submit" className={styles.submitButton} disabled={isLoggingIn}>
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className={styles.divider}>
              <span>Don't have an account?</span>
            </div>

            <button
              onClick={() => setShowRequestForm(true)}
              className={styles.requestAccessButton}
            >
              Request Access as a Verifier
            </button>
          </>
        ) : (
          <RequestAccessForm
            onCancel={() => setShowRequestForm(false)}
            onSuccess={() => {
              setShowRequestForm(false);
              setEmail("");
              setPassword("");
              toast({
                title: "Success",
                description: "Your request has been submitted. Please wait for admin approval.",
                variant: "success",
              });
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Request Access Form Component
 */
function RequestAccessForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

  /**
   * Validate email format (must be @rguktn.ad domain)
   */
  const validateEmail = (emailToValidate: string): boolean => {
    // Regex: must contain letter or digit, followed by @rguktn.ad
    const emailRegex = /^[a-zA-Z0-9]+@rguktn\.ad$/;
    return emailRegex.test(emailToValidate);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your name",
        variant: "error",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your email",
        variant: "error",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Validation Error",
        description: "Please use your @rguktn.ad email address",
        variant: "error",
      });
      return;
    }

    if (!college.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your college name",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/verifier/request-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          college: college.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
      } else {
        throw new Error(data.message || "Failed to submit request");
      }
    } catch (error: any) {
      console.error("Request submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.requestForm}>
      <h3 className={styles.formTitle}>Request Verifier Access</h3>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="req_name">Full Name *</label>
          <input
            id="req_name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="req_email">Email (RGUKTN Domain) *</label>
          <input
            id="req_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@rguktn.ad"
            required
            disabled={isSubmitting}
          />
          {email && !validateEmail(email) && (
            <p className={styles.errorText}>Please use your @rguktn.ad email address</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="req_phone">Phone Number (Optional)</label>
          <input
            id="req_phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="req_college">College Name *</label>
          <input
            id="req_college"
            type="text"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="Enter your college name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isSubmitting}
          >
            Back to Login
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
