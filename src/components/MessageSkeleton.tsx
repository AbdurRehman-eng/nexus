import React from 'react';

export default function MessageSkeleton() {
  return (
    <div className="flex gap-2 sm:gap-3 animate-pulse">
      {/* Avatar skeleton */}
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-gray-300 flex-shrink-0"></div>
      
      <div className="flex-1 space-y-2">
        {/* Username and timestamp skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 bg-gray-300 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        
        {/* Message content skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

// Component for showing multiple skeleton messages
export function MessageSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4 p-3 sm:p-6">
      {Array.from({ length: count }).map((_, index) => (
        <MessageSkeleton key={index} />
      ))}
    </div>
  );
}
