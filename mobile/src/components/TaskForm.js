import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import ErrorMessage from './ErrorMessage';

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

export default function TaskForm({
  initialData = null,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save Task',
}) {
  const { colors, isDark } = useTheme();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: null, // Date object or null
    reminder_minutes: 15,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      let parsedDate = null;
      if (initialData.due_date) {
        try {
          const d = parseUtcDate(initialData.due_date);
          if (d && !isNaN(d.getTime())) {
            parsedDate = d;
          }
        } catch (e) {
          parsedDate = null;
        }
      }

      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        status: initialData.status || 'pending',
        priority: initialData.priority || 'medium',
        due_date: parsedDate,
        reminder_minutes:
          initialData.reminder_minutes !== undefined && initialData.reminder_minutes !== null
            ? initialData.reminder_minutes
            : 15,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: null,
        reminder_minutes: 15,
      });
    }
  }, [initialData]);

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Title is required.';
    } else if (formData.title.trim().length > 255) {
      errs.title = 'Title must be 255 characters or fewer.';
    }

    if (formData.description && formData.description.length > 2000) {
      errs.description = 'Description must be 2000 characters or fewer.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date ? formData.due_date.toISOString() : null,
      reminder_minutes:
        formData.due_date && formData.reminder_minutes !== null
          ? Number(formData.reminder_minutes)
          : null,
    };

    onSubmit(payload);
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      const handleDatePicked = (event, selected) => {
        if ((event.type === 'set' || !event.type) && selected) {
          const current = formData.due_date ? new Date(formData.due_date) : new Date();
          current.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
          setFormData((prev) => ({ ...prev, due_date: current }));

          // Automatically open time picker after date is chosen
          setTimeout(() => {
            openTimePicker(current);
          }, 200);
        }
      };

      DateTimePickerAndroid.open({
        value: formData.due_date || new Date(),
        onChange: handleDatePicked,
        onValueChange: handleDatePicked,
        mode: 'date',
        is24Hour: false,
      });
    } else {
      setShowDatePicker(true);
    }
  };

  const openTimePicker = (baseDate) => {
    if (Platform.OS === 'android') {
      const handleTimePicked = (event, selected) => {
        if ((event.type === 'set' || !event.type) && selected) {
          const current = (baseDate || formData.due_date)
            ? new Date(baseDate || formData.due_date)
            : new Date();
          current.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
          setFormData((prev) => ({ ...prev, due_date: current }));
        }
      };

      DateTimePickerAndroid.open({
        value: baseDate || formData.due_date || new Date(),
        onChange: handleTimePicked,
        onValueChange: handleTimePicked,
        mode: 'time',
        is24Hour: false,
      });
    } else {
      setShowTimePicker(true);
    }
  };

  const handleIOSDateChange = (event, selected) => {
    setShowDatePicker(false);
    if (!selected) return;
    const current = formData.due_date ? new Date(formData.due_date) : new Date();
    current.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setFormData({ ...formData, due_date: current });
  };

  const handleIOSTimeChange = (event, selected) => {
    setShowTimePicker(false);
    if (!selected) return;
    const current = formData.due_date ? new Date(formData.due_date) : new Date();
    current.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setFormData({ ...formData, due_date: current });
  };

  const setQuickDate = (daysAhead, hours = 17, minutes = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hours, minutes, 0, 0);
    setFormData({ ...formData, due_date: d });
  };

  const priorities = [
    { id: 'low', label: 'Low', color: '#64748b' },
    { id: 'medium', label: 'Medium', color: '#d97706' },
    { id: 'high', label: 'High', color: '#e11d48' },
  ];

  const statuses = [
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
  ];

  const formatDisplayDate = (d) => {
    if (!d) return 'Select Date & Time (Optional)';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Task Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
              errors.title && styles.inputError,
            ]}
            value={formData.title}
            onChangeText={(v) => {
              setFormData({ ...formData, title: v });
              if (errors.title) setErrors({ ...errors, title: null });
            }}
            placeholder="e.g. Complete quarterly report"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Task title input"
          />
          {errors.title && <ErrorMessage message={errors.title} />}
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Description (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
              errors.description && styles.inputError,
            ]}
            value={formData.description}
            onChangeText={(v) => {
              setFormData({ ...formData, description: v });
              if (errors.description) setErrors({ ...errors, description: null });
            }}
            placeholder="Add additional details or notes..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Task description input"
          />
          {errors.description && <ErrorMessage message={errors.description} />}
        </View>

        {/* Priority Selector */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
          <View style={styles.selectorRow}>
            {priorities.map((p) => {
              const active = formData.priority === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.selectorBtn,
                    {
                      backgroundColor: active ? p.color : colors.card,
                      borderColor: active ? p.color : colors.inputBorder,
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, priority: p.id })}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${p.label} priority`}
                >
                  <Text
                    style={[
                      styles.selectorBtnText,
                      { color: active ? '#ffffff' : colors.textSecondary },
                      active && styles.selectorBtnTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Status Selector */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
          <View style={styles.selectorRow}>
            {statuses.map((s) => {
              const active = formData.status === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.selectorBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.inputBorder,
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, status: s.id })}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${s.label} status`}
                >
                  <Text
                    style={[
                      styles.selectorBtnText,
                      { color: active ? '#ffffff' : colors.textSecondary },
                      active && styles.selectorBtnTextActive,
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Due Date & Interactive Calendar Picker */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Due Date & Time</Text>

          {/* Quick Date Presets */}
          <View style={styles.quickDateRow}>
            <TouchableOpacity
              style={[
                styles.quickDateBtn,
                { backgroundColor: isDark ? '#0a0a0a' : '#f1f5f9', borderColor: colors.inputBorder },
              ]}
              onPress={() => setQuickDate(0, 18, 0)}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickDateText, { color: colors.textSecondary }]}>Today 6 PM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickDateBtn,
                { backgroundColor: isDark ? '#0a0a0a' : '#f1f5f9', borderColor: colors.inputBorder },
              ]}
              onPress={() => setQuickDate(1, 10, 0)}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickDateText, { color: colors.textSecondary }]}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickDateBtn,
                { backgroundColor: isDark ? '#0a0a0a' : '#f1f5f9', borderColor: colors.inputBorder },
              ]}
              onPress={() => setQuickDate(7, 17, 0)}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickDateText, { color: colors.textSecondary }]}>Next Week</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Calendar Card */}
          <TouchableOpacity
            style={[
              styles.dateCard,
              {
                backgroundColor: formData.due_date
                  ? (isDark ? '#1e1b4b' : '#eef2ff')
                  : colors.card,
                borderColor: formData.due_date
                  ? colors.primary
                  : colors.inputBorder,
              },
            ]}
            onPress={openDatePicker}
            activeOpacity={0.7}
            accessibilityLabel="Open calendar date picker"
          >
            <View style={styles.dateCardLeft}>
              <Ionicons
                name="calendar"
                size={20}
                color={formData.due_date ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.dateCardText,
                  { color: formData.due_date ? (isDark ? '#e0e7ff' : '#312e81') : colors.textMuted },
                  formData.due_date && styles.dateCardTextActive,
                ]}
              >
                {formatDisplayDate(formData.due_date)}
              </Text>
            </View>
            <View style={styles.dateCardActions}>
              {formData.due_date ? (
                <>
                  <TouchableOpacity
                    onPress={() => openTimePicker()}
                    style={[styles.timeBtn, { backgroundColor: isDark ? '#312e81' : '#e0e7ff' }]}
                    accessibilityLabel="Change time"
                  >
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, due_date: null })}
                    style={styles.clearBtn}
                    accessibilityLabel="Clear date"
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* iOS Native Date Picker Modal */}
        {Platform.OS === 'ios' && showDatePicker && (
          <DateTimePicker
            value={formData.due_date || new Date()}
            mode="date"
            display="spinner"
            onChange={handleIOSDateChange}
          />
        )}

        {/* iOS Native Time Picker Modal */}
        {Platform.OS === 'ios' && showTimePicker && (
          <DateTimePicker
            value={formData.due_date || new Date()}
            mode="time"
            is24Hour={false}
            display="spinner"
            onChange={handleIOSTimeChange}
          />
        )}

        {/* Reminder Selector */}
        {formData.due_date ? (
          <View style={styles.field}>
            <View style={styles.reminderLabelRow}>
              <Ionicons name="notifications-outline" size={15} color={colors.primary} />
              <Text style={[styles.reminderLabel, { color: colors.primary }]}>
                Remind Me Before Due
              </Text>
            </View>
            <View style={styles.selectorRow}>
              {[
                { label: 'None', val: null },
                { label: '5m', val: 5 },
                { label: '15m (Rec)', val: 15 },
                { label: '30m', val: 30 },
                { label: '1h', val: 60 },
                { label: '1d', val: 1440 },
              ].map((rem) => {
                const active = formData.reminder_minutes === rem.val;
                return (
                  <TouchableOpacity
                    key={String(rem.val)}
                    style={[
                      styles.selectorBtn,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.inputBorder,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, reminder_minutes: rem.val })}
                  >
                    <Text
                      style={[
                        styles.selectorBtnText,
                        { color: active ? '#ffffff' : colors.textSecondary },
                        active && styles.selectorBtnTextActive,
                      ]}
                    >
                      {rem.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary },
            isSubmitting && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>{submitLabel}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  selectorBtn: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectorBtnTextActive: {
    fontWeight: '700',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickDateBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dateCardText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateCardTextActive: {
    fontWeight: '600',
  },
  dateCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeBtn: {
    padding: 6,
    borderRadius: 6,
  },
  clearBtn: {
    padding: 4,
  },
  reminderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reminderLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
