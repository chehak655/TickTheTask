import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-6 shadow-xl shadow-primary-500/10">
        <FileQuestion className="w-10 h-10" />
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
        404
      </h1>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">
        Page not found
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
        The page you are looking for doesn't exist, was removed, or is temporarily unavailable.
      </p>

      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md shadow-primary-600/20 active:scale-95 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
