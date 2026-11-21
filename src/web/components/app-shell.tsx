import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BookOpenCheck,
  CalendarDays,
  CircleHelp,
  Compass,
  Heart,
  Home,
  Moon,
  Sun,
  UsersRound,
} from 'lucide-react';

import { OfflineBanner } from './offline-banner';
import { Button } from './ui';
import { cn } from '../lib/cn';
import { repositories } from '@/data/repositories';

const navigation = [
  { to: '/', label: 'Today', icon: Home, end: true },
  { to: '/wellbeing', label: 'Wellbeing', icon: Heart },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
  { to: '/campus', label: 'Campus', icon: Compass },
  { to: '/circle', label: 'Circle', icon: UsersRound },
  { to: '/grow', label: 'Grow', icon: BookOpenCheck },
  { to: '/help', label: 'Help', icon: CircleHelp },
];

export function AppShell() {
  const [theme, setTheme] = useState(repositories.preferences.getTheme);
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    repositories.preferences.setTheme(next);
    setTheme(next);
  };

  return (
    <div className={cn('min-h-screen bg-sakhi-background text-sakhi-ink', theme === 'dark' && 'dark')} data-theme={theme}>
      <OfflineBanner />
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sakhi-border bg-sakhi-surface px-5 py-6 lg:flex">
          <Brand />
          <nav aria-label="Main navigation" className="mt-9 flex flex-1 flex-col gap-1">
            {navigation.map((item) => <NavItem key={item.to} {...item} />)}
          </nav>
          <p className="mb-3 text-xs leading-5 text-sakhi-muted">A friendly campus space. Your wellbeing is yours.</p>
          <ThemeButton theme={theme} toggle={toggleTheme} />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-sakhi-border bg-sakhi-background/90 px-5 backdrop-blur md:px-8">
            <div className="lg:hidden"><Brand compact /></div>
            <div className="hidden text-sm font-medium text-sakhi-muted lg:block">Your campus, your pace.</div>
            <div className="ml-auto lg:ml-0"><ThemeButton theme={theme} toggle={toggleTheme} /></div>
          </header>
          <main className="px-4 pb-28 pt-7 sm:px-7 lg:px-10 lg:pb-10">
            <Outlet />
          </main>
        </div>
      </div>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-sakhi-border bg-sakhi-surface/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden">
        {navigation.slice(0, 5).map((item) => <NavItem key={item.to} {...item} mobile />)}
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sakhi-rose text-lg font-black text-white">S</div>
      <div>
        <p className="text-lg font-extrabold tracking-tight text-sakhi-ink">Sakhi</p>
        {!compact && <p className="text-xs text-sakhi-muted">campus, wellbeing & growth</p>}
      </div>
    </div>
  );
}

function NavItem({ to, label, icon: Icon, end, mobile = false }: {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
  mobile?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={mobile ? label : undefined}
      className={({ isActive }) => cn(
        'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakhi-rose',
        isActive ? 'bg-sakhi-lavender/40 text-sakhi-rose' : 'text-sakhi-muted hover:bg-sakhi-lavender/20 hover:text-sakhi-ink',
        mobile && 'min-h-[52px] flex-col justify-center gap-1 px-1 text-[10px]'
      )}
    >
      {({ isActive }) => <>
        <Icon size={19} aria-hidden="true" strokeWidth={isActive ? 2.5 : 2} />
        <span>{label}</span>
      </>}
    </NavLink>
  );
}

function ThemeButton({ theme, toggle }: { theme: string; toggle: () => void }) {
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Icon aria-hidden="true" size={18} />
    </Button>
  );
}
