'use client';

import React, { useEffect, ChangeEvent, useRef, useState } from 'react';
import { BsTrash } from 'react-icons/bs';
import { useToast } from '@/components/common/ToastProvider';
import { getCurrentUser, updateProfile, deleteAccount, getAuthToken, removeAuthToken } from '@/lib/api';
import Button from '@/components/common/Button';
import { useRouter } from 'next/navigation';
import styles from '@/styles/settings.module.scss';

const Settings: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    mobile: '',
    college: '',
    classYear: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [profileFileName, setProfileFileName] = useState('');
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileUrl, setProfileUrl] = useState<string>('');

  // Token validation function
  const validateToken = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No token found');
        router.push('/candidate');
        return false;
      }
      return true;
    } catch (error: any) {
      console.error('Token validation error:', error);
      if (error?.response?.status === 401) {
        removeAuthToken();
        router.push('/candidate');
        return false;
      }
      return true; // Other errors don't invalidate token
    }
  };

  // Complete logout function
  const completeLogout = () => {
    console.log('Performing complete logout...');

    // Clear all possible storage
    removeAuthToken();
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies manually
    document.cookie.split(';').forEach(function (c) {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });

    // Redirect to login
    router.push('/candidate');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getUserProfile = async () => {
    try {
      setLoading(true);

      // Validate token before making API call
      const isTokenValid = await validateToken();
      if (!isTokenValid) {
        return;
      }

      const response = await getCurrentUser();
      if (response?.success) {
        console.log('getUserProfile called');
        console.log(response.data);
        const newData = {
          name: response.data.name || '',
          phone: response.data.phoneNumber || '',
          email: response.data.email || '',
          mobile: response.data.mobile || '',
          college: response.data.college || '',
          classYear: response.data.classYear || '',
        };
        setFormData(newData);
        setProfileUrl(response.data?.avatarUrl || '');
      }
    } catch (error: any) {
      const erMsg = error?.message || 'Failed to get profile';

      // Check if error message indicates authentication failure
      if (erMsg.includes('token') || erMsg.includes('authentication') || erMsg.includes('Unauthorized')) {
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'error',
        });
        removeAuthToken();
        router.push('/candidate');
        return;
      }

      toast({
        title: 'Failed',
        description: erMsg,
        variant: 'error',
      });
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async () => {
    try {
      setLoading(true);

      // Validate token before making API call
      const isTokenValid = await validateToken();
      if (!isTokenValid) {
        return;
      }

      const data: {
        name?: string;
        phone?: string;
        email?: string;
        mobile?: string;
        college?: string;
        classYear?: string;
      } = {};

      if (formData.name) data.name = formData.name;
      if (formData.phone) data.phone = formData.phone;
      if (formData.email) data.email = formData.email;
      if (formData.mobile) data.mobile = formData.mobile;
      if (formData.college) data.college = formData.college;
      if (formData.classYear) data.classYear = formData.classYear;

      const response = await updateProfile(data);
      if (response?.success) {
        console.log(response.data);
        toast({
          title: 'Success',
          description: response?.message || 'Profile updated!',
          variant: 'success',
        });
        // Refresh profile data
        getUserProfile();
      }
    } catch (error: any) {
      const erMsg = error?.message || 'Failed to update profile';

      // Check if error message indicates authentication failure
      if (erMsg.includes('token') || erMsg.includes('authentication') || erMsg.includes('Unauthorized')) {
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'error',
        });
        removeAuthToken();
        router.push('/candidate');
        return;
      }

      toast({
        title: 'Failed',
        description: erMsg,
        variant: 'error',
      });
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (imgFile: any) => {
    console.log('Uploading profile picture...');
    // Note: Profile picture upload would need backend support
    // For now, we'll show a message that it's not yet implemented
    toast({
      title: 'Feature Coming Soon',
      description: 'Profile picture upload will be available soon.',
      variant: 'info',
    });
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);

      // Validate token before making API call
      const isTokenValid = await validateToken();
      if (!isTokenValid) {
        return;
      }

      const response = await deleteAccount();
      console.log(response);
      if (response?.success) {
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);
        // Clear all local storage data completely
        removeAuthToken();
        localStorage.clear();

        // Also clear any session storage
        sessionStorage.clear();

        // Clear any cookies that might be set
        document.cookie.split(';').forEach(function (c) {
          document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        });

        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          setShowDeleteSuccess(false);
          completeLogout();
        }, 3000);
      }
    } catch (error: any) {
      const erMsg = error?.message || 'Failed to delete account';
      toast({
        title: 'Failed',
        description: erMsg,
        variant: 'error',
      });
      console.log(error);
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);

      toast({
        title: 'Success',
        description: 'Logged out successfully',
        variant: 'success',
      });

      // Use complete logout function
      completeLogout();
    } catch (error: any) {
      const erMsg = error?.message || 'Failed to log out';
      toast({
        title: 'Failed',
        description: erMsg,
        variant: 'error',
      });
      console.log(error);

      // Even if there's an error, still log out locally
      completeLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      setProfileFileName(file.name);
      handleUpload(file);
    }
  };

  const deleteProfilePicture = async () => {
    // If no profile picture, show info toast and do nothing
    if (!profileUrl) {
      toast({
        title: 'No Profile Picture',
        description: 'There is no profile picture to delete.',
        variant: 'error',
      });
      return;
    }
    // Note: Profile picture deletion would need backend support
    toast({
      title: 'Feature Coming Soon',
      description: 'Profile picture deletion will be available soon.',
      variant: 'info',
    });
  };

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      getUserProfile();
      hasFetched.current = true;
    }
  }, []);

  return (
    <div className={styles['settings-form-container']}>
      <h1 className={styles['page-title']}>Settings</h1>
      <p className={styles['delete-subtitle']}>Manage your account preferences.</p>
      {/* Information Section */}
      <section className={styles['settings-card']}>
        <div className={styles['card-header']}>
          <h2 className={styles['card-title']}>Profile Settings</h2>
          <button className={styles['save-button']} onClick={updateUserProfile} disabled={loading}>
            Save Changes
          </button>
        </div>
        <div className={styles['card-body']}>
          <div className={styles['form-grid']}>
            <div className={styles['form-group']}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="mobile">Mobile</label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="college">College</label>
              <input
                type="text"
                id="college"
                name="college"
                value={formData.college}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="classYear">Class Year</label>
              <input
                type="text"
                id="classYear"
                name="classYear"
                value={formData.classYear}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Account Section */}
      <section className={styles['settings-card']}>
        <div className={styles['card-header']}>
          <h2 className={styles['card-title']}>Account</h2>
        </div>
        <div className={styles['card-body']}>
          <div className={styles['delete-account-row']} onClick={handleDeleteClick}>
            <div className={styles['delete-text']}>
              <p className={styles['delete-title']}>Delete Account</p>
              <p className={styles['delete-subtitle']}>Permanently remove your account and data</p>
            </div>
            <BsTrash className={styles['delete-icon']} />
          </div>
        </div>
      </section>

      <section className={styles['settings-card']}>
        <div className={styles['card-header']}>
          <h2 className={styles['card-title']}>Upload Photo</h2>
        </div>
        <div className={styles['card-body']}>
          <section className={styles['form-section']}>
            <div className={`${styles['resume-content']} ${styles['resume-display']}`}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".jpeg,.png,.jpg"
              />
              <div className={`${styles['file-info']} ${styles['profile-image-container']}`}>
                <img
                  src={
                    profileUrl ||
                    'https://toppng.com//public/uploads/preview/donna-picarro-dummy-avatar-115633298255iautrofxa.png'
                  }
                  alt="Profile Preview"
                  width={120}
                  height={120}
                  className={styles['profile-image']}
                />
              </div>
              <div className={styles['profile-button-container']}>
                <button
                  type="button"
                  className={`${styles.button} ${styles['button-primary']}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </button>
                <BsTrash onClick={deleteProfilePicture} className={styles['delete-icon']} />
              </div>
            </div>
          </section>
        </div>
      </section>
      <div className={styles['sign-out-container']}>
        <Button isLoading={loading} label="Sign Out" onClick={handleSignOut} className={styles['sign-out-button-red']} />
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles['modal-overlay']}>
          <div className={styles['modal-content']}>
            <h3>Delete Account</h3>
            <p>
              Deleting your account will erase all your information and your account. You can create a new account in
              future. Can you confirm you want to delete your account?
            </p>
            <div className={styles['modal-buttons']}>
              <Button
                isLoading={loading}
                label="Delete Account"
                onClick={handleDeleteAccount}
                className={styles['delete-button']}
              />
              <Button label="Keep Account" onClick={handleDeleteCancel} className={styles['cancel-button']} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccess && (
        <div className={styles['modal-overlay']}>
          <div className={styles['modal-content']}>
            <h3>Account Deleted Successfully</h3>
            <p>
              Your account has been successfully deleted. All your information has been removed. Redirecting to
              login...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

