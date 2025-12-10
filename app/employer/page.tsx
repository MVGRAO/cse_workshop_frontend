import Image from "next/image";
import styles from "../../styles/shared/employer.module.scss";

export default function EmployerSignIn() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <Image
            src="/Logonew.png"
            alt="RGUKT logo"
            width={100}
            height={40}
            priority
          />
          
          <div className={styles.content}>
            <h1 className={styles.title}>
              Employer Sign In
            </h1>
            
            <a href="/auth/google" className={styles.signInButton}>
              <Image
                src="/download.png"
                alt="Google"
                width={20}
                height={20}
              />
              Sign in with Google
            </a>
          </div>

          <p className={styles.agreement}>
            By continuing, you agree to our{" "}
            <a href="#" className={styles.link}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className={styles.link}>
              Privacy Policy
            </a>
          </p>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            New to Skillina?{" "}
            <a href="#" className={styles.link}>
              Request access as an employer.
            </a>
          </p>
          <p className={styles.footerText}>
            Not an employer?{" "}
            <a href="/candidate" className={styles.link}>
              Sign in as Candidate
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
