'use client';

import { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const COMMON_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '🙏',
  '🎉', '🔥', '👀', '💯', '✅', '❌',
  '⭐', '💪', '👏', '🚀', '💡', '🎯'
];

export default function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Check if picker would overflow and adjust position
    if (pickerRef.current) {
      const rect = pickerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (rect.top < 0) {
        setPosition('bottom');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className={`absolute right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 ${
        position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
      }`}
      style={{ width: '280px', maxWidth: 'calc(100vw - 40px)' }}
    >
      <div className="grid grid-cols-6 gap-2">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="text-2xl hover:bg-gray-100 rounded p-2 transition-colors"
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

