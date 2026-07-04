import { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-primary',
        props.className,
      )}
    />
  );
}
