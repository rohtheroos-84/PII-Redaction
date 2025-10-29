import s3 from './s3Client';
import { PutObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Upload the original file to the ingest bucket under the `text/` prefix.
// Returns the original filename and the key written.
export async function uploadToIngest(bucket, file) {
  const fileName = file.name;
  const key = `text/${fileName}`;

  // Browser File/Blob may cause the SDK to use streaming middleware that
  // expects a web ReadableStream with getReader(). Some bundlers/polyfills
  // produce incompatible stream shapes. To avoid that, read the file into
  // an ArrayBuffer and send a Uint8Array. This is fine for small test files.
  let bodyToSend = file;
  try {
    if (file && typeof file.arrayBuffer === 'function') {
      const buf = await file.arrayBuffer();
      bodyToSend = new Uint8Array(buf);
    }
  } catch (e) {
    console.log('[s3Helpers] warning: failed to arrayBuffer file, falling back to file as body', e && e.message);
    bodyToSend = file;
  }

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: bodyToSend,
    ContentType: file.type || 'application/octet-stream',
  }));

  return { fileName, key };
}

async function streamToString(body) {
  if (!body) return '';
  // Debug: inspect body shape to help diagnose getReader issues in browsers
  try {
    console.log('[s3Helpers] streamToString body type:', Object.prototype.toString.call(body));
    console.log('[s3Helpers] streamToString typeof body:', typeof body);
    if (body && typeof body === 'object') {
      try { console.log('[s3Helpers] body keys:', Object.keys(body)); } catch (e) { /* ignore */ }
    }
  } catch (e) {
    // ignore debug failures
  }

  // If SDK provides transformToString (some environments), prefer it
  if (typeof body.transformToString === 'function') {
    return body.transformToString();
  }

  // Try using the browser Response wrapper which can consume many body shapes
  if (typeof Response !== 'undefined') {
    try {
      // new Response(...) accepts ReadableStream/Blob/ArrayBuffer/etc.
      const resp = new Response(body);
      if (typeof resp.text === 'function') {
        return await resp.text();
      }
    } catch (e) {
      // ignore and continue to other fallbacks
      console.log('[s3Helpers] Response() wrapper failed:', e && e.message);
    }
  }

  // If body has text() (Response/Blob-like), use it
  if (typeof body.text === 'function') {
    return body.text();
  }

  // If body has arrayBuffer (Blob-like), decode it
  if (typeof body.arrayBuffer === 'function') {
    const buf = await body.arrayBuffer();
    return new TextDecoder('utf-8').decode(buf);
  }

  // If it's a web ReadableStream (getReader), read and decode chunks
  if (typeof body.getReader === 'function') {
    const reader = body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';

    while (true) {
      // read() returns { done, value }
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        result += decoder.decode(value, { stream: true });
      }
    }
    // flush
    result += decoder.decode();
    return result;
  }

  // Fallback for Node-style streams (server-side bundles)
  if (typeof body.on === 'function') {
    return new Promise((resolve, reject) => {
      const chunks = [];
      body.on('data', (c) => chunks.push(Buffer.from(c)));
      body.on('error', reject);
      body.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }

  // As a last resort, try toString
  try {
    return String(body);
  } catch (e) {
    return '';
  }
}

export async function waitForRedacted(bucket, originalFileName, opts = {}) {
  const { maxAttempts = 20, initialDelayMs = 1000 } = opts;
  // The pipeline writes output with the name: redacted_{OriginalfileName}.txt under the 'text/' prefix
  const key = `text/redacted_${originalFileName}`;

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxAttempts) {
    try {
      // Check existence
      await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

      // If present, fetch content
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      // Debug: log the shape of res.Body before attempting to read it
      try {
        console.log('[s3Helpers] GetObject res.Body:', res.Body);
        if (res.Body && typeof res.Body === 'object') {
          try { console.log('[s3Helpers] res.Body keys:', Object.keys(res.Body)); } catch (e) {}
          console.log('[s3Helpers] res.Body.getReader typeof:', typeof (res.Body.getReader));
          console.log('[s3Helpers] res.Body.readableStreamVersion:', res.Body.readableStreamVersion);
        }
      } catch (e) {
        /* ignore debug errors */
      }

      let text;
      try {
        text = await streamToString(res.Body);
      } catch (e) {
        console.log('[s3Helpers] streamToString failed:', e && e.message, e);
        throw e;
      }
      return { key, text };
    } catch (err) {
      // Not found or transient error -> wait and retry
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 10000);
      attempt++;
    }
  }

  throw new Error('Timed out waiting for redacted file');
}
