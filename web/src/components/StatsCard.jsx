import React from 'react';

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'primary', // primary, emerald, amber, rose, sky
}) {
  const schemes = {
    primary: {
      bg: 'bg-primary-50 dark:bg-primary-950/40',
      border: 'border-primary-100 dark:border-primary-800/40',
      iconBg: 'bg-primary-600/10 text-primary-700 dark:text-primary-400',
      text: 'text-primary-700 dark:text-primary-400',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-100 dark:border-emerald-800/40',
      iconBg: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-800/40',
      iconBg: 'bg-amber-600/10 text-amber-700 dark:text-amber-400',
      text: 'text-amber-700 dark:text-amber-400',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-100 dark:border-rose-800/40',
      iconBg: 'bg-rose-600/10 text-rose-700 dark:text-rose-400',
      text: 'text-rose-700 dark:text-rose-400',
    },
    sky: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      border: 'border-sky-100 dark:border-sky-800/40',
      iconBg: 'bg-sky-600/10 text-sky-700 dark:text-sky-400',
      text: 'text-sky-700 dark:text-sky-400',
    },
  };

  const scheme = schemes[colorScheme] || schemes.primary;

  return (
    <div
      className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {value ?? 0}
          </h4>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.iconBg} flex-shrink-0`} aria-hidden="true">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
