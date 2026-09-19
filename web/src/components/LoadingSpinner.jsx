import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...', size = 'md', fullScreen = false }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-slate-500 dark:text-slate-400">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-primary-600 dark:text-primary-400`} />
      {text && <p className="text-sm font-medium animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        {content}
      </div>
    );
  }

  return content;
}
