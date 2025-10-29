# PII Redactor

A privacy-preserving web application that automatically redacts Personally Identifiable Information (PII) from text files using AWS services and Microsoft Presidio.

## Overview

This application provides a simple drag-and-drop interface for uploading text files containing sensitive information. The files are processed through an AWS-based redaction pipeline that identifies and removes PII such as names, email addresses, phone numbers, and other personal data.

### Architecture

1. **Frontend**: React app that uploads files directly to S3 and polls for results
2. **Ingest Bucket**: S3 bucket (`pii-ingest-aayushm`) receives uploaded files
3. **Processing Pipeline**: AWS Lambda triggered by S3 events, uses Microsoft Presidio for PII detection
4. **Redacted Bucket**: S3 bucket (`pii-redacted-aayushm`) stores processed files

### Flow

```
User uploads file → S3 (ingest/text/) → Lambda → Presidio → S3 (redacted/text/) → User downloads
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- AWS account with configured S3 buckets and Lambda function
- IAM user with appropriate S3 permissions

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/rohtheroos-84/PII-Redaction.git
cd PII-Redaction
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
REACT_APP_AWS_REGION=ap-south-1
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_here
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_key_here
REACT_APP_INGEST_BUCKET=pii-ingest-aayushm
REACT_APP_REDACTED_BUCKET=pii-redacted-aayushm
```

⚠️ **Security Warning**: This configuration embeds AWS credentials in the frontend for local development only. Never commit `.env.local` to version control or use this approach in production.

### 4. Configure S3 CORS

Both S3 buckets need CORS configuration to allow browser requests from localhost.

**For both `pii-ingest-aayushm` and `pii-redacted-aayushm`:**

1. Go to AWS S3 Console
2. Select the bucket → **Permissions** tab
3. Scroll to **Cross-origin resource sharing (CORS)**
4. Click **Edit** and paste:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
        "AllowedOrigins": ["http://localhost:3000"],
        "ExposeHeaders": ["ETag", "x-amz-request-id"],
        "MaxAgeSeconds": 3000
    }
]
```

### 5. Configure IAM Permissions

Create an IAM user with the following policy (least-privilege):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PutIntoIngest",
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::pii-ingest-aayushm/text/*"
    },
    {
      "Sid": "ReadFromRedacted",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:HeadObject"],
      "Resource": "arn:aws:s3:::pii-redacted-aayushm/text/*"
    }
  ]
}
```

## Running the Application

### Development Mode

```bash
cd frontend
npm start
```

Opens [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
cd frontend
npm run build
```

Creates an optimized production build in the `build/` folder.

## Usage

1. **Upload File**: Click or drag-and-drop a text file onto the upload area
2. **Redaction Processing**: Click "Redact File" button
   - File uploads to `text/{filename}` in the ingest bucket
   - App polls for `text/redacted_{filename}.txt` in the redacted bucket
3. **Download Result**: When processing completes, download the redacted file
4. **Process Another**: Click "Process Another File" to reset

## Project Structure

```
PII-Redaction/
├── frontend/
│   ├── src/
│   │   ├── components/          # React UI components
│   │   │   ├── FileUpload.js    # File picker and drag-drop
│   │   │   ├── ProcessingView.js # Loading spinner
│   │   │   └── DownloadView.js   # Download results
│   │   ├── aws/
│   │   │   ├── s3Client.js      # AWS S3 client configuration
│   │   │   └── s3Helpers.js     # Upload and polling logic
│   │   ├── App.js               # Main application component
│   │   └── index.js             # Application entry point
│   ├── public/
│   ├── package.json
│   └── .env.local               # Environment config (not committed)
└── README.md
```

## Key Files

- **`App.js`**: Manages application state (idle/processing/complete) and orchestrates upload/polling
- **`s3Helpers.js`**: 
  - `uploadToIngest()`: Uploads file to ingest bucket as Uint8Array
  - `waitForRedacted()`: Polls redacted bucket with exponential backoff
- **`s3Client.js`**: Configures AWS SDK S3 client with credentials from env vars

## Troubleshooting

### CORS Errors

**Error**: `Access to fetch at 'https://...s3.amazonaws.com/...' has been blocked by CORS policy`

**Solution**: Ensure CORS configuration is applied to both S3 buckets (see Setup step 4)

### Timeout Waiting for Redacted File

**Error**: `Timed out waiting for redacted file`

**Solutions**:
- Verify the Lambda function is running and triggered by S3 events
- Check that the pipeline writes output to `text/redacted_{originalFileName}.txt`
- Increase `maxAttempts` in `waitForRedacted()` call (currently 30 attempts)
- Check CloudWatch logs for Lambda errors

### Upload Errors

**Error**: `readableStream.getReader is not a function`

**Solution**: The code converts files to Uint8Array before upload to avoid streaming middleware issues. Ensure you're using the latest version of `s3Helpers.js`.

### Missing Environment Variables

**Error**: `Missing REACT_APP_INGEST_BUCKET or REACT_APP_REDACTED_BUCKET`

**Solution**: 
- Ensure `.env.local` exists in `frontend/` directory
- Restart dev server after creating/modifying `.env.local`
- Verify all required variables are set (see Setup step 3)

## Security Considerations

⚠️ **This implementation is for local development/testing only**

**Why this is insecure**:
- AWS credentials are embedded in the frontend bundle
- Anyone with browser access can extract the credentials
- Credentials have S3 read/write permissions

**For production, use**:
- Presigned URLs generated by a backend service
- AWS Cognito for temporary credentials
- API Gateway + Lambda for proxied uploads
- Never commit `.env.local` to version control

## Technologies Used

- **Frontend**: React, AWS SDK for JavaScript v3
- **Backend**: AWS Lambda, Python, Microsoft Presidio
- **Storage**: Amazon S3
- **Build Tool**: Create React App

## Future Improvements

- [ ] Add authentication (AWS Cognito)
- [ ] Use presigned URLs instead of embedded credentials
- [ ] Add file type validation
- [ ] Support multiple file formats (PDF, DOCX, etc.)
- [ ] Real-time progress updates via WebSocket
- [ ] Preview redacted content in-browser
- [ ] Batch file processing
- [ ] Customizable PII entity types

## License

This project is for educational purposes.

## Contributing

This is a personal project. Feel free to fork and modify for your own use.

## Contact

For questions or issues, please open an issue on the GitHub repository.
