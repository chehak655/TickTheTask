import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { taskService } from '../services/taskService';
import { notificationService } from '../services/notificationService';
import { useTheme } from '../context/ThemeContext';
import TaskForm from '../components/TaskForm';
import ErrorMessage from '../components/ErrorMessage';

export default function AddTaskScreen({ navigation, route }) {
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const initialData = route?.params?.initialDueDate
    ? { due_date: route.params.initialDueDate }
    : route?.params?.initialData || null;

  const handleCreate = async (payload) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const created = await taskService.createTask(payload);
      if (created) {
        await notificationService.scheduleTaskNotifications(created);
      }
      navigation.goBack();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Failed to create task. Please check your connection and try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ErrorMessage message={errorMessage} />
      <TaskForm
        initialData={initialData}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        submitLabel="Create Task"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
