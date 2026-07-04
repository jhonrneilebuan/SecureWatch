import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-lg border border-slate-800 bg-slate-950/70 p-5 shadow-xl shadow-black/20', className)} {...props} />;
}
