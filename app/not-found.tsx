import Link from "next/link";
import Image from "next/image";
import styles from "./not-found.module.scss";

export default function NotFound() {
  return (
    <div className={styles.notfoundContainer}>
      <div className={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <span key={i} className={styles.particle} style={{ "--i": i + 10 } as React.CSSProperties} />
        ))}
      </div>

      <div className={styles.notfoundContent}>
        <Image
          src="/Logonew.png"
          alt="Logo"
          width={50}
          height={50}
          className={styles.logo}
          priority
        />
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.title}>Oops! Page Not Found</h2>
        <p className={styles.description}>
          Looks like this page took a wrong turn in the internet universe.
          <br />
          Don't worry — let's get you back on track!
        </p>
        <Link href="/" className={styles.homeBtn}>
          Return Home
        </Link>
      </div>
    </div>
  );
}