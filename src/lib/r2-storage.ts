/**
 * Cloudflare R2 Storage
 * Persistent file storage that works across Vercel serverless invocations
 * Free tier: 10GB storage, 1M requests/month
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3-compatible client for Cloudflare R2
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('R2 configuration missing. Check environment variables.');
    }

    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2Client;
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sheetsane-files';

/**
 * Upload file to R2
 */
export async function uploadToR2(
  fileId: string,
  buffer: Buffer,
  contentType: string = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
): Promise<void> {
  try {
    const client = getR2Client();
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `files/${fileId}`,
      Body: buffer,
      ContentType: contentType,
      // Set expiration metadata (not automatic expiry, but for tracking)
      Metadata: {
        uploadedAt: Date.now().toString(),
      },
    });

    await client.send(command);
    console.log(`[R2] Uploaded file: ${fileId}`);
  } catch (error) {
    console.error('[R2] Upload failed:', error);
    throw new Error('Failed to upload file to storage');
  }
}

/**
 * Download file from R2
 */
export async function downloadFromR2(fileId: string): Promise<Buffer | null> {
  try {
    const client = getR2Client();
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `files/${fileId}`,
    });

    const response = await client.send(command);
    
    if (!response.Body) {
      return null;
    }

    // Convert stream to buffer
    const stream = response.Body;
    
    if (Buffer.isBuffer(stream)) {
      return stream;
    }
    
    // Convert Readable to buffer
    const chunks: Uint8Array[] = [];
    
    if (stream && typeof stream === 'object' && 'transformToByteArray' in stream) {
      // Use transformToByteArray if available
      const arrayBuffer = await (stream as any).transformToByteArray();
      return Buffer.from(arrayBuffer);
    } else if (stream && typeof stream === 'object' && 'transformToWebStream' in stream) {
      // Use transformToWebStream as fallback
      const webStream = (stream as any).transformToWebStream();
      const reader = webStream.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
    } else {
      // Last resort: try to read as stream
      const reader = (stream as any).getReader?.();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
      } else {
        throw new Error('Unable to read R2 stream');
      }
    }
    
    const buffer = Buffer.concat(chunks);
    console.log(`[R2] Downloaded file: ${fileId} (${buffer.length} bytes)`);
    return buffer;
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      console.log(`[R2] File not found: ${fileId}`);
      return null;
    }
    console.error('[R2] Download failed:', error);
    throw new Error('Failed to download file from storage');
  }
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(fileId: string): Promise<boolean> {
  try {
    const client = getR2Client();
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `files/${fileId}`,
    });

    await client.send(command);
    console.log(`[R2] Deleted file: ${fileId}`);
    return true;
  } catch (error) {
    console.error('[R2] Delete failed:', error);
    return false;
  }
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}
