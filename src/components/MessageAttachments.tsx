'use client';

import { formatFileSize, getFileIcon } from '@/lib/file-utils';

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
  uploaded_by: string;
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
  currentUserId?: string;
  onDelete?: (attachmentId: string) => void;
}

export default function MessageAttachments({ attachments, currentUserId, onDelete }: MessageAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  const isImage = (fileType: string) => fileType.startsWith('image/');

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => {
        if (isImage(attachment.file_type)) {
          // Image preview
          return (
            <div key={attachment.id} className="relative group max-w-sm">
              <a 
                href={attachment.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border border-gray-300 hover:border-dark-red transition-colors"
              >
                <img 
                  src={attachment.url} 
                  alt={attachment.file_name}
                  className="w-full h-auto max-h-96 object-cover"
                />
              </a>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span className="truncate max-w-[200px]">{attachment.file_name}</span>
                <span>{formatFileSize(attachment.file_size)}</span>
              </div>
              {currentUserId === attachment.uploaded_by && onDelete && (
                <button
                  onClick={() => onDelete(attachment.id)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete attachment"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          );
        } else {
          // File attachment
          return (
            <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-300 max-w-sm group">
              <div className="text-3xl flex-shrink-0">
                {getFileIcon(attachment.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <a 
                  href={attachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-dark-red hover:underline truncate block"
                >
                  {attachment.file_name}
                </a>
                <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={attachment.url} 
                  download={attachment.file_name}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Download"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                {currentUserId === attachment.uploaded_by && onDelete && (
                  <button
                    onClick={() => onDelete(attachment.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}

