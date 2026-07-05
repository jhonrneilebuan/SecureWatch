import { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'h-10 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-primary/80 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 shadow-inner shadow-black/30',
        props.className,
      )}
    />
  );
}
