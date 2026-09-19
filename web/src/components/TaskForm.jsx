import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, Bell } from 'lucide-react';

const parseUtcDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/-\d\d:\d\d$/)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
};

export default function TaskForm({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    reminder_minutes: 15,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      let formattedDate = '';
      if (initialData.due_date) {
        try {
          const d = parseUtcDate(initialData.due_date);
          if (d && !isNaN(d.getTime())) {
            const pad = (n) => String(n).padStart(2, '0');
            formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
              d.getHours()
            )}:${pad(d.getMinutes())}`;
          }
        } catch (e) {
          formattedDate = '';
        }
      }

      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        status: initialData.status || 'pending',
        priority: initialData.priority || 'medium',
        due_date: formattedDate,
        reminder_minutes:
          initialData.reminder_minutes !== undefined && initialData.reminder_minutes !== null
            ? initialData.reminder_minutes
            : 15,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        reminder_minutes: 15,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required and cannot be empty.';
    } else if (formData.title.trim().length > 255) {
      errs.title = 'Title must be 255 characters or fewer.';
    }

    if (formData.description && formData.description.length > 2000) {
      errs.description = 'Description must be 2000 characters or fewer.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
      reminder_minutes:
        formData.due_date && formData.reminder_minutes !== '' && formData.reminder_minutes !== null
          ? Number(formData.reminder_minutes)
          : null,
    };

    onSubmit(payload);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60 mb-5">
          <h3 id="task-form-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
            {initialData ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Title Field */}
          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Task Title <span className="text-rose-500" aria-hidden="true">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              required
              aria-required="true"
              aria-invalid={errors.title ? 'true' : 'false'}
              aria-describedby={errors.title ? 'title-error' : undefined}
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: null });
              }}
              placeholder="e.g., Deploy FastAPI backend to production"
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 text-slate-900 dark:text-white placeholder-slate-400 transition-all ${
                errors.title
                  ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus-visible:ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-primary-500'
              }`}
            />
            {errors.title && (
              <p id="title-error" role="alert" className="flex items-center gap-1 mt-1 text-xs text-rose-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label
              htmlFor="task-description"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="task-description"
              rows={3}
              aria-invalid={errors.description ? 'true' : 'false'}
              aria-describedby={errors.description ? 'description-error' : undefined}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: null });
              }}
              placeholder="Add additional context, notes, or checklist items..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all resize-none"
            />
            {errors.description && (
              <p id="description-error" role="alert" className="flex items-center gap-1 mt-1 text-xs text-rose-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Priority & Status row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="task-priority"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-white transition-all font-medium"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-status"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Status
              </label>
              <select
                id="task-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-white transition-all font-medium"
              >
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Due Date Field */}
          <div>
            <label
              htmlFor="task-due-date"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Due Date <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              id="task-due-date"
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-white transition-all"
            />
          </div>

          {/* Reminder Selector (active when Due Date is specified) */}
          {formData.due_date && (
            <div className="p-3.5 rounded-xl bg-primary-50/60 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/50 animate-in fade-in slide-in-from-top-1">
              <label
                htmlFor="task-reminder"
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-900 dark:text-primary-200 uppercase tracking-wider mb-1.5"
              >
                <Bell className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                Remind Me Before Due Date
              </label>
              <select
                id="task-reminder"
                value={formData.reminder_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reminder_minutes: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-white transition-all font-medium"
              >
                <option value={15}>15 minutes before (Recommended)</option>
                <option value={5}>5 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={120}>2 hours before</option>
                <option value={1440}>1 day before</option>
                <option value={0}>At the exact due time</option>
                <option value="">No reminder</option>
              </select>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-600/20 active:scale-95 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : initialData ? (
                'Save Changes'
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
