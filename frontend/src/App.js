import React, { useState, useEffect } from 'react'; // Import useEffect
import styles from './App.module.css';

import FileUpload from './components/FileUpload';
import ProcessingView from './components/ProcessingView';
import DownloadView from './components/DownloadView';
import { uploadToIngest, waitForRedacted } from './aws/s3Helpers';

function App() {
  const [appState, setAppState] = useState('idle'); // 'idle', 'processing', 'complete'
  const [selectedFile, setSelectedFile] = useState(null);
  const [downloadLink, setDownloadLink] = useState(null);
  const [contentVisible, setContentVisible] = useState(false); // New state for animation

  // Animate content in on mount
  useEffect(() => {
    setContentVisible(true);
  }, []);

  const handleRedactSubmit = async () => {
    if (!selectedFile) return;

    setAppState('processing');

    try {
      const ingestBucket = process.env.REACT_APP_INGEST_BUCKET;
      const redactedBucket = process.env.REACT_APP_REDACTED_BUCKET;

      if (!ingestBucket || !redactedBucket) {
        throw new Error('Missing REACT_APP_INGEST_BUCKET or REACT_APP_REDACTED_BUCKET in .env.local');
      }

  // Upload the file to the ingest bucket. Returns fileName and key.
  const { fileName } = await uploadToIngest(ingestBucket, selectedFile);

  // Poll the redacted bucket for the job's output using the filename
  const { text } = await waitForRedacted(redactedBucket, fileName, { maxAttempts: 30, initialDelayMs: 1000 });

      // Create a blob URL so the UI can download/display the redacted content
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      setDownloadLink(url);
      setAppState('complete');
    } catch (err) {
      console.error('Redaction flow error:', err);
      alert('Error during upload/polling: ' + err.message);
      setAppState('idle');
    }
  };

  const handleReset = () => {
    // Revoke the old blob URL to prevent memory leaks
    if (downloadLink) {
      URL.revokeObjectURL(downloadLink);
    }
    setSelectedFile(null);
    setDownloadLink(null);
    // Add a slight delay before resetting state to allow exit animation if desired
    // For now, instant reset is fine.
    setAppState('idle'); 
  };

  const renderContent = () => {
    switch (appState) {
      case 'processing':
        return <ProcessingView />;
      case 'complete':
        return <DownloadView downloadLink={downloadLink} onReset={handleReset} />;
      case 'idle':
      default:
        return (
          <FileUpload
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            onSubmit={handleRedactSubmit}
          />
        );
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        <h1>PII Redactor</h1>
      </header>
      <main className={`${styles.content} ${contentVisible ? styles.contentVisible : ''}`}>
        {renderContent()}
      </main>
      <footer className={styles.footer}>
        <p>A Privacy-Preserving Redaction Service</p>
      </footer>
    </div>
  );
}

export default App;