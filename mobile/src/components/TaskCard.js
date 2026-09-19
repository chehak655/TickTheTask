import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

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

export default function TaskCard({ task, onToggleStatus, onEdit, onDelete }) {
  const { colors, isDark } = useTheme();

  const isCompleted = task.status === 'completed';
  const now = new Date();
  const dueDateObj = parseUtcDate(task.due_date);
  const isOverdue = !isCompleted && dueDateObj && dueDateObj < now;

  const priorityColors = isDark
    ? {
        high: { bg: '#3f121d', text: '#fda4af', border: '#881337' },
        medium: { bg: '#3a2507', text: '#fde68a', border: '#78350f' },
        low: { bg: '#0a0a0a', text: '#94a3b8', border: '#262626' },
      }
    : {
        high: { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
        medium: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
        low: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
      };

  const pColor = priorityColors[task.priority] || priorityColors.low;

  const formattedDate = dueDateObj
    ? dueDateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const completedDateObj = parseUtcDate(task.completed_at);
  const formattedCompletedDate = completedDateObj
    ? completedDateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isCompleted ? colors.completedCard : colors.card,
          borderColor: isCompleted ? colors.completedCardBorder : colors.cardBorder,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Checkbox toggle */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: isCompleted ? colors.successText : (isDark ? '#475569' : '#cbd5e1'),
              backgroundColor: isCompleted ? colors.successText : (isDark ? '#000000' : '#ffffff'),
            },
          ]}
          onPress={() => onToggleStatus(task)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={`Mark task "${task.title}" as ${isCompleted ? 'pending' : 'completed'}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
        >
          {isCompleted && <Ionicons name="checkmark" size={16} color="#ffffff" />}
        </TouchableOpacity>

        {/* Task Details */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: isCompleted ? colors.textMuted : colors.text },
              isCompleted && styles.completedText,
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              style={[
                styles.description,
                { color: isCompleted ? colors.textMuted : colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          ) : null}

          {/* Badges footer */}
          <View style={styles.badgesRow}>
            {/* Priority Badge */}
            <View
              style={[
                styles.badge,
                { backgroundColor: pColor.bg, borderColor: pColor.border },
              ]}
            >
              <Text style={[styles.badgeText, { color: pColor.text }]}>
                {task.priority?.toUpperCase()}
              </Text>
            </View>

            {/* Status Badge */}
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isCompleted ? colors.successBg : colors.primaryLight,
                  borderColor: isCompleted ? colors.successBorder : colors.primaryBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isCompleted ? colors.successText : colors.primaryText },
                ]}
              >
                {isCompleted ? 'COMPLETED' : 'PENDING'}
              </Text>
            </View>

            {/* Completion Timing Badge */}
            {isCompleted && task.completion_timing && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      task.completion_timing === 'completed_early'
                        ? (isDark ? '#064e3b' : '#ecfdf5')
                        : task.completion_timing === 'completed_on_time'
                        ? (isDark ? '#1e3a8a' : '#eff6ff')
                        : task.completion_timing === 'completed_late'
                        ? (isDark ? '#451a03' : '#fffbeb')
                        : (isDark ? '#0a0a0a' : '#f1f5f9'),
                    borderColor:
                      task.completion_timing === 'completed_early'
                        ? (isDark ? '#047857' : '#a7f3d0')
                        : task.completion_timing === 'completed_on_time'
                        ? (isDark ? '#1d4ed8' : '#bfdbfe')
                        : task.completion_timing === 'completed_late'
                        ? (isDark ? '#b45309' : '#fde68a')
                        : (isDark ? '#262626' : '#e2e8f0'),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color:
                        task.completion_timing === 'completed_early'
                          ? (isDark ? '#6ee7b7' : '#059669')
                          : task.completion_timing === 'completed_on_time'
                          ? (isDark ? '#93c5fd' : '#2563eb')
                          : task.completion_timing === 'completed_late'
                          ? (isDark ? '#fcd34d' : '#d97706')
                          : (isDark ? '#94a3b8' : '#64748b'),
                    },
                  ]}
                >
                  {task.completion_timing === 'completed_early'
                    ? '⚡ EARLY'
                    : task.completion_timing === 'completed_on_time'
                    ? '🎯 ON TIME'
                    : task.completion_timing === 'completed_late'
                    ? '⏰ LATE'
                    : '✓ NO DEADLINE'}
                </Text>
              </View>
            )}

            {/* Due Date */}
            {formattedDate ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isOverdue ? colors.dangerBg : (isDark ? '#0a0a0a' : '#f8fafc'),
                    borderColor: isOverdue ? colors.dangerBorder : colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name={isOverdue ? 'alert-circle' : 'calendar-outline'}
                  size={12}
                  color={isOverdue ? colors.dangerText : colors.textSecondary}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: isOverdue ? colors.dangerText : colors.textSecondary },
                  ]}
                >
                  {isOverdue ? `Overdue: ${formattedDate}` : formattedDate}
                </Text>
              </View>
            ) : null}

            {/* Completed Date */}
            {isCompleted && formattedCompletedDate ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={12}
                  color={colors.textSecondary}
                  style={{ marginRight: 3 }}
                />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                  Done: {formattedCompletedDate}
                </Text>
              </View>
            ) : null}

            {/* Reminder Badge */}
            {!isCompleted &&
            task.due_date &&
            task.reminder_minutes !== null &&
            task.reminder_minutes !== undefined ? (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDark ? '#1e1b4b' : '#eef2ff',
                    borderColor: isDark ? '#4338ca' : '#c7d2fe',
                  },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={11}
                  color={colors.primary}
                  style={{ marginRight: 2 }}
                />
                <Text style={[styles.reminderBadgeText, { color: colors.primaryText }]}>
                  {task.reminder_minutes === 0
                    ? 'At due'
                    : task.reminder_minutes < 60
                    ? `${task.reminder_minutes}m`
                    : task.reminder_minutes < 1440
                    ? `${Math.round(task.reminder_minutes / 60)}h`
                    : '1d'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Actions (Edit / Delete) */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onEdit(task)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Edit task ${task.title}`}
            accessibilityRole="button"
          >
            <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onDelete(task)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Delete task ${task.title}`}
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={18} color={colors.dangerText} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reminderBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'column',
    gap: 4,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
