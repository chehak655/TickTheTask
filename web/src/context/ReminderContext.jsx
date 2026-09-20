import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { taskService } from '../services/taskService';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendDesktopNotification,
  playReminderSound,
  formatLeadTime,
  isNotificationSupported,
} from '../services/reminderService';

const ReminderContext = createContext(null);

const parseUtcDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/-\d\d:\d\d$/)) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
};

export function ReminderProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [permission, setPermission] = useState(() => getNotificationPermission());
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('tickthetask_sound_enabled') !== 'false';
  });

  const notifiedTasksRef = useRef(new Set());
  const intervalRef = useRef(null);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('tickthetask_sound_enabled', String(next));
      return next;
    });
  }, []);

  const handleRequestPermission = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      showToast('Browser notifications enabled successfully!', 'success');
      playReminderSound();
    } else if (res === 'denied') {
      showToast('Notifications blocked in browser settings.', 'warning');
    }
    return res;
  }, [showToast]);

  const checkReminders = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch user's pending tasks
      const tasks = await taskService.getTasks({ status: 'pending', limit: 50 });
      const now = Date.now();

      tasks.forEach((task) => {
        if (!task.due_date) return;
        const reminderMins = task.reminder_minutes !== undefined && task.reminder_minutes !== null ? task.reminder_minutes : 15;
        if (reminderMins === null || reminderMins === undefined) return;

        const dueTimestamp = parseUtcDate(task.due_date)?.getTime();
        if (!dueTimestamp || isNaN(dueTimestamp)) return;

        // Reminder threshold: [dueDate - reminderMins*60*1000] up to dueDate + 5 mins
        const triggerTime = dueTimestamp - reminderMins * 60 * 1000;
        const taskKey = `${task.id}-${task.reminder_minutes}-${dueTimestamp}`;

        // Check if task is within reminder window and hasn't been notified yet
        if (now >= triggerTime && now <= dueTimestamp + 5 * 60 * 1000) {
          if (!notifiedTasksRef.current.has(taskKey)) {
            notifiedTasksRef.current.add(taskKey);

            const minutesLeft = Math.max(0, Math.round((dueTimestamp - now) / (60 * 1000)));
            const leadText = minutesLeft === 0 ? 'right now' : formatLeadTime(minutesLeft);

            // 1. Audio chime
            if (soundEnabled) {
              playReminderSound();
            }

            // 2. Desktop notification
            sendDesktopNotification(task, leadText);

            // 3. In-app toast
            showToast(`? Reminder: "${task.title}" is due ${leadText}!`, 'info', 6000);

            // 4. Record to active alerts
            setActiveAlerts((prev) => [
              {
                id: task.id,
                title: task.title,
                priority: task.priority,
                due_date: task.due_date,
                leadText,
                timestamp: new Date(),
                read: false,
              },
              ...prev.slice(0, 19), // keep last 20
            ]);
          }
        }
      });
    } catch (err) {
      // Silently catch background polling errors
    }
  }, [user, soundEnabled, showToast]);

  // Periodic reminder checking every 15 seconds
  useEffect(() => {
    if (!user) {
      notifiedTasksRef.current.clear();
      setActiveAlerts([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    checkReminders();
        // intervalRef.current = setInterval(checkReminders, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, checkReminders]);

  const dismissAlert = useCallback((id) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setActiveAlerts([]);
  }, []);

  const unreadCount = activeAlerts.filter((a) => !a.read).length;

  const markAllAsRead = useCallback(() => {
    setActiveAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  return (
    <ReminderContext.Provider
      value={{
        permission,
        soundEnabled,
        toggleSound,
        requestPermission: handleRequestPermission,
        activeAlerts,
        unreadCount,
        dismissAlert,
        clearAllAlerts,
        markAllAsRead,
        isSupported: isNotificationSupported(),
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
}
