import Image from "next/image";
import styles from "../../styles/shared/candidate.module.scss";

export default function CandidateSignIn() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <Image
            className={styles.logo}
            src="/Logonew.png"
            alt="Skillina logo"
            width={100}
            height={40}
            priority
          />

          <div className={styles.content}>
            <h1 className={styles.title}>Candidate Sign In</h1>

            <a href="/auth/google" className={styles.signInButton}>
              <Image src="/download.png" alt="Google" width={20} height={20} />
              Sign in with Google
            </a>
          </div>

          <p className={styles.agreement}>
            By continuing, you agree to our {" "}
            <a href="#" className={styles.link}>
              Terms of Service
            </a>{" "}
            and {" "}
            <a href="#" className={styles.link}>
              Privacy Policy
            </a>
          </p>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            New to Skillina? {" "}
            <a href="#" className={styles.link}>
              Request access as a candidate.
            </a>
          </p>
          <p className={styles.footerText}>
            Looking to hire? {" "}
            <a href="/employer" className={styles.link}>
              Sign in as Employer
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
