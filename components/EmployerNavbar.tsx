'use client';

import Link from 'next/link';
import Image from 'next/image';
import { removeAuthToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import styles from '@/styles/navbar.module.scss';

export default function EmployerNavbar() {
  const router = useRouter();

  const handleLogout = () => {
    removeAuthToken('verifier');
    router.push('/employer');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/employer/dashboard">
            <Image
              src="/Logonew.png"
              alt="CSE Workshop Logo"
              width={120}
              height={40}
              priority
              style={{ width: 'auto', height: '40px' }}
            />
          </Link>
        </div>
        <div className={styles.navActions}>
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

