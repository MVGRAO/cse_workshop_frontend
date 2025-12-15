import Link from 'next/link';
import styles from '@/styles/legal.module.scss';

type LegalFooterProps = {
  role: 'candidate' | 'employer';
};

export default function LegalFooter({ role }: LegalFooterProps) {
  return (
    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
      <Link className={styles.link} href={`/${role}/terms`}>
        Terms of Service
      </Link>
      {' · '}
      <Link className={styles.link} href={`/${role}/privacy-policy`}>
        Privacy Policy
      </Link>
    </div>
  );
}
