import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Lock, Mail, AlertCircle, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login(formData.email, formData.password);
    setIsSubmitting(false);

    if (result.success) {
      showToast(`Welcome back, ${result.user?.name || 'User'}!`, 'success');
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.error);
    }
  };



  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          aria-label="TickTheTask Home"
          className="inline-flex items-center gap-2.5 mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-2xl"
        >
          <img src="/logo.jpg" alt="TickTheTask Logo" className="w-12 h-12 rounded-2xl object-cover bg-white shadow-xl shadow-primary-500/30" />
          <span className="text-2xl font-black tracking-tight text-white">TickTheTask</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to access your dashboard and tasks
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-700/60">
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/50 flex items-start gap-3 text-rose-200 text-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  required
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-900/90 border rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 text-white placeholder-slate-500 transition-all ${
                    errors.email
                      ? 'border-rose-500 focus:border-rose-500 focus-visible:ring-rose-500/30'
                      : 'border-slate-700 focus:border-primary-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p id="login-email-error" role="alert" className="flex items-center gap-1 mt-1.5 text-xs text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  aria-required="true"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 text-sm bg-slate-900/90 border rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 text-white placeholder-slate-500 transition-all ${
                    errors.password
                      ? 'border-rose-500 focus:border-rose-500 focus-visible:ring-rose-500/30'
                      : 'border-slate-700 focus:border-primary-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" role="alert" className="flex items-center gap-1 mt-1.5 text-xs text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 active:scale-95 shadow-lg shadow-primary-600/30 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                'Sign in to TickTheTask'
              )}
            </button>
          </form>



          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
