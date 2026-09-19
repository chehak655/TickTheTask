import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ConfirmationDialog({
  visible,
  title = 'Delete Task',
  message = 'Are you sure you want to delete this task? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.header}>
            <View
              style={[
                styles.iconBox,
                isDestructive
                  ? { backgroundColor: colors.dangerBg }
                  : { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff' },
              ]}
            >
              <Ionicons
                name={isDestructive ? 'trash-outline' : 'alert-circle-outline'}
                size={22}
                color={isDestructive ? colors.dangerText : colors.primary}
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>

          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                { backgroundColor: isDark ? '#262626' : '#f1f5f9' },
              ]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cancelText,
                  { color: isDark ? '#cbd5e1' : '#475569' },
                ]}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                isDestructive
                  ? { backgroundColor: colors.dangerText }
                  : { backgroundColor: colors.primary },
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
