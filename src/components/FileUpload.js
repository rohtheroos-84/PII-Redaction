import React, { useState, useRef } from 'react';
import styles from './FileUpload.module.css';

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13 2 13 9 20 9"></polyline>
  </svg>
);

function FileUpload({ selectedFile, setSelectedFile, onSubmit }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const openFilePicker = () => {
    inputRef.current.click();
  };

  return (
    <div className={styles.container}>
      {!selectedFile ? (
        <div
          className={`${styles.dropZone} ${isDragActive ? styles.dragActive : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={openFilePicker}
        >
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileChange}
            className={styles.hiddenInput}
            accept=".txt,.pdf,.docx"
          />
          <UploadIcon />
          <p className={styles.dropZoneText}>
            <b>Drag & drop</b> your file here
          </p>
          <p className={styles.dropZoneSubText}>or click to browse</p>
          <p className={styles.dropZoneSupport}>Supports only .txt for now</p>
        </div>
      ) : (
        <div className={styles.filePreview}>
          <FileIcon />
          <span className={styles.fileName}>{selectedFile.name}</span>
          <button
            className={styles.removeFileButton}
            onClick={() => setSelectedFile(null)}
            aria-label="Remove selected file"
          >
            &times;
          </button>
        </div>
      )}

      <button
        className={`${styles.redactButton} glossy-button`}
        onClick={onSubmit}
        disabled={!selectedFile}
      >
        Redact File
      </button>
    </div>
  );
}

export default FileUpload;