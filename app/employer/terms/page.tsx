import styles from '@/styles/legal.module.scss';
import LegalFooter from '@/components/Legal/LegalFooter';

export const metadata = {
  title: 'Employer Terms of Service | CSE Course Workshop',
  description: 'Terms of Service for employers using CSE Course Workshop',
};

export default function EmployerTerms() {
  return (
    <main className={styles.legalContainer}>
      <h1 className={styles.title}>Employer Terms of Service</h1>
      <p className={styles.date}><strong>Effective Date:</strong> 15 December 2025</p>

      <section className={styles.section}>
        <p>
          These Terms govern employer access and usage of recruitment
          and candidate-related services on <strong>CSE Course Workshop</strong>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Employer Responsibilities</h2>
        <ul>
          <li>Provide accurate company and job information</li>
          <li>Use candidate data only for recruitment purposes</li>
          <li>Comply with applicable employment laws</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Prohibited Activities</h2>
        <p>
          Employers must not misuse candidate data, post misleading jobs,
          or engage in discriminatory practices.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Account Termination</h2>
        <p>
          We reserve the right to suspend or terminate employer accounts
          for policy violations or misuse of the platform.
        </p>
      </section>
      <LegalFooter role="employer" />
    </main>
  );
}
