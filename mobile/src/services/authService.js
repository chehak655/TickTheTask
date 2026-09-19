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
    return response.data; // { access_token, token_type }
  },

  async getCurrentUser() {
    const response = await apiClient.get('/api/auth/me');
    return response.data; // { id, name, email, created_at, is_email_verified }
  },

  async verifyEmail(token) {
    const response = await apiClient.post('/api/auth/verify-email', { token });
    return response.data;
  },

  async verifyEmailOtp({ email, otp }) {
    const response = await apiClient.post('/api/auth/verify-email-otp', { email, otp });
    return response.data;
  },

  async resendVerification(email) {
    const response = await apiClient.post('/api/auth/resend-verification', { email });
    return response.data;
  },

  async resendVerificationOtp(email) {
    const response = await apiClient.post('/api/auth/resend-verification-otp', { email });
    return response.data;
  },
};

