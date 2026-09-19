import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { taskService } from '../services/taskService';
import { notificationService } from '../services/notificationService';
import StatsCard from '../components/StatsCard';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';
import LoadingIndicator from '../components/LoadingIndicator';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [stats, setStats] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    high_priority_tasks: 0,
    overdue_tasks: 0,
  });

  const [recentTasks, setRecentTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsData, tasksData] = await Promise.all([
        taskService.getDashboardStats(),
        taskService.getTasks({ limit: 5, sort_by: 'created_at', sort_order: 'desc' }),
      ]);
      setStats(statsData);
      setRecentTasks(tasksData);
      // Sync notifications for loaded tasks
      notificationService.syncAllTaskNotifications(tasksData);
    } catch (e) {
      console.warn('Error loading dashboard data:', e.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Refetch when screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });
    return unsubscribe;
  }, [navigation, loadDashboardData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const updated = await taskService.updateTaskStatus(task.id, newStatus);
      if (updated) {
        await notificationService.scheduleTaskNotifications(updated);
      }
      loadDashboardData();
    } catch (e) {
      console.warn('Error toggling task:', e.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    try {
      await taskService.deleteTask(deletingTask.id);
      await notificationService.cancelTaskNotifications(deletingTask.id);
      setDeletingTask(null);
      loadDashboardData();
    } catch (e) {
      console.warn('Error deleting task:', e.message);
    }
  };

  if (isLoading && !isRefreshing) {
    return <LoadingIndicator message="Loading dashboard..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Top Greeting & Add Button */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hello, {user?.name || 'User'} 👋
            </Text>
            <Text style={[styles.subgreeting, { color: colors.textSecondary }]}>
              Here is your workspace overview
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AddTask')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatsCard
              title="Total"
              value={stats.total_tasks}
              iconName="list-outline"
              colorTheme="primary"
            />
            <StatsCard
              title="Completed"
              value={stats.completed_tasks}
              iconName="checkmark-circle-outline"
              colorTheme="emerald"
            />
          </View>
          <View style={styles.statsRow}>
            <StatsCard
              title="Pending"
              value={stats.pending_tasks}
              iconName="time-outline"
              colorTheme="amber"
            />
            <StatsCard
              title="High Priority"
              value={stats.high_priority_tasks}
              iconName="alert-circle-outline"
              colorTheme="rose"
            />
          </View>
          <View style={styles.statsRow}>
            <StatsCard
              title="Overdue Tasks"
              value={stats.overdue_tasks}
              iconName="warning-outline"
              colorTheme="rose"
            />
          </View>
        </View>

        {/* Recent Tasks Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Tasks</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('TasksTab')}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentTasks.length === 0 ? (
          <EmptyState
            title="No recent tasks"
            description="Your task list is empty. Add a task to start organizing."
            onAction={() => navigation.navigate('AddTask')}
          />
        ) : (
          recentTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleStatus={handleToggleStatus}
              onEdit={(t) => navigation.navigate('EditTask', { task: t })}
              onDelete={(t) => setDeletingTask(t)}
            />
          ))
        )}
      </ScrollView>

      {/* Confirmation Modal */}
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
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
  },
  subgreeting: {
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 2,
  },
  statsGrid: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
