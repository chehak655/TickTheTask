import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import { taskService } from '../services/taskService';
import { useToast } from '../context/ToastContext';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import ConfirmationDialog from '../components/ConfirmationDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const parseUtcDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/-\d\d:\d\d$/)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
};

export default function CalendarView() {
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formInitialDueDate, setFormInitialDueDate] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const requestRef = React.useRef(0);

  const loadCalendarTasks = useCallback(async () => {
    const reqId = ++requestRef.current;
    try {
      setIsLoading(true);
      // Fetch entire month plus padding
      const startOfMonth = new Date(year, month - 1, 20);
      const endOfMonth = new Date(year, month + 1, 10);
      const data = await taskService.getCalendarTasks(startOfMonth.toISOString(), endOfMonth.toISOString());
      
      if (reqId !== requestRef.current) return;
      setTasks(data);
    } catch (err) {
      if (reqId === requestRef.current) {
        showToast('Failed to load calendar tasks.', 'error');
      }
    } finally {
      if (reqId === requestRef.current) {
        setIsLoading(false);
      }
    }
  }, [year, month, showToast]);

  useEffect(() => {
    loadCalendarTasks();
  }, [loadCalendarTasks]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const days = [];
  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  // Next month padding to fill 35 or 42 grid cells
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Group tasks by day
  const getTasksForDay = (date) => {
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = parseUtcDate(t.due_date);
      return d && isSameDay(d, date);
    });
  };

  const selectedDayTasks = getTasksForDay(selectedDate);
  const now = new Date();

  const handleCreateForSelectedDate = () => {
    const pad = (n) => String(n).padStart(2, '0');
    const localIso = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(
      selectedDate.getDate()
    )}T12:00`;
    setFormInitialDueDate(localIso);
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await taskService.updateTaskStatus(task.id, newStatus);
      showToast(`Task marked as ${newStatus}.`, 'success');
      loadCalendarTasks();
    } catch (err) {
      showToast('Failed to update task status.', 'error');
    }
  };

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true);
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask.id, payload);
        showToast('Task updated successfully.', 'success');
      } else {
        await taskService.createTask(payload);
        showToast('Task created successfully.', 'success');
      }
      setIsFormOpen(false);
      setEditingTask(null);
      loadCalendarTasks();
    } catch (err) {
      showToast('Failed to save task.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    try {
      await taskService.deleteTask(deletingTask.id);
      showToast('Task deleted successfully.', 'success');
      setDeletingTask(null);
      loadCalendarTasks();
    } catch (err) {
      showToast('Failed to delete task.', 'error');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Task Deadline Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View, schedule, and track all upcoming task deadlines across months.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="px-3.5 py-2 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handleCreateForSelectedDate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md shadow-primary-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add on Date
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid Container (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 p-5 sm:p-6 shadow-sm">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-xs font-bold text-slate-500 dark:text-slate-400 py-1.5 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {days.map((item, idx) => {
              const dayTasks = getTasksForDay(item.date);
              const isSelected = isSameDay(item.date, selectedDate);
              const isToday = isSameDay(item.date, now);
              const pendingCount = dayTasks.filter((t) => t.status === 'pending').length;
              const completedCount = dayTasks.filter((t) => t.status === 'completed').length;
              const overdueCount = dayTasks.filter(
                (t) => t.status === 'pending' && parseUtcDate(t.due_date) < now
              ).length;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(item.date)}
                  className={`min-h-[64px] sm:min-h-[80px] p-2 rounded-2xl flex flex-col justify-between text-left transition-all border relative ${
                    isSelected
                      ? 'bg-primary-50/90 dark:bg-primary-950/80 border-primary-500 ring-2 ring-primary-500/30 shadow-xs'
                      : isToday
                      ? 'bg-slate-50 dark:bg-slate-900/90 border-primary-300 dark:border-primary-600/80 shadow-xs'
                      : item.isCurrentMonth
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 hover:border-primary-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                      : 'bg-slate-50/40 dark:bg-slate-900/30 border-transparent text-slate-300 dark:text-slate-600 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-primary-600 text-white shadow-xs'
                          : isSelected
                          ? 'text-primary-600 dark:text-primary-400 font-black'
                          : item.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {item.date.getDate()}
                    </span>

                    {dayTasks.length > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-primary-200 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Indicators */}
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {overdueCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" title={`${overdueCount} overdue`} />
                    )}
                    {pendingCount > 0 && overdueCount === 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" title={`${pendingCount} pending`} />
                    )}
                    {completedCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title={`${completedCount} completed`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Task Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            {isLoading ? (
              <LoadingSpinner text="Loading schedule..." />
            ) : selectedDayTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-3">
                <CalendarIcon className="w-8 h-8 mx-auto opacity-30 stroke-[1.5]" />
                <p className="text-xs">No tasks scheduled for this date.</p>
                <button
                  type="button"
                  onClick={handleCreateForSelectedDate}
                  className="px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/60 rounded-xl transition-colors inline-block"
                >
                  + Add task for this day
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {selectedDayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={handleToggleStatus}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsFormOpen(true);
                    }}
                    onDelete={(t) => setDeletingTask(t)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Unscheduled Tasks Section */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/60 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Unscheduled Tasks
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {tasks.filter(t => !t.due_date).length} tasks
              </span>
            </div>
            
            {!isLoading && tasks.filter(t => !t.due_date).length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {tasks.filter(t => !t.due_date).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleStatus={handleToggleStatus}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsFormOpen(true);
                    }}
                    onDelete={(t) => setDeletingTask(t)}
                  />
                ))}
              </div>
            ) : !isLoading ? (
              <p className="text-xs text-center text-slate-400">All tasks have been scheduled.</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
          setFormInitialDueDate('');
        }}
        onSubmit={handleFormSubmit}
        initialData={
          editingTask || (formInitialDueDate ? { due_date: formInitialDueDate } : null)
        }
        isSubmitting={isSubmitting}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  );
}
