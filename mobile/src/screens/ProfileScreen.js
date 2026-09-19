import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { taskService } from '../services/taskService';
import { authService } from '../services/authService';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { themeMode, setThemeMode, colors, isDark, colorTheme, setColorTheme } = useTheme();
  const [stats, setStats] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [otpToken, setOtpToken] = useState('');

  // cooldown timer logic
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendVerification = async () => {
    if (!user?.email) return;
    setIsSending(true);
    try {
      const data = await authService.resendVerificationOtp(user.email);
      Alert.alert('Verification Sent', data.message || 'Check your email for the code.');
      setCooldown(data.cooldown_seconds || 60);
      setShowTokenInput(true);
    } catch (e) {
      const msg = e.response?.data?.detail || 'Failed to send code.';
      Alert.alert('Error', msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpToken || otpToken.length !== 4) {
      Alert.alert('Invalid', 'Please enter a valid 4-digit code.');
      return;
    }
    setIsVerifying(true);
    try {
      await authService.verifyEmailOtp({ token: otpToken });
      Alert.alert('Success', 'Email verified successfully!');
      setShowTokenInput(false);
      await refreshUser();
    } catch (e) {
      const msg = e.response?.data?.detail || 'Verification failed.';
      Alert.alert('Error', msg);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await taskService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('ProfileScreen stats fetch error:', error);
      }
    };
    fetchStats();
  }, []);

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recent';

  const themeOptions = [
    { id: 'light', label: 'Light', icon: 'sunny' },
    { id: 'dark', label: 'Dark', icon: 'moon' },
    { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || 'email@example.com'}
          </Text>
        </View>

        {/* Theme Preference Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Appearance & Theme</Text>
          <Text style={[styles.themeSubtitle, { color: colors.textSecondary }]}>
            Choose how TickTheTask looks on your device ({isDark ? 'Dark Mode' : 'Light Mode'})
          </Text>

          <View style={styles.themeSelectorRow}>
            {themeOptions.map((opt) => {
              const active = themeMode === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.themeOptionBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.inputBg,
                      borderColor: active ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setThemeMode(opt.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={active ? '#ffffff' : colors.textSecondary}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: active ? '#ffffff' : colors.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <Text style={[styles.cardTitle, { color: colors.textMuted, marginTop: 24 }]}>Accent Color</Text>
          
          <View style={[styles.themeSelectorRow, { flexWrap: 'wrap', gap: 8 }]}>
            {[
              { id: 'tickthetask-lime', label: 'Lime', hex: '#84cc16' },
              { id: 'ocean-blue', label: 'Ocean Blue', hex: '#3b82f6' },
              { id: 'emerald-green', label: 'Emerald', hex: '#10b981' },
              { id: 'sunset-orange', label: 'Sunset', hex: '#f97316' },
              { id: 'royal-purple', label: 'Purple', hex: '#a855f7' }
            ].map((colorOpt) => {
              const active = colorTheme === colorOpt.id;
              return (
                <TouchableOpacity
                  key={colorOpt.id}
                  style={[
                    styles.themeOptionBtn,
                    {
                      flex: 0,
                      width: '48%',
                      flexDirection: 'row',
                      gap: 6,
                      backgroundColor: active ? colors.primaryLight : colors.inputBg,
                      borderColor: active ? colors.primary : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setColorTheme(colorOpt.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colorOpt.hex }} />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: active ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {colorOpt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account Details Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Account Details</Text>

        <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
          <View style={[styles.infoIconBox, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff' }]}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Text style={[styles.infoValue, { color: colors.text, marginTop: 0 }]}>{user?.email || 'N/A'}</Text>
              {user?.is_email_verified ? (
                <View style={[styles.verifiedBadge, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: isDark ? '#047857' : '#a7f3d0' }]}>
                  <Ionicons name="checkmark-circle" size={12} color={isDark ? '#6ee7b7' : '#059669'} />
                  <Text style={[styles.verifiedText, { color: isDark ? '#6ee7b7' : '#059669' }]}>Verified</Text>
                </View>
              ) : (
                <View style={[styles.verifiedBadge, { backgroundColor: isDark ? '#451a03' : '#fffbeb', borderColor: isDark ? '#b45309' : '#fde68a' }]}>
                  <Ionicons name="alert-circle" size={12} color={isDark ? '#fcd34d' : '#d97706'} />
                  <Text style={[styles.verifiedText, { color: isDark ? '#fcd34d' : '#d97706' }]}>Unverified</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Verification banner if unverified */}
        {!user?.is_email_verified && (
          <View style={[styles.unverifiedBox, { backgroundColor: isDark ? '#261805' : '#fffbeb', borderColor: isDark ? '#78350f' : '#fde68a' }]}>
            <Text style={[styles.unverifiedTitle, { color: isDark ? '#fde68a' : '#92400e' }]}>
              Verify your Gmail for email reminders
            </Text>
            <Text style={[styles.unverifiedDesc, { color: isDark ? '#fef3c7' : '#b45309' }]}>
              Task deadline reminders (24h, 1h, 15m) require a verified Gmail address.
            </Text>

            <View style={styles.unverifiedActionsRow}>
              <TouchableOpacity
                style={[styles.resendBtn, { opacity: isSending || cooldown > 0 ? 0.6 : 1 }]}
                onPress={handleResend}
                disabled={isSending || cooldown > 0}
                activeOpacity={0.8}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.resendBtnText}>
                    {cooldown > 0 ? `Resend (${cooldown}s)` : 'Send Code'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.enterTokenBtn, { borderColor: isDark ? '#b45309' : '#d97706' }]}
                onPress={() => setShowTokenInput(!showTokenInput)}
                activeOpacity={0.8}
              >
                <Text style={[styles.enterTokenBtnText, { color: isDark ? '#fde68a' : '#b45309' }]}>
                  {showTokenInput ? 'Cancel' : 'Enter Code (OTP)'}
                </Text>
              </TouchableOpacity>
            </View>

            {showTokenInput && (
              <View style={styles.tokenInputContainer}>
                <TextInput
                  style={[styles.tokenInput, { backgroundColor: isDark ? '#000000' : '#ffffff', color: isDark ? '#ffffff' : '#000000', borderColor: isDark ? '#475569' : '#cbd5e1', letterSpacing: 4, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }]}
                  placeholder="0427"
                  placeholderTextColor="#94a3b8"
                  value={inputToken}
                  onChangeText={(t) => setInputToken(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="numeric"
                  maxLength={4}
                />
                <TouchableOpacity
                  style={[styles.verifyTokenBtn, { opacity: isVerifying || inputToken.length !== 4 ? 0.6 : 1 }]}
                  onPress={handleVerifyOtp}
                  disabled={isVerifying || inputToken.length !== 4}
                  activeOpacity={0.8}
                >
                  {isVerifying ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.verifyTokenBtnText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
          <View style={[styles.infoIconBox, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff' }]}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Member Since</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formattedDate}</Text>
          </View>
        </View>

        <View style={[styles.infoRow, { borderBottomColor: colors.divider }]}>
          <View style={[styles.infoIconBox, { backgroundColor: isDark ? '#063826' : '#ecfdf5' }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.successText} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Authentication</Text>
            <Text style={[styles.infoValue, { color: colors.successText }]}>JWT Authenticated</Text>
          </View>
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.infoIconBox, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff' }]}>
            <Ionicons name="list-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Total Tasks Managed</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{stats?.total_tasks ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* Logout Action */}
      <TouchableOpacity
        style={[
          styles.logoutBtn,
          { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder },
        ]}
        onPress={logout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.dangerText} style={{ marginRight: 8 }} />
        <Text style={[styles.logoutBtnText, { color: colors.dangerText }]}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  themeSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  unverifiedBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 8,
  },
  unverifiedTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  unverifiedDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  unverifiedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  enterTokenBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterTokenBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tokenInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  tokenInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  verifyTokenBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyTokenBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
