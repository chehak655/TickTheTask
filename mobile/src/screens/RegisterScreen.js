import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password rules validation
  const rules = {
    hasLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (!/^[a-zA-Z0-9_.+-]+@(gmail|googlemail)\.com$/i.test(email.trim())) {
      setErrorMessage('Please enter a valid Gmail address (@gmail.com / @googlemail.com).');
      return;
    }

    if (!rules.hasLength || !rules.hasUpper || !rules.hasLower || !rules.hasDigit) {
      setErrorMessage('Password must be 8+ characters and contain uppercase, lowercase, and digit.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    const result = await register(name.trim(), email.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Image source={require('../../assets/logo.jpg')} style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 12 }} />
          <Text style={styles.appTitle}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start tracking your tasks</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          <ErrorMessage message={errorMessage} />

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="your name"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>

            {/* Checklist */}
            <View style={styles.checklist}>
              <View style={styles.checkItem}>
                <Ionicons
                  name={rules.hasLength ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={rules.hasLength ? '#10b981' : '#64748b'}
                />
                <Text style={[styles.checkText, rules.hasLength && styles.checkTextActive]}>
                  8+ chars
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Ionicons
                  name={rules.hasUpper ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={rules.hasUpper ? '#10b981' : '#64748b'}
                />
                <Text style={[styles.checkText, rules.hasUpper && styles.checkTextActive]}>
                  Uppercase
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Ionicons
                  name={rules.hasLower ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={rules.hasLower ? '#10b981' : '#64748b'}
                />
                <Text style={[styles.checkText, rules.hasLower && styles.checkTextActive]}>
                  Lowercase
                </Text>
              </View>
              <View style={styles.checkItem}>
                <Ionicons
                  name={rules.hasDigit ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={rules.hasDigit ? '#10b981' : '#64748b'}
                />
                <Text style={[styles.checkText, rules.hasDigit && styles.checkTextActive]}>
                  Digit
                </Text>
              </View>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#0a0a0a',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
  },
  checklist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkText: {
    fontSize: 11,
    color: '#64748b',
  },
  checkTextActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  linkText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '700',
  },
});
