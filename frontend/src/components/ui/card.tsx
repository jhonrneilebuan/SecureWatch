import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-800/60 bg-slate-950/50 backdrop-blur-md p-5 sm:p-6 shadow-lg shadow-black/20 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300',
        className
      )}
      {...props}
    />
  );
}
