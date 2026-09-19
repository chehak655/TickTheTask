import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ListTodo } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { taskService } from '../services/taskService';
import TaskFilters from '../components/TaskFilters';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function Tasks() {
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters and sorting state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Stats / counts for filter tabs
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    completed: 0,
  });

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestRef = React.useRef(0);

  const loadTasks = useCallback(async () => {
    const reqId = ++requestRef.current;
    try {
      setIsLoading(true);
      const params = {
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const [tasksData, statsData] = await Promise.all([
        taskService.getTasks(params),
        taskService.getDashboardStats(),
      ]);

      if (reqId !== requestRef.current) return; // stale response

      setTasks(tasksData);
      setCounts({
        total: statsData.total_tasks,
        pending: statsData.pending_tasks,
        completed: statsData.completed_tasks,
      });
    } catch (err) {
      if (reqId === requestRef.current) {
        showToast('Failed to load tasks.', 'error');
      }
    } finally {
      if (reqId === requestRef.current) {
        setIsLoading(false);
      }
    }
  }, [statusFilter, priorityFilter, debouncedSearch, sortBy, sortOrder, showToast]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await taskService.updateTaskStatus(task.id, newStatus);
      showToast(
        `Task marked as ${newStatus === 'completed' ? 'completed' : 'pending'}.`,
        'success'
      );
      loadTasks();
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
      loadTasks();
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
      loadTasks();
    } catch (err) {
      showToast('Failed to delete task.', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ListTodo className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            Task Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create, organize, search, and track all your tasks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md shadow-primary-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Filters & Search */}
      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderToggle={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        onResetFilters={handleResetFilters}
        counts={counts}
      />

      {/* Task List */}
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        onToggleStatus={handleToggleStatus}
        onEdit={(task) => {
          setEditingTask(task);
          setIsFormOpen(true);
        }}
        onDelete={(task) => setDeletingTask(task)}
        onCreateNew={() => {
          setEditingTask(null);
          setIsFormOpen(true);
        }}
        searchQuery={search}
      />

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
        isSubmitting={isSubmitting}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  );
}
