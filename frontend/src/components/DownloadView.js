import React from 'react';
import styles from './DownloadView.module.css';

const SuccessIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

function DownloadView({ downloadLink, onReset }) {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}> {/* Added for animation */}
        <SuccessIcon />
      </div>
      <h2 className={styles.title}>Redaction Complete</h2>
      <p className={styles.text}>Your file is ready to be downloaded.</p>
      
      <div className={styles.buttonGroup}>
        <a
          href={downloadLink}
          download="redacted_file.txt"
          className={`${styles.downloadButton} glossy-button`}
        >
          Download File
        </a>
        <button
          onClick={onReset}
          className={`${styles.resetButton} glossy-button`}
        >
          Process Another File
        </button>
      </div>
    </div>
  );
}

export default DownloadView;