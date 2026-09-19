import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Menu,
  LogOut,
  User,
  Bell,
  Volume2,
  VolumeX,
  ShieldAlert,
  Sun,
  Moon,
  Laptop,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const {
    permission,
    requestPermission,
    soundEnabled,
    toggleSound,
    activeAlerts,
    unreadCount,
    markAllAsRead,
    clearAllAlerts,
    dismissAlert,
  } = useReminders();

  const [isOpen, setIsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const dropdownRef = useRef(null);
  const themeDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setIsThemeOpen(false);
      }
    };
    if (isOpen || isThemeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isThemeOpen]);

  const handleToggleOpen = () => {
    if (!isOpen && unreadCount > 0) {
      markAllAsRead();
    }
    setIsOpen(!isOpen);
    setIsThemeOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Open Navigation Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link
          to="/dashboard"
          aria-label="TickTheTask Dashboard Home"
          className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <img src="/logo.jpg" alt="TickTheTask Logo" className="w-8 h-8 rounded-lg object-cover bg-white shadow-sm" />
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white hidden sm:inline">
            TickTheTask
          </span>
        </Link>
      </div>

      {/* Right: Verification status, Theme Toggle, Notifications, User Menu & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {user && !user.is_email_verified && (
          <Link
            to="/profile"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Verify Email</span>
          </Link>
        )}

        {/* Theme Switcher Dropdown */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsThemeOpen(!isThemeOpen);
              setIsOpen(false);
            }}
            aria-label="Change theme"
            title="Appearance Theme"
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {isDark ? <Moon className="w-5 h-5 text-primary-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </button>

          {isThemeOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  setIsThemeOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  theme === 'light'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                Light Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  setIsThemeOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Moon className="w-4 h-4 text-primary-400" />
                Dark Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('system');
                  setIsThemeOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  theme === 'system'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <Laptop className="w-4 h-4 text-slate-400" />
                System Auto
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleToggleOpen}
            aria-label="View task reminders and notifications"
            className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Task Reminders</h4>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleSound}
                    title={soundEnabled ? 'Mute reminder chime' : 'Enable reminder chime'}
                    aria-label={soundEnabled ? 'Mute reminder chime' : 'Enable reminder chime'}
                    className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                  </button>
                  {activeAlerts.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllAlerts}
                      className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 px-1.5 py-0.5 rounded transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Permission Banner if not granted */}
              {permission !== 'granted' && (
                <div className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Enable Desktop Alerts
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mb-2">
                      Get notified before tasks are due even when this tab is in background.
                    </p>
                    <button
                      type="button"
                      onClick={requestPermission}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
                    >
                      Allow Notifications
                    </button>
                  </div>
                </div>
              )}

              {/* Alerts List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activeAlerts.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                    <Bell className="w-6 h-6 mx-auto mb-2 opacity-40 stroke-[1.5]" />
                    No active reminders. You will be alerted when upcoming tasks approach their due date.
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {alert.title}
                          </h5>
                        </div>
                        <p className="text-[11px] text-primary-600 dark:text-primary-400 font-medium">
                          Due {alert.leadText} • {alert.priority} priority
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismissAlert(alert.id)}
                        aria-label="Dismiss notification"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Link */}
        <Link
          to="/profile"
          aria-label={`User profile for ${user?.name || 'current user'}`}
          className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[130px] truncate hidden sm:inline">
            {user?.name || 'User'}
          </span>
        </Link>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out of TickTheTask"
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
