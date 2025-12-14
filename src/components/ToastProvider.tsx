'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#000',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '16px',
        },
        success: {
          iconTheme: {
            primary: '#4B0908',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#DC2626',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

