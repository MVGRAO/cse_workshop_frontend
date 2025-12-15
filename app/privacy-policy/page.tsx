import styles from '@/styles/legal.module.scss';

export const metadata = {
  title: 'Privacy Policy | CSE Course Workshop',
  description: 'Privacy Policy for CSE Course Workshop platform',
};

export default function PrivacyPolicyPage() {
  const COMPANY = 'CSE Course Workshop';
  const CONTACT_EMAIL = 'support@csecourseworkshop.com';
  const EFFECTIVE_DATE = '15 December 2025';

  return (
    <main className={styles.legalContainer}>
      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.date}><strong>Effective Date:</strong> {EFFECTIVE_DATE}</p>

      <section className={styles.section}>
        <p>
          {COMPANY} (“we”, “us”, or “our”) operates this platform. This Privacy
          Policy explains how we collect, use, disclose, and safeguard your
          information when you use our services.
        </p>
      </section>

      <section className={styles.section}>
        <h2>1. Information We Collect</h2>
        <ul>
          <li>Account information such as name and email address</li>
          <li>Authentication and login details</li>
          <li>Course enrollments, progress, and submissions</li>
          <li>Usage data such as pages visited and timestamps</li>
          <li>Third-party data (e.g., Google login if enabled)</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide and maintain our services</li>
          <li>To manage user accounts and authentication</li>
          <li>To track course progress and issue certificates</li>
          <li>To communicate important updates</li>
          <li>To maintain security and prevent misuse</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Sharing & Disclosure</h2>
        <p>We do not sell personal information. Data may be shared only with:</p>
        <ul>
          <li>Trusted service providers (hosting, analytics, email)</li>
          <li>Legal authorities when required by law</li>
          <li>Other users only if content is shared publicly</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>4. Third-Party Services</h2>
        <p>
          We may use third-party services such as authentication providers,
          analytics tools, and payment gateways. Their use of data is governed by
          their respective privacy policies.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Cookies</h2>
        <p>
          Cookies are used for session management and improving user experience.
          You can control cookies via browser settings.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Data Retention & Security</h2>
        <p>
          We retain data only as long as necessary. Reasonable technical and
          organizational security measures are implemented, but no system is
          completely secure.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Your Rights</h2>
        <p>
          You may request access, correction, or deletion of your data by
          contacting us at{' '}
          <a className={styles.link} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Children’s Privacy</h2>
        <p>
          This platform is not intended for children under 13. We do not knowingly
          collect their personal data.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Changes to This Policy</h2>
        <p>
          Updates to this Privacy Policy will be posted on this page with a revised
          effective date.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Contact</h2>
        <p>
          For any questions, contact us at{' '}
          <a className={styles.link} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </main>
  );
}
