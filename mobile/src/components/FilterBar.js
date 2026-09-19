import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function FilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  counts = {},
}) {
  const { colors, isDark } = useTheme();

  const statuses = [
    { id: 'all', label: 'All', count: counts.total },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  const priorities = [
    { id: 'all', label: 'All Priorities' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.headerBg,
          borderBottomColor: colors.divider,
        },
      ]}
    >
      {/* Search Input */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: colors.inputText }]}
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search tasks..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          accessibilityLabel="Search tasks"
        />
        {search ? (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            style={styles.clearBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Clear search text"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScroll}
      >
        {statuses.map((s) => {
          const active = statusFilter === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? colors.primary : (isDark ? '#0a0a0a' : '#f1f5f9'),
                },
              ]}
              onPress={() => onStatusChange(s.id)}
              activeOpacity={0.7}
              accessibilityLabel={`Filter by ${s.label} status`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: active ? '#ffffff' : colors.textSecondary },
                  active && styles.pillTextActive,
                ]}
              >
                {s.label}
              </Text>
              {s.count !== undefined ? (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: active
                        ? (isDark ? '#4338ca' : '#6366f1')
                        : (isDark ? '#262626' : '#e2e8f0'),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: active ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569') },
                    ]}
                  >
                    {s.count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Priority Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScroll}
      >
        {priorities.map((p) => {
          const active = priorityFilter === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.priorityPill,
                {
                  backgroundColor: active
                    ? (isDark ? '#1e1b4b' : '#eef2ff')
                    : colors.card,
                  borderColor: active ? colors.primary : colors.cardBorder,
                },
              ]}
              onPress={() => onPriorityChange(p.id)}
              activeOpacity={0.7}
              accessibilityLabel={`Filter by ${p.label} priority`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.priorityPillText,
                  { color: active ? colors.primary : colors.textSecondary },
                  active && styles.priorityPillTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  clearBtn: {
    padding: 6,
  },
  pillsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minHeight: 36,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priorityPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 34,
  },
  priorityPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityPillTextActive: {
    fontWeight: '700',
  },
});
