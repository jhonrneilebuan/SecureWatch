import { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'ghost' | 'danger';

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-primary text-slate-950 hover:bg-emerald-300',
        variant === 'ghost' && 'border border-slate-700 bg-slate-900/40 text-slate-200 hover:bg-slate-800',
        variant === 'danger' && 'bg-danger text-white hover:bg-red-500',
        className,
      )}
      {...props}
    />
  );
}
