import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={20} color="#e11d48" style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe4e6',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#9f1239',
    lineHeight: 18,
  },
});
