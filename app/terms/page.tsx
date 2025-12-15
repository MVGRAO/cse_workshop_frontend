import styles from '@/styles/legal.module.scss';


export const metadata = {
  title: 'Terms of Service | CSE Course Workshop',
  description: 'Terms of Service for CSE Course Workshop platform',
};

export default function TermsPage() {
  const COMPANY = 'CSE Course Workshop';
  const CONTACT_EMAIL = 'support@csecourseworkshop.com';
  const EFFECTIVE_DATE = '15 December 2025';

  return (
    <main className={styles.legalContainer}>
      <h1 className={styles.title}>Terms of Service</h1>
      <p className={styles.date}><strong>Effective Date:</strong> {EFFECTIVE_DATE}</p>

      <section className={styles.section}>
        <p>
          These Terms of Service ("Terms") govern your access to and use of the
          services provided by {COMPANY} ("we", "us", or "our"). By accessing or
          using the service, you agree to be bound by these Terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>1. Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account
          credentials and for all activities that occur under your account. You
          agree to provide accurate and complete information.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Use of the Service</h2>
        <p>
          You agree to use the service only for lawful purposes and in compliance
          with these Terms. You must not attempt to misuse, disrupt, or gain
          unauthorized access to the platform.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. Content & Submissions</h2>
        <p>
          You retain ownership of the content you submit. By submitting content,
          you grant {COMPANY} a non-exclusive, worldwide license to use, host,
          store, modify, and display such content solely to provide the service.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Payments & Refunds</h2>
        <p>
          Certain features may require payment. All fees are disclosed at the
          time of purchase. Refunds, if applicable, are subject to the refund
          policy displayed on the platform or required by law.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Intellectual Property</h2>
        <p>
          All platform content, including text, videos, graphics, logos, and
          software, is the exclusive property of {COMPANY} or its licensors and is
          protected by intellectual property laws.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Termination</h2>
        <p>
          We may suspend or terminate access to the service at any time for
          violation of these Terms or misuse of the platform. You may stop using
          the service at any time.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Disclaimer & Limitation of Liability</h2>
        <p>
          The service is provided on an "as is" and "as available" basis. To the
          fullest extent permitted by law, {COMPANY} shall not be liable for any
          indirect, incidental, or consequential damages.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Governing Law</h2>
        <p>
          These Terms shall be governed by and interpreted in accordance with the
          laws of India, without regard to conflict of law principles.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to update these Terms at any time. Continued use of
          the service after changes constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Contact</h2>
        <p>
          If you have questions regarding these Terms, contact us at{' '}
          <a className={styles.link} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </main>
  );
}
