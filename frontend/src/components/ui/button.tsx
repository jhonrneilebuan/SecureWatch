import { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'ghost' | 'danger';

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        variant === 'primary' && 'bg-gradient-to-r from-primary to-emerald-500 text-slate-950 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:from-emerald-400 hover:to-teal-400',
        variant === 'ghost' && 'border border-slate-800 bg-slate-900/30 text-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-700',
        variant === 'danger' && 'bg-gradient-to-r from-danger to-red-600 text-white shadow-md shadow-danger/10 hover:shadow-lg hover:shadow-danger/20 hover:from-red-500 hover:to-rose-500',
        className,
      )}
      {...props}
    />
  );
}
