'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { authenticateWithGoogle, storeAuthToken, AuthResponse } from '@/lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: () => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

interface UseGoogleAuthOptions {
  onSuccess?: (data: AuthResponse) => void;
  onError?: (error: Error) => void;
}

export function useGoogleAuth(options: UseGoogleAuthOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to store callbacks to avoid infinite loops
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    // Check if client ID is configured
    if (!clientId) {
      console.warn('NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Please configure it in your .env.local file.');
      setError(new Error('Google Client ID is not configured. Please check your environment variables.'));
      return;
    }

    // Check if script is already loaded
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      // Script already exists, just initialize if Google is available
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            setIsLoading(true);
            setError(null);

            try {
              const authData = await authenticateWithGoogle(response.credential);
              storeAuthToken(authData.data.token, authData.data.user.role);
              onSuccessRef.current?.(authData);
            } catch (err) {
              const error = err instanceof Error ? err : new Error('Authentication failed');
              setError(error);
              onErrorRef.current?.(error);
            } finally {
              setIsLoading(false);
            }
          },
        });
        setIsGoogleLoaded(true);
      }
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            setIsLoading(true);
            setError(null);

            try {
              const authData = await authenticateWithGoogle(response.credential);
              storeAuthToken(authData.data.token, authData.data.user.role);
              onSuccessRef.current?.(authData);
            } catch (err) {
              const error = err instanceof Error ? err : new Error('Authentication failed');
              setError(error);
              onErrorRef.current?.(error);
            } finally {
              setIsLoading(false);
            }
          },
        });
        setIsGoogleLoaded(true);
      }
    };

    script.onerror = () => {
      const error = new Error('Failed to load Google Identity Services');
      setError(error);
      onErrorRef.current?.(error);
    };

    document.body.appendChild(script);

    // No cleanup needed - we want to keep the script loaded
  }, [clientId]); // Only depend on clientId

  const signIn = useCallback(() => {
    if (!clientId) {
      setError(new Error('Google Client ID is not configured. Please check your environment variables.'));
      return;
    }

    if (window.google && isGoogleLoaded) {
      window.google.accounts.id.prompt();
    } else if (!isGoogleLoaded) {
      setError(new Error('Google Identity Services is still loading. Please wait a moment and try again.'));
    } else {
      setError(new Error('Google Identity Services failed to load. Please refresh the page.'));
    }
  }, [isGoogleLoaded, clientId]);

  return {
    signIn,
    isLoading,
    isGoogleLoaded,
    error,
  };
}

