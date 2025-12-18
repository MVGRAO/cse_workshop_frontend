'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { TbMessageStar } from 'react-icons/tb';
import { useToast } from '@/components/common/ToastProvider';
import { getCurrentUser, getAuthToken } from '@/lib/api';
import Button from '@/components/common/Button';
import styles from '@/styles/feedbackform.module.scss';

const FeedbackForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    category: '',
    subject: '',
    feedback: '',
  });

  const { toast } = useToast();

  const categoryOptions = [
    'Feedback to improve platform',
    'Got enrolled in a course',
    'Course content',
    'Assignment issue',
    'Certificate issue',
    'Payment issue',
    'Other',
  ];

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation logic
    if (!isAuthenticated) {
      // For non-authenticated users, require name and email
      if (!formData.firstName || !formData.email) {
        toast({
          title: 'Required',
          description: 'Please provide your name and email address.',
          variant: 'error',
        });
        return;
      }
    }

    if (formData.category === 'Other') {
      if (!formData.subject || !formData.feedback) {
        toast({
          title: 'Required',
          description: "Please fill in all required fields for 'Other' category.",
          variant: 'error',
        });
        return;
      }
    } else if (!formData.feedback) {
      toast({
        title: 'Required',
        description: 'Please enter your feedback message.',
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      // Prepare payload
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const payload = {
        name: fullName || 'Anonymous User',
        email: formData.email || 'guest@example.com',
        subject: formData.category === 'Other' ? formData.subject : formData.category || 'General Feedback',
        message: formData.feedback,
      };

      // For now, we'll just show a success message
      // TODO: Add backend endpoint for feedback submission
      // const response = await submitFeedback(payload);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Success',
        description: 'Thank you for your feedback! We will get back to you soon.',
        variant: 'success',
      });

      // Reset form
      setFormData((prev) => ({
        ...prev,
        category: '',
        subject: '',
        feedback: '',
      }));
    } catch (error: any) {
      const erMsg = error?.message || 'Failed to submit feedback';
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

const getUserProfile = async () => {
  try {
    // Use verifier role for employer area
    const token = getAuthToken('verifier');

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    setIsAuthenticated(true);
    setLoading(true);

    // Use verifier role for employer area
    const response = await getCurrentUser('verifier');

    if (response?.success) {
      const data = response.data;

      let firstName = '';
      let lastName = '';
      let email = '';

      // If employer has name field
      if (data?.name) {
        const nameParts = data.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Employer email
      if (data?.email) {
        email = data.email;
      }

      setFormData(prev => ({
        ...prev,
        firstName,
        lastName,
        email,
        subject: '',
        feedback: '',
      }));
    }
  } catch (error) {
    console.log('Error fetching employer profile:', error);
    setIsAuthenticated(false);
  } finally {
    setLoading(false);
  }
};
;

  useEffect(() => {
    getUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles['feedback-page-container']}>
      <div className={styles['feedback-card']}>
        <div className={styles['form-header']}>
          <TbMessageStar className={styles['header-icon']} />
          <h2>Provide Your Feedback Here</h2>
        </div>

        <form onSubmit={handleSubmit} className={styles['feedback-form']}>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label htmlFor="firstName">
                First Name{!isAuthenticated && ' *'}
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                readOnly={isAuthenticated}
                required={!isAuthenticated}
                placeholder={!isAuthenticated ? 'Enter your first name' : ''}
                disabled={loading}
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                readOnly={isAuthenticated}
                placeholder={!isAuthenticated ? 'Enter your last name' : ''}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="email">
              Email{!isAuthenticated && ' *'}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              readOnly={isAuthenticated}
              required={!isAuthenticated}
              placeholder={!isAuthenticated ? 'Enter your email address' : ''}
              disabled={loading}
            />
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="category">Select a Subject</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="" disabled>
                Select a subject
              </option>
              {categoryOptions.map((opt, index) => (
                <option key={index} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {formData.category === 'Other' && (
            <>
              <div className={styles['form-group']}>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter subject *"
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles['form-group']}>
                <label htmlFor="feedback">Message*</label>
                <textarea
                  id="feedback"
                  name="feedback"
                  rows={4}
                  placeholder="Write your message here"
                  value={formData.feedback}
                  onChange={handleChange}
                  required
                  disabled={loading}
                ></textarea>
              </div>
            </>
          )}

          {formData.category !== 'Other' && (
            <div className={styles['form-group']}>
              <label htmlFor="feedback">Message*</label>
              <textarea
                id="feedback"
                name="feedback"
                rows={4}
                placeholder="Write your message here"
                value={formData.feedback}
                onChange={handleChange}
                required
                disabled={loading}
              ></textarea>
            </div>
          )}

          <div className={styles['button-container']}>
            <Button disabled={loading} type="submit" isLoading={loading} label="Submit" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;

