import styles from '@/styles/legal.module.scss';
import LegalFooter from '@/components/Legal/LegalFooter';

export const metadata = {
  title: 'Employer Privacy Policy | CSE Course Workshop',
  description: 'Privacy Policy for employers using CSE Course Workshop platform',
};

export default function EmployerPrivacyPolicy() {
  return (
    <main className={styles.legalContainer}>
      <h1 className={styles.title}>Employer Privacy Policy</h1>
      <p className={styles.date}><strong>Effective Date:</strong> 15 December 2025</p>

      <section className={styles.section}>
        <p>
          This Privacy Policy governs how <strong>CSE Course Workshop</strong>
          collects and uses information from employers using our platform.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Information We Collect</h2>
        <ul>
          <li>Company name, contact details</li>
          <li>Recruiter or HR contact information</li>
          <li>Job postings and hiring preferences</li>
          <li>Platform usage data</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Use of Information</h2>
        <ul>
          <li>To facilitate candidate discovery and hiring</li>
          <li>To communicate platform updates</li>
          <li>To improve recruitment services</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Data Security</h2>
        <p>
          Employer data is securely stored and only accessible to authorized
          personnel. We do not share employer data without consent.
        </p>
      </section>
      <LegalFooter role="employer" />
    </main>
  );
}
