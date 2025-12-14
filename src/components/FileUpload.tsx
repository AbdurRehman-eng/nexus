'use client';

import { useRef, useState } from 'react';
import { uploadFile } from '@/app/actions/files';
import toast from 'react-hot-toast';

interface FileUploadProps {
  messageId: string;
  accessToken: string;
  onUploadComplete: () => void;
}

export default function FileUpload({ messageId, accessToken, onUploadComplete }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (since we don't have real upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();

      const result = await uploadFile(accessToken, messageId, {
        name: file.name,
        type: file.type,
        size: file.size,
        arrayBuffer: arrayBuffer
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${file.name} uploaded successfully!`);
        onUploadComplete();
      }
    } catch (error) {
      console.error('[FileUpload] Error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z"
        disabled={uploading}
      />
      
      {uploading ? (
        <div className="flex items-center gap-2 px-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-dark-red h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{uploadProgress}%</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="p-1 hover:bg-light-gray rounded"
          title="Attach file"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
      )}
    </>
  );
}

