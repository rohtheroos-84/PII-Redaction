import React from 'react';
import styles from './ProcessingView.module.css';

function ProcessingView() {
  return (
    <div className={styles.container}>
      <div className={styles.multiSpinner}>
        <div className={styles.spinnerLayer}></div>
        <div className={styles.spinnerLayer}></div>
        <div className={styles.spinnerLayer}></div>
      </div>
      <h2 className={styles.title}>Processing File</h2>
      <p className={styles.text}>Redacting PII, please wait a moment...</p>
    </div>
  );
}

export default ProcessingView;