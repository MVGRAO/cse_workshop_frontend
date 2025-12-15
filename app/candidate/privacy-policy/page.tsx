import styles from '@/styles/legal.module.scss';
import LegalFooter from '@/components/Legal/LegalFooter';

export const metadata = {
  title: 'Candidate Privacy Policy | CSE Course Workshop',
  description: 'Privacy Policy for candidates using CSE Course Workshop platform',
};

export default function CandidatePrivacyPolicy() {
  return (
    <main className={styles.legalContainer}>
      <h1 className={styles.title}>Candidate Privacy Policy</h1>
      <p className={styles.date}><strong>Effective Date:</strong> 15 December 2025</p>

      <section className={styles.section}>
        <p>
          This Privacy Policy explains how <strong>CSE Course Workshop</strong> collects,
          uses, and protects personal information of candidates (students and learners)
          using our platform.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Information We Collect</h2>
        <ul>
          <li>Name, email address, phone number</li>
          <li>Educational details and course enrollments</li>
          <li>Progress, assessments, certificates</li>
          <li>Login and usage data</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>How We Use Your Information</h2>
        <ul>
          <li>To provide access to courses and learning materials</li>
          <li>To issue certificates and track progress</li>
          <li>To send course updates and notifications</li>
          <li>To improve platform performance and learning experience</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Data Protection</h2>
        <p>
          We implement appropriate security measures to protect candidate data.
          Your personal information is never sold to third parties.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Your Rights</h2>
        <p>
          Candidates may request access, correction, or deletion of their data
          by contacting us at <strong>support@csecourseworkshop.com</strong>.
        </p>
      </section>
     <LegalFooter role="candidate" />
    </main>
  );
}
