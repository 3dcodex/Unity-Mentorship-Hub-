// Profile Picture Upload Test
// This test simulates the upload process to detect errors

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../src/firebase';

export async function testProfileUpload(file: File, userId: string): Promise<{ success: boolean; error?: string; url?: string }> {
  try {
    console.log('=== Profile Upload Test Started ===');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    // Check 1: File validation
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Check 2: File type validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: `Invalid file type: ${file.type}. Allowed: ${validTypes.join(', ')}` };
    }

    // Check 3: File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 5MB` };
    }

    // Check 4: Storage reference
    if (!storage) {
      return { success: false, error: 'Firebase storage not initialized' };
    }

    // Check 5: Create storage reference
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${userId}_${timestamp}_${sanitizedFileName}`;
    const storagePath = `profile-photos/${filename}`;
    
    console.log('Storage path:', storagePath);
    
    const fileRef = ref(storage, storagePath);
    console.log('Storage reference created:', fileRef.fullPath);

    // Check 6: Upload file
    console.log('Starting upload...');
    const uploadResult = await uploadBytes(fileRef, file);
    console.log('Upload successful:', uploadResult.metadata);

    // Check 7: Get download URL
    console.log('Getting download URL...');
    const downloadURL = await getDownloadURL(fileRef);
    console.log('Download URL obtained:', downloadURL);

    console.log('=== Profile Upload Test Completed Successfully ===');
    return { success: true, url: downloadURL };

  } catch (error: any) {
    console.error('=== Profile Upload Test Failed ===');
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    // Detailed error analysis
    let errorMessage = 'Upload failed: ';
    
    if (error.code === 'storage/unauthorized') {
      errorMessage += 'Unauthorized. Check Firebase Storage rules.';
    } else if (error.code === 'storage/canceled') {
      errorMessage += 'Upload canceled by user.';
    } else if (error.code === 'storage/unknown') {
      errorMessage += 'Unknown error. Check network connection.';
    } else if (error.code === 'storage/object-not-found') {
      errorMessage += 'File not found after upload.';
    } else if (error.code === 'storage/bucket-not-found') {
      errorMessage += 'Storage bucket not configured.';
    } else if (error.code === 'storage/project-not-found') {
      errorMessage += 'Firebase project not found.';
    } else if (error.code === 'storage/quota-exceeded') {
      errorMessage += 'Storage quota exceeded.';
    } else if (error.code === 'storage/unauthenticated') {
      errorMessage += 'User not authenticated.';
    } else if (error.code === 'storage/retry-limit-exceeded') {
      errorMessage += 'Retry limit exceeded. Check network.';
    } else {
      errorMessage += error.message || 'Unknown error';
    }

    return { success: false, error: errorMessage };
  }
}

// Check Firebase Storage configuration
export function checkStorageConfig(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!storage) {
    issues.push('Storage instance is null or undefined');
  }

  if (!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) {
    issues.push('VITE_FIREBASE_STORAGE_BUCKET environment variable not set');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}
