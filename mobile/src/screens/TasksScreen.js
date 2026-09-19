import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { taskService } from '../services/taskService';
import { notificationService } from '../services/notificationService';
import { useTheme } from '../context/ThemeContext';
import { useDebounce } from '../hooks/useDebounce';
import FilterBar from '../components/FilterBar';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';
import LoadingIndicator from '../components/LoadingIndicator';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function TasksScreen({ navigation }) {
  const { colors } = useTheme();

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [counts, setCounts] = useState({ total: 0, pending: 0, completed: 0 });

  const [deletingTask, setDeletingTask] = useState(null);

  const requestRef = React.useRef(0);

  const loadTasks = useCallback(async () => {
    const reqId = ++requestRef.current;
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const [tasksData, statsData] = await Promise.all([
        taskService.getTasks(params),
        taskService.getDashboardStats(),
      ]);

      if (reqId !== requestRef.current) return; // ignore stale response

      setTasks(tasksData);
      setCounts({
        total: statsData.total_tasks,
        pending: statsData.pending_tasks,
        completed: statsData.completed_tasks,
      });

      // Synchronize notifications with local schedule
      notificationService.syncAllTaskNotifications(tasksData);
    } catch (e) {
      if (reqId === requestRef.current) {
        console.warn('Error loading tasks:', e.message);
      }
    } finally {
      if (reqId === requestRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [statusFilter, priorityFilter, debouncedSearch]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTasks();
    });
    return unsubscribe;
  }, [navigation, loadTasks]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadTasks();
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const updated = await taskService.updateTaskStatus(task.id, newStatus);
      if (updated) {
        await notificationService.scheduleTaskNotifications(updated);
      }
      loadTasks();
    } catch (e) {
      console.warn('Error toggling task status:', e.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    try {
      await taskService.deleteTask(deletingTask.id);
      await notificationService.cancelTaskNotifications(deletingTask.id);
      setDeletingTask(null);
      loadTasks();
    } catch (e) {
      console.warn('Error deleting task:', e.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search and Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        counts={counts}
      />

      {/* Task List */}
      {isLoading && !isRefreshing ? (
        <LoadingIndicator message="Loading tasks..." />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={search ? 'No matching tasks' : 'No tasks found'}
              description={
                search
                  ? `No tasks match your search for "${search}".`
                  : 'You have no tasks matching this filter.'
              }
              onAction={() => navigation.navigate('AddTask')}
            />
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onToggleStatus={handleToggleStatus}
              onEdit={(t) => navigation.navigate('EditTask', { task: t })}
              onDelete={(t) => setDeletingTask(t)}
            />
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddTask')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTask(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
