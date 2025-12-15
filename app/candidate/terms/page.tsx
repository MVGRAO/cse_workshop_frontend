import styles from '@/styles/legal.module.scss';
import LegalFooter from '@/components/Legal/LegalFooter';

export const metadata = {
  title: 'Candidate Terms of Service | CSE Course Workshop',
  description: 'Terms of Service for candidates using CSE Course Workshop',
};

export default function CandidateTerms() {
  return (
    <main className={styles.legalContainer}>
      <h1 className={styles.title}>Candidate Terms of Service</h1>
      <p className={styles.date}><strong>Effective Date:</strong> 15 December 2025</p>

      <section className={styles.section}>
        <p>
          These Terms apply to all candidates accessing courses and services
          provided by <strong>CSE Course Workshop</strong>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Account Responsibility</h2>
        <p>
          Candidates are responsible for maintaining the confidentiality of
          their account credentials and activity.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Course Usage</h2>
        <ul>
          <li>Course materials are for personal learning only</li>
          <li>Sharing or reselling content is strictly prohibited</li>
          <li>Certificates are issued based on completion criteria</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Termination</h2>
        <p>
          We reserve the right to suspend or terminate candidate accounts
          for misuse, fraud, or violation of these terms.
        </p>
      </section>
      <LegalFooter role="candidate" />
    </main>
  );
}
