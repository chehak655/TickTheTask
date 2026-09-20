import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ReminderProvider } from './context/ReminderContext';
import { ThemeProvider } from './context/ThemeContext';

// Guards & Layouts
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CalendarView from './pages/CalendarView';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <ToastProvider>
          <AuthProvider>
            <ReminderProvider>
              <Routes>
                {/* Public / Global routes */}

                {/* Public routes (accessible only when not logged in) */}
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>

                {/* Protected routes (require valid JWT session) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                {/* 404 Not Found fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ReminderProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
