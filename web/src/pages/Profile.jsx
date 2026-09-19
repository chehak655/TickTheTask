import React, { useState, useEffect } from 'react';
import { Mail, Calendar, ShieldCheck, LogOut, CheckCircle2, Sun, Moon, Laptop, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { taskService } from '../services/taskService';
import { authService } from '../services/authService';

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark, colorTheme, setColorTheme } = useTheme();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsSendingVerification(true);
    try {
      const data = await authService.resendVerificationOtp(user.email);
      showToast(data.message || 'Verification code sent to your email.', 'success');
      setResendCooldown(data.cooldown_seconds || 60);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to send verification code.';
      showToast(msg, 'error');
    } finally {
      setIsSendingVerification(false);
    }
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await taskService.getDashboardStats();
        setStats(data);
      } catch (e) {
        // ignore
      }
    }
    loadStats();
  }, []);

  const formattedJoinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const themeOptions = [
    { id: 'light', label: 'Light Mode', desc: 'Clean and bright background', icon: Sun },
    { id: 'dark', label: 'Dark Mode', desc: 'High contrast dark palette', icon: Moon },
    { id: 'system', label: 'System Default', desc: 'Syncs with your operating system', icon: Laptop },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          User Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account credentials and workspace preferences.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-sky-400 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-primary-600/30">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name || 'User'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email || 'email@example.com'}</p>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-sm">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <Mail className="w-4 h-4 text-primary-500" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</p>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{user?.email || 'N/A'}</span>
                {user?.is_email_verified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-primary-500" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Member Since</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{formattedJoinDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Authentication</p>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">JWT Authenticated</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-primary-500" />
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Tasks Created</p>
              <p className="font-medium text-slate-800 dark:text-slate-200">{stats?.total_tasks ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Email Verification Banner if Unverified */}
        {!user?.is_email_verified && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Email verification required for deadline email reminders
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Verify your Gmail account to receive automatic notifications before tasks are due.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isSendingVerification || resendCooldown > 0}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
              >
                {isSendingVerification
                  ? 'Sending...'
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Resend Code'}
              </button>
              <a
                href={`/verify-email?email=${encodeURIComponent(user?.email || '')}`}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
              >
                Enter Code (OTP)
              </a>
            </div>
          </div>
        )}

        {/* Theme Preferences */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary-500" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Appearance & Theme</h4>
            <span className="text-xs text-slate-400">({isDark ? 'Dark Mode Active' : 'Light Mode Active'})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    active
                      ? 'bg-primary-50/80 dark:bg-primary-950/60 border-primary-500 ring-2 ring-primary-500/20 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
                    {active && <span className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />}
                  </div>
                  <h5 className={`text-xs font-bold ${active ? 'text-primary-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                    {opt.label}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Accent Color</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'tickthetask-lime', label: 'TickTheTask Lime', color: 'bg-[#84cc16]' },
              { id: 'ocean-blue', label: 'Ocean Blue', color: 'bg-indigo-500' },
              { id: 'emerald-green', label: 'Emerald Green', color: 'bg-emerald-500' },
              { id: 'sunset-orange', label: 'Sunset Orange', color: 'bg-orange-500' },
              { id: 'royal-purple', label: 'Royal Purple', color: 'bg-purple-500' },
            ].map((colorOpt) => {
              const active = colorTheme === colorOpt.id;
              return (
                <button
                  key={colorOpt.id}
                  type="button"
                  onClick={() => setColorTheme(colorOpt.id)}
                  className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                    active
                      ? 'bg-primary-50/80 dark:bg-primary-950/60 border-primary-500 ring-2 ring-primary-500/20'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${colorOpt.color} shadow-sm`} />
                  <span className={`text-xs font-semibold ${active ? 'text-primary-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {colorOpt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 text-sm font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
