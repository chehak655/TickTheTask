import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { taskService } from '../services/taskService';
import { notificationService } from '../services/notificationService';
import { useTheme } from '../context/ThemeContext';
import TaskForm from '../components/TaskForm';
import ErrorMessage from '../components/ErrorMessage';

export default function EditTaskScreen({ route, navigation }) {
  const { task } = route.params || {};
  const { colors } = useTheme();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleUpdate = async (payload) => {
    if (!task?.id) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const updated = await taskService.updateTask(task.id, payload);
      if (updated) {
        await notificationService.scheduleTaskNotifications(updated);
      }
      navigation.goBack();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        'Failed to update task. Please check your connection and try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ErrorMessage message={errorMessage} />
      <TaskForm
        initialData={task}
        onSubmit={handleUpdate}
        isSubmitting={isSubmitting}
        submitLabel="Save Changes"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
