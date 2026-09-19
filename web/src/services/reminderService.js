// Web Notification & Audio Chime Service for TickTheTask Reminders

/**
 * Play a gentle, professional 2-tone notification chime using the Web Audio API.
 * Does not require any external audio files.
 */
export const playReminderSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Tone 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: A5 (880.00 Hz) - crisp resolution
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.15);
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.19);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.15);
    osc2.stop(now + 0.65);
  } catch (err) {
    // Audio context may be blocked by autoplay policies until user interaction
  }
};

/**
 * Check if the browser supports the Web Notification API.
 */
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current permission state: 'granted', 'denied', or 'default'.
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Request notification permissions from user.
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return Notification.permission;
  }
};

/**
 * Trigger a native desktop notification.
 */
export const sendDesktopNotification = (task, leadTimeText = 'soon') => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const title = `Task Reminder: ${task.title}`;
    const options = {
      body: `Due ${leadTimeText} • Priority: ${task.priority.toUpperCase()}`,
      icon: '/favicon.ico',
      tag: `task-reminder-${task.id}-${task.reminder_minutes}`,
      renotify: true,
      requireInteraction: false,
    };

    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('Could not display desktop notification:', err);
    return null;
  }
};

/**
 * Format reminder minutes into human readable text (e.g., 15 -> 'in 15 minutes').
 */
export const formatLeadTime = (minutes) => {
  if (minutes === 0) return 'now';
  if (minutes === 5) return 'in 5 minutes';
  if (minutes === 15) return 'in 15 minutes';
  if (minutes === 30) return 'in 30 minutes';
  if (minutes === 60) return 'in 1 hour';
  if (minutes === 120) return 'in 2 hours';
  if (minutes === 1440) return 'in 1 day';
  if (minutes < 60) return `in ${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return `in ${hours} hour${hours > 1 ? 's' : ''}`;
};
