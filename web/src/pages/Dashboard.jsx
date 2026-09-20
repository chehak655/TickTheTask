import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { taskService } from '../services/taskService';
import StatsCard from '../components/StatsCard';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import ConfirmationDialog from '../components/ConfirmationDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    high_priority_tasks: 0,
    overdue_tasks: 0,
  });

  const [recentTasks, setRecentTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsData, tasksData] = await Promise.all([
        taskService.getDashboardStats(),
        taskService.getTasks({ limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
      ]);
      setStats(statsData);
      setRecentTasks(tasksData);
    } catch (err) {
      showToast('Failed to load dashboard data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await taskService.updateTaskStatus(task.id, newStatus);
      showToast(
        `Task marked as ${newStatus === 'completed' ? 'completed' : 'pending'}.`,
        'success'
      );
      loadDashboardData();
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
      loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to save task.', 'error');
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
      loadDashboardData();
    } catch (err) {
      showToast('Failed to delete task.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            TickTheTask Productivity Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome, {user?.name || 'User'} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's a summary of your workspace performance and active tasks.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-md shadow-primary-600/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Metrics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Tasks"
          value={stats.total_tasks}
          icon={ListTodo}
          colorScheme="primary"
        />
        <StatsCard
          title="Completed"
          value={stats.completed_tasks}
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <StatsCard
          title="Pending"
          value={stats.pending_tasks}
          icon={Clock}
          colorScheme="amber"
        />
        <StatsCard
          title="High Priority"
          value={stats.high_priority_tasks}
          icon={AlertTriangle}
          colorScheme="rose"
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue_tasks}
          icon={AlertOctagon}
          colorScheme="rose"
        />
      </div>

      {/* Recent Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Tasks</h2>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <span>View all tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading dashboard..." />
        ) : recentTasks.length === 0 ? (
          <EmptyState
            title="No recent tasks"
            description="You don't have any tasks in your list yet. Start organizing your work by adding one."
            onAction={() => {
              setEditingTask(null);
              setIsFormOpen(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {recentTasks.map((task) => (
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

      {/* Modals */}
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
