import apiClient from './api';

export const taskService = {
  async getTasks(params = {}) {
    const response = await apiClient.get('/api/tasks', { params });
    return response.data;
  },

  async getCalendarTasks(startDate = null, endDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await apiClient.get('/api/tasks/calendar', { params });
    return response.data;
  },

  async getTask(id) {
    const response = await apiClient.get(`/api/tasks/${id}`);
    return response.data;
  },

  async createTask(data) {
    const response = await apiClient.post('/api/tasks', data);
    return response.data;
  },

  async updateTask(id, data) {
    const response = await apiClient.put(`/api/tasks/${id}`, data);
    return response.data;
  },

  async updateTaskStatus(id, status) {
    const response = await apiClient.patch(`/api/tasks/${id}/status`, { status });
    return response.data;
  },

  async deleteTask(id) {
    const response = await apiClient.delete(`/api/tasks/${id}`);
    return response.data;
  },

  async getDashboardStats() {
    const response = await apiClient.get('/api/dashboard/stats');
    return response.data;
  },
};
