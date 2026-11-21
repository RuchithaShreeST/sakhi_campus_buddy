import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import type { TrustLabel } from '@/types/database';
import { cn } from '../lib/cn';

const buttonStyles = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakhi-rose focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-sakhi-rose text-white hover:brightness-95',
        secondary: 'border border-sakhi-border bg-sakhi-surface text-sakhi-ink hover:bg-sakhi-lavender/30',
        ghost: 'text-sakhi-muted hover:bg-sakhi-lavender/30 hover:text-sakhi-ink',
      },
      size: {
        default: '',
        icon: 'h-11 w-11 px-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-sakhi border border-sakhi-border bg-sakhi-surface p-5 shadow-card', className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-sakhi-lavender/50 motion-reduce:animate-none', className)} />;
}

const trustLabels: Record<TrustLabel, string> = {
  official: 'Official',
  verified: 'Verified',
  community: 'Community',
  ai_assisted: 'AI-assisted',
};

export function TrustBadge({ trust }: { trust: TrustLabel }) {
  return <span className="inline-flex min-h-6 items-center rounded-full bg-sakhi-lavender/35 px-2.5 text-xs font-semibold text-sakhi-ink">{trustLabels[trust]}</span>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-sakhi-rose">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight text-sakhi-ink">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-sakhi-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-sakhi-border p-8 text-center">
    <p className="font-semibold text-sakhi-ink">{title}</p>
    <p className="mt-2 text-sm text-sakhi-muted">{description}</p>
  </div>;
}
