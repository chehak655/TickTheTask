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
    return response.data; // { id, name, email, created_at }
  }
};
