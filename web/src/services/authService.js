import apiClient from './api';

export const authService = {
  async register({ name, email, password }) {
    const response = await apiClient.post('/api/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  async login({ email, password }) {
    const response = await apiClient.post('/api/auth/login', {
      username: email,
      password,
    });
    return response.data; // { access_token }
  },

  async getCurrentUser() {
    const response = await apiClient.get('/api/auth/me');
    return response.data; // { id, name, email, is_email_verified, created_at }
  },

  async verifyEmail(token) {
    const response = await apiClient.post('/api/auth/verify-email', {
      token,
    });
    return response.data; // { message, email, is_email_verified }
  },

  async verifyEmailOtp({ email, otp }) {
    const response = await apiClient.post('/api/auth/verify-email-otp', {
      email,
      otp,
    });
    return response.data; // { message, email, is_email_verified }
  },

  async resendVerification(email = null) {
    const payload = email ? { email } : {};
    const response = await apiClient.post('/api/auth/resend-verification', payload);
    return response.data; // { message, cooldown_seconds }
  },

  async resendVerificationOtp(email = null) {
    const payload = email ? { email } : {};
    const response = await apiClient.post('/api/auth/resend-verification-otp', payload);
    return response.data; // { message, cooldown_seconds }
  },
};

