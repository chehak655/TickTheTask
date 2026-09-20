import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...', size = 'md', fullScreen = false }) {
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

  useEffect(() => {
    // If the spinner is mounted for more than 5 seconds, it might be a cold start
    const timer = setTimeout(() => {
      setShowLongWaitMessage(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-slate-500 dark:text-slate-400">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-primary-600 dark:text-primary-400`} />
      {text && <p className="text-sm font-medium animate-pulse">{text}</p>}
      {showLongWaitMessage && (
        <p className="text-xs text-slate-400 text-center max-w-xs mt-2 transition-opacity duration-1000 opacity-100">
          Backend servers are waking up from sleep. This usually takes around 30-60 seconds on the free tier. Hang tight!
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
