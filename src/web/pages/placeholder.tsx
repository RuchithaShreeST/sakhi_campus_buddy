import { useLocation } from 'react-router-dom';

import { Card, EmptyState, PageHeading } from '../components/ui';

const routeTitles: Record<string, { title: string; description: string }> = {
  '/wellbeing': { title: 'Wellbeing', description: 'Check in with yourself and explore gentle wellbeing tools.' },
  '/planner': { title: 'Planner', description: 'Make a little room for classes, focus, deadlines and rest.' },
  '/campus': { title: 'Campus', description: 'Explore demo announcements, clubs, events and placements.' },
  '/circle': { title: 'Circle', description: 'A thoughtful space for study buddies and community.' },
  '/grow': { title: 'Grow', description: 'Build confidence with study and placement preparation.' },
  '/help': { title: 'Talk to Sakhi', description: 'A warm, supportive companion for your next small step.' },
};

export function PlaceholderPage() {
  const { pathname } = useLocation();
  const page = routeTitles[pathname] ?? { title: 'Sakhi', description: 'Your campus, your wellbeing, your people.' };
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading eyebrow="A space for you" title={page.title} description={page.description} />
      <Card><EmptyState title={`${page.title} is taking shape`} description="The project foundation is ready. This area will be built in a later frontend step." /></Card>
    </div>
  );
}
