import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import {
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
} from 'expo-notifications/build/cancelScheduledNotificationAsync';
import {
  requestPermissionsAsync,
  getPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';

// Configure foreground presentation behavior safely
try {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  // ignore
}

/**
 * Configure Android Notification Channel (only if supported by host environment)
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android' && !isRunningInExpoGo()) {
    try {
      await setNotificationChannelAsync('tickthetask-reminders', {
        name: 'Task Reminders & Deadlines',
        importance: 7, // MAX importance
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4f46e5',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Request notification permissions and register channel
 */
export async function requestNotificationPermissions() {
  try {
    await setupNotificationChannel();
    const { status: existingStatus } = await getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    return false;
  }
}

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

/**
 * Cancel any scheduled notifications for a task
 */
export async function cancelTaskNotifications(taskId) {
  if (!taskId) return;
  try {
    await cancelScheduledNotificationAsync(`task-due-${taskId}`);
  } catch (e) {
    // ignore
  }
  try {
    await cancelScheduledNotificationAsync(`task-lead-${taskId}`);
  } catch (e) {
    // ignore
  }
}

/**
 * Schedule local notifications for a task (exact due time & lead reminder)
 */
export async function scheduleTaskNotifications(task) {
  if (!task || !task.id) return;

  // Always cancel any prior notifications for this task first
  await cancelTaskNotifications(task.id);

  // If task is completed or has no due date, do not schedule
  if (task.status === 'completed' || !task.due_date) {
    return;
  }

  const dueDate = parseUtcDate(task.due_date);
  if (!dueDate || isNaN(dueDate.getTime())) return;

  const now = new Date();
  const timeUntilDueMs = dueDate.getTime() - now.getTime();

  // 1. Schedule Exact Due Date Notification if in future
  if (timeUntilDueMs > 0) {
    const dueSeconds = Math.max(1, Math.floor(timeUntilDueMs / 1000));
    try {
      await scheduleNotificationAsync({
        identifier: `task-due-${task.id}`,
        content: {
          title: `⏰ Task Due Now: ${task.title}`,
          body: task.description ? task.description : 'Your task deadline is here!',
          sound: 'default',
          priority: 'max',
          channelId: 'tickthetask-reminders',
          data: { taskId: task.id, type: 'due' },
        },
        trigger: {
          type: 'timeInterval',
          seconds: dueSeconds,
          repeats: false,
        },
      });
    } catch (err) {
      // ignore
    }
  }

  // 2. Schedule Lead Reminder Notification if set and in future
  const reminderMinutes = Number(task.reminder_minutes);
  if (reminderMinutes && reminderMinutes > 0) {
    const reminderTimeMs = dueDate.getTime() - reminderMinutes * 60 * 1000;
    const timeUntilReminderMs = reminderTimeMs - now.getTime();

    if (timeUntilReminderMs > 0) {
      const reminderSeconds = Math.max(1, Math.floor(timeUntilReminderMs / 1000));
      const leadLabel =
        reminderMinutes < 60
          ? `${reminderMinutes} minute${reminderMinutes === 1 ? '' : 's'}`
          : reminderMinutes < 1440
          ? `${Math.round(reminderMinutes / 60)} hour${Math.round(reminderMinutes / 60) === 1 ? '' : 's'}`
          : '1 day';

      try {
        await scheduleNotificationAsync({
          identifier: `task-lead-${task.id}`,
          content: {
            title: `🔔 Task Reminder: ${task.title}`,
            body: `Due in ${leadLabel} (${(task.priority || 'medium').toUpperCase()} priority)`,
            sound: 'default',
            priority: 'high',
            channelId: 'tickthetask-reminders',
            data: { taskId: task.id, type: 'lead_reminder' },
          },
          trigger: {
            type: 'timeInterval',
            seconds: reminderSeconds,
            repeats: false,
          },
        });
      } catch (err) {
        // ignore
      }
    }
  }
}

/**
 * Synchronize notifications for a list of tasks (e.g., on app load or refresh)
 */
export async function syncAllTaskNotifications(tasks) {
  if (!Array.isArray(tasks)) return;
  for (const task of tasks) {
    if (task.status === 'completed') {
      await cancelTaskNotifications(task.id);
    } else if (task.due_date) {
      await scheduleTaskNotifications(task);
    }
  }
}

export const notificationService = {
  setupNotificationChannel,
  requestNotificationPermissions,
  scheduleTaskNotifications,
  cancelTaskNotifications,
  syncAllTaskNotifications,
};

export default notificationService;
