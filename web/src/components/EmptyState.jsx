import React from 'react';
import { ClipboardList, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'No tasks found',
  description = 'You have no tasks matching the selected filters. Create a new task or adjust your filters.',
  actionLabel = 'Create Task',
  onAction,
  icon: Icon = ClipboardList,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-sm max-w-lg mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-all shadow-md shadow-primary-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
