import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function StatsCard({
  title,
  value,
  iconName = 'list',
  colorTheme = 'primary', // primary, emerald, amber, rose
}) {
  const { colors, isDark } = useTheme();

  const themes = isDark
    ? {
        primary: {
          iconBg: '#1e1b4b',
          iconColor: '#818cf8',
        },
        emerald: {
          iconBg: '#063826',
          iconColor: '#34d399',
        },
        amber: {
          iconBg: '#3a2507',
          iconColor: '#fbbf24',
        },
        rose: {
          iconBg: '#3f121d',
          iconColor: '#f87171',
        },
      }
    : {
        primary: {
          iconBg: '#eef2ff',
          iconColor: '#4f46e5',
        },
        emerald: {
          iconBg: '#ecfdf5',
          iconColor: '#059669',
        },
        amber: {
          iconBg: '#fffbeb',
          iconColor: '#d97706',
        },
        rose: {
          iconBg: '#fff1f2',
          iconColor: '#e11d48',
        },
      };

  const theme = themes[colorTheme] || themes.primary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: theme.iconBg }]}>
          <Ionicons name={iconName} size={20} color={theme.iconColor} />
        </View>
        <Text style={[styles.value, { color: colors.text }]}>{value ?? 0}</Text>
      </View>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flex: 1,
    minWidth: 140,
    margin: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
