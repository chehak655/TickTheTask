import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, fetchCurrentUser } = useAuth();
  const { showToast } = useToast();

  const emailParam = searchParams.get('email') || user?.email || '';
  const [email, setEmail] = useState(emailParam);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [status, setStatus] = useState('idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Synchronize email when auth or searchParams change
  useEffect(() => {
    if (emailParam && !email) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, []);

  // Countdown timer for resend cooldown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const char = cleanVal.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    if (char && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    const fullOtp = newDigits.join('');
    if (fullOtp.length === 4 && newDigits.every((d) => d !== '')) {
      submitOtp(email, fullOtp);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasteData) return;

    const digits = pasteData.slice(0, 4).split('');
    const newDigits = ['', '', '', ''];
    digits.forEach((d, i) => {
      newDigits[i] = d;
    });
    setOtpDigits(newDigits);

    const focusIdx = Math.min(digits.length, 3);
    inputRefs[focusIdx].current?.focus();

    if (digits.length === 4) {
      submitOtp(email, digits.join(''));
    }
  };

  const submitOtp = async (targetEmail, code) => {
    if (!targetEmail || !targetEmail.trim()) {
      setStatus('error');
      setMessage('Please provide your registered email address.');
      return;
    }
    if (!code || code.length !== 4) {
      setStatus('error');
      setMessage('Please enter all 4 digits of your verification code.');
      return;
    }

    try {
      setStatus('verifying');
      setMessage('');
      const data = await authService.verifyEmailOtp({
        email: targetEmail.trim(),
        otp: code,
      });

      setStatus('success');
      setMessage(data.message || 'Your email has been verified successfully!');
      showToast('Email verified successfully!', 'success');
      if (fetchCurrentUser) {
        await fetchCurrentUser();
      }
    } catch (err) {
      setStatus('error');
      const errDetail = err.response?.data?.detail || 'Invalid or expired verification code.';
      setMessage(errDetail);
    }
  };

  const handleResend = async () => {
    if (!email || !email.trim()) {
      showToast('Please enter your email address first.', 'error');
      return;
    }
    if (resendCooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      const data = await authService.resendVerificationOtp(email.trim());
      showToast(data.message || 'Verification code sent to your email.', 'success');
      setResendCooldown(data.cooldown_seconds || 60);
      setOtpDigits(['', '', '', '']);
      setStatus('idle');
      setMessage('');
      if (inputRefs[0].current) {
        inputRefs[0].current.focus();
      }
    } catch (err) {
      const errDetail = err.response?.data?.detail || 'Failed to resend verification code.';
      showToast(errDetail, 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6 animate-in zoom-in-95">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mx-auto shadow-inner">
          <KeyRound className="w-7 h-7 stroke-[2]" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Enter Verification Code
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            We sent a 4-digit code to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {email || 'your registered Gmail address'}
            </strong>
            . Enter the code below to verify your account.
          </p>
        </div>

        {status === 'success' ? (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Verified Successfully!
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
              {message}
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Email input field if not pre-populated */}
            {!emailParam && (
              <div className="text-left space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Error Notification Banner */}
            {status === 'error' && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-left space-y-1 animate-in fade-in-50"
              >
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Verification Failed</span>
                </div>
                <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed pl-6">
                  {message}
                </p>
              </div>
            )}

            {/* 4-Digit OTP Boxes */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitOtp(email, otpDigits.join(''));
              }}
              className="space-y-6 pt-2"
            >
              <div className="flex justify-center gap-3 sm:gap-4" onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={status === 'verifying'}
                    aria-label={`Digit ${idx + 1}`}
                    className={`w-14 h-16 sm:w-16 sm:h-20 text-center text-2xl sm:text-3xl font-extrabold font-mono rounded-2xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white focus:outline-none transition-all duration-150 ${
                      digit
                        ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                        : 'border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
                    }`}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={status === 'verifying' || otpDigits.some((d) => d === '')}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
              >
                {status === 'verifying' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>

            {/* Resend OTP Section */}
            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-primary-600 dark:text-primary-400 font-semibold hover:underline disabled:opacity-50 disabled:no-underline ml-1"
                >
                  {isResending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
                </button>
              </p>
            </div>
          </>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <Link
            to="/dashboard"
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
          >
            Back to Dashboard
          </Link>
          <Link
            to="/profile"
            className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
          >
            Profile Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
