import { get, post } from '../services/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Fetch a file from backend and return as base64 data URL.
 * Uses the backend /api/files/base64 endpoint which validates path security.
 */
export async function fetchFileAsBase64(filePath: string): Promise<string> {
  const result = await get<{ base64: string }>('/files/base64', { path: filePath });
  return result.base64;
}

/**
 * Convert a PDF file to image via backend service.
 * Returns the relative path of the generated PNG image.
 */
export async function convertPdfToImage(pdfPath: string): Promise<string> {
  const result = await post<{ imagePath: string }>('/files/pdf-to-image', { filePath: pdfPath });
  return result.imagePath;
}

/**
 * Upload a local File to backend, persist original, and get back Vision-ready base64 + saved path.
 * The backend handles PDF-to-image conversion automatically.
 */
export async function uploadFileForVision(file: File): Promise<{ base64: string; savedPath: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/api/files/process-for-vision`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${text}`);
  }
  const json = await response.json();
  return { base64: json.data.base64, savedPath: json.data.savedPath };
}

/**
 * Convert a local File object to base64 data URL using FileReader.
 */
export function localFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Check if a MIME type represents an image.
 */
export function isImageType(mimeType: string | null | undefined): boolean {
  return !!mimeType && mimeType.startsWith('image/');
}

/**
 * Check if a MIME type represents a PDF.
 */
export function isPdfType(mimeType: string | null | undefined): boolean {
  return mimeType === 'application/pdf';
}

/**
 * Process a file for Vision API: returns base64 data URL.
 * For images: fetches directly as base64.
 * For PDFs: converts to image first, then fetches as base64.
 */
export async function processFileForVision(
  filePath: string,
  mimeType: string | null | undefined,
): Promise<string | null> {
  try {
    if (isImageType(mimeType)) {
      return await fetchFileAsBase64(filePath);
    }
    if (isPdfType(mimeType)) {
      const imagePath = await convertPdfToImage(filePath);
      return await fetchFileAsBase64(imagePath);
    }
    return null;
  } catch (err) {
    console.error('Failed to process file for Vision:', err);
    return null;
  }
}
