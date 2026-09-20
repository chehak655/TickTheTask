import React from 'react';
import { Calendar, AlertCircle, Edit3, Trash2, CheckCircle2, Clock, Bell } from 'lucide-react';
import { formatLeadTime } from '../services/reminderService';

const parseUtcDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/-\d\d:\d\d$/)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
};

export default function TaskCard({ task, onToggleStatus, onEdit, onDelete }) {
  const isCompleted = task.status === 'completed';
  const now = new Date();
  const dueDateObj = parseUtcDate(task.due_date);
  const isOverdue = !isCompleted && dueDateObj && dueDateObj < now;

  const priorityStyles = {
    high: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    medium: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    low: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  const formattedDueDate = dueDateObj
    ? dueDateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: dueDateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const completedDateObj = parseUtcDate(task.completed_at);
  const formattedCompletedDate = completedDateObj
    ? completedDateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: completedDateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const reminderText =
    !isCompleted && task.due_date && task.reminder_minutes !== null && task.reminder_minutes !== undefined
      ? formatLeadTime(task.reminder_minutes)
      : null;

  return (
    <article
      aria-label={`Task: ${task.title}`}
      className={`p-5 rounded-2xl bg-white dark:bg-slate-800/90 border transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 ${
        isCompleted
          ? 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60'
          : isOverdue
          ? 'border-rose-300 dark:border-rose-900/60 shadow-xs shadow-rose-500/10'
          : 'border-slate-200/80 dark:border-slate-700/60 shadow-xs'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Checkbox toggle */}
        <button
          type="button"
          onClick={() => onToggleStatus(task)}
          aria-label={`Mark "${task.title}" as ${isCompleted ? 'pending' : 'completed'}`}
          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
            isCompleted
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : 'border-slate-300 dark:border-slate-600 hover:border-primary-600 dark:hover:border-primary-400 bg-white dark:bg-slate-800'
          }`}
        >
          {isCompleted && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4
              className={`text-base font-semibold leading-snug break-words transition-colors ${
                isCompleted
                  ? 'text-slate-400 dark:text-slate-500 line-through'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {task.title}
            </h4>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => onEdit(task)}
                aria-label={`Edit task "${task.title}"`}
                className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                aria-label={`Delete task "${task.title}"`}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {task.description && (
            <p
              className={`text-sm mb-3 line-clamp-2 leading-relaxed ${
                isCompleted
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Badges footer */}
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-700/40 text-xs">
            {/* Priority Badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold border capitalize tracking-tight ${
                priorityStyles[task.priority] || priorityStyles.low
              }`}
            >
              {task.priority} Priority
            </span>

            {/* Status & Completion Timing Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold border tracking-tight ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-primary-50 text-primary-800 border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Completed
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" /> Pending
                </>
              )}
            </span>

            {/* Completion Timing Analytics Badge */}
            {isCompleted && task.completion_timing && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold border text-[11px] ${
                  task.completion_timing === 'completed_early'
                    ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
                    : task.completion_timing === 'completed_on_time'
                    ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                    : task.completion_timing === 'completed_late'
                    ? 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {task.completion_timing === 'completed_early' && '⚡ Completed Early'}
                {task.completion_timing === 'completed_on_time' && '🎯 Completed On Time'}
                {task.completion_timing === 'completed_late' && '⏰ Completed Late'}
                {task.completion_timing === 'no_deadline' && '✓ No Deadline'}
              </span>
            )}

            {/* Due Date Badge */}
            {formattedDueDate && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium border ${
                  isOverdue
                    ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800 font-bold'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                {isOverdue ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                )}
                {isOverdue ? `Overdue: ${formattedDueDate}` : `Due: ${formattedDueDate}`}
              </span>
            )}

            {/* Completed Date Badge */}
            {isCompleted && formattedCompletedDate && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                Done: {formattedCompletedDate}
              </span>
            )}



            {/* Reminder Badge */}
            {reminderText && (
              <span
                title={`Reminder set for ${reminderText} before due date`}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium border bg-primary-50/70 text-primary-700 border-primary-200/80 dark:bg-primary-950/50 dark:text-primary-300 dark:border-primary-800/60"
              >
                <Bell className="w-3 h-3 text-primary-500 dark:text-primary-400" />
                <span>{reminderText}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
