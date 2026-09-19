import axios from 'axios';
import { Platform, DeviceEventEmitter } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const getDefaultBaseUrl = () => {
  // 1. Explicit env var
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Dynamic host resolution from Expo Go / Metro bundler
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000`;
    }
  }

  // 3. Fallback to appropriate loopback for emulators/simulators
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://127.0.0.1:8000';
};

const apiClient = axios.create({
  baseURL: getDefaultBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
  timeout: 15000,
});

// Request interceptor to attach token from SecureStore
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('tickthetask_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading token from SecureStore:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401s
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      if (!error.config.url.includes('/api/auth/login')) {
        try {
          await SecureStore.deleteItemAsync('tickthetask_token');
          await SecureStore.deleteItemAsync('tickthetask_user');
          DeviceEventEmitter.emit('auth:unauthorized');
        } catch (e) {
          // ignore
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
