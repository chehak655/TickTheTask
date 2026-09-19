import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { taskService } from '../services/taskService';
import TaskCard from '../components/TaskCard';
import ConfirmationDialog from '../components/ConfirmationDialog';

const parseUtcDate = (dateStr) => {
  if (!dateStr) return null;
  if (
    typeof dateStr === 'string' &&
    !dateStr.endsWith('Z') &&
    !dateStr.includes('+') &&
    !dateStr.match(/-\d\d:\d\d$/)
  ) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
};

export default function CalendarScreen({ navigation }) {
  const { colors, isDark } = useTheme();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingTask, setDeletingTask] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const requestRef = React.useRef(0);

  const loadCalendarTasks = useCallback(async () => {
    const reqId = ++requestRef.current;
    try {
      const startOfMonth = new Date(year, month - 1, 20);
      const endOfMonth = new Date(year, month + 1, 10);
      const data = await taskService.getCalendarTasks(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      if (reqId !== requestRef.current) return;
      setTasks(data);
    } catch (err) {
      if (reqId === requestRef.current) {
        console.warn('Error loading calendar tasks:', err);
      }
    } finally {
      if (reqId === requestRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [year, month]);

  useEffect(() => {
    setIsLoading(true);
    loadCalendarTasks();
  }, [loadCalendarTasks]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCalendarTasks();
    });
    return unsubscribe;
  }, [navigation, loadCalendarTasks]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCalendarTasks();
  };

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

  // Calendar grid calculations
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
  // Next month padding
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

  const getTasksForDay = (date) => {
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      const d = parseUtcDate(t.due_date);
      return d && isSameDay(d, date);
    });
  };

  const selectedDayTasks = getTasksForDay(selectedDate);
  const now = new Date();

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await taskService.updateTaskStatus(task.id, newStatus);
      loadCalendarTasks();
    } catch (err) {
      // ignore
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    try {
      await taskService.deleteTask(deletingTask.id);
      setDeletingTask(null);
      loadCalendarTasks();
    } catch (err) {
      // ignore
    }
  };

  const handleAddTaskOnDate = () => {
    const pad = (n) => String(n).padStart(2, '0');
    const localIso = `${selectedDate.getFullYear()}-${pad(
      selectedDate.getMonth() + 1
    )}-${pad(selectedDate.getDate())}T12:00`;
    navigation.navigate('AddTask', { initialDueDate: localIso });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Calendar Card */}
      <View
        style={[
          styles.calendarCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        {/* Month Header & Controls */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {monthNames[month]} {year}
            </Text>
          </View>
          <View style={styles.controlsGroup}>
            <TouchableOpacity
              style={[styles.todayBtn, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff' }]}
              onPress={handleToday}
              activeOpacity={0.7}
            >
              <Text style={[styles.todayBtnText, { color: colors.primary }]}>Today</Text>
            </TouchableOpacity>
            <View style={[styles.navButtonGroup, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
                accessibilityLabel="Previous month"
              >
                <Ionicons name="chevron-back" size={16} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={handleNextMonth}
                activeOpacity={0.7}
                accessibilityLabel="Next month"
              >
                <Ionicons name="chevron-forward" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Weekday Names */}
        <View style={styles.weekRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <Text key={d} style={[styles.weekdayText, { color: colors.textMuted }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.daysGrid}>
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
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? '#1e1b4b' : '#eef2ff')
                      : isToday
                      ? (isDark ? '#000000' : '#f8fafc')
                      : 'transparent',
                    borderColor: isSelected
                      ? colors.primary
                      : isToday
                      ? (isDark ? '#312e81' : '#c7d2fe')
                      : 'transparent',
                  },
                ]}
                onPress={() => setSelectedDate(item.date)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dayNumberCircle,
                    isToday && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumberText,
                      {
                        color: isToday
                          ? '#ffffff'
                          : isSelected
                          ? colors.primary
                          : item.isCurrentMonth
                          ? colors.text
                          : colors.textMuted,
                        fontWeight: isSelected || isToday ? '800' : '600',
                      },
                    ]}
                  >
                    {item.date.getDate()}
                  </Text>
                </View>

                {/* Status indicator dots */}
                <View style={styles.dotsRow}>
                  {overdueCount > 0 && <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />}
                  {pendingCount > 0 && overdueCount === 0 && (
                    <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                  )}
                  {completedCount > 0 && (
                    <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Day Task List Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="calendar" size={18} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <View style={[styles.badgeCount, { backgroundColor: isDark ? '#0a0a0a' : '#e2e8f0' }]}>
            <Text style={[styles.badgeCountText, { color: colors.textSecondary }]}>
              {selectedDayTasks.length}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleAddTaskOnDate}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Day Task List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 24 }} />
      ) : selectedDayTasks.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={36}
            color={colors.textMuted}
            style={{ opacity: 0.5, marginBottom: 8 }}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No tasks scheduled for this day
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={handleAddTaskOnDate}
            activeOpacity={0.7}
          >
            <Text style={[styles.emptyAddBtnText, { color: colors.primary }]}>
              + Add a task for this date
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        selectedDayTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleStatus={handleToggleStatus}
            onEdit={(t) => navigation.navigate('EditTask', { task: t })}
            onDelete={(t) => setDeletingTask(t)}
          />
        ))
      )}

      {/* Unscheduled Tasks Section */}
      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="alert-circle" size={18} color="#d97706" style={{ marginRight: 6 }} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Unscheduled Tasks
          </Text>
          <View style={[styles.badgeCount, { backgroundColor: isDark ? '#0a0a0a' : '#e2e8f0' }]}>
            <Text style={[styles.badgeCountText, { color: colors.textSecondary }]}>
              {tasks.filter(t => !t.due_date).length}
            </Text>
          </View>
        </View>
      </View>

      {/* Unscheduled Tasks List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 24 }} />
      ) : tasks.filter(t => !t.due_date).length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, padding: 20 }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            All tasks have been scheduled.
          </Text>
        </View>
      ) : (
        tasks.filter(t => !t.due_date).map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onToggleStatus={handleToggleStatus}
            onEdit={(t) => navigation.navigate('EditTask', { task: t })}
            onDelete={(t) => setDeletingTask(t)}
          />
        ))
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingTask(null)}
      />
    </ScrollView>
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
  calendarCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  navButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  navBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    width: 38,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 2,
    marginVertical: 2,
  },
  dayNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: 6,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  badgeCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyAddBtn: {
    marginTop: 8,
    paddingVertical: 4,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
