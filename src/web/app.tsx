import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/app-shell';
import { ErrorBoundary } from './components/error-boundary';
import { HomePage } from './pages/home';
import { PlaceholderPage } from './pages/placeholder';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="wellbeing" element={<PlaceholderPage />} />
              <Route path="planner" element={<PlaceholderPage />} />
              <Route path="campus" element={<PlaceholderPage />} />
              <Route path="circle" element={<PlaceholderPage />} />
              <Route path="grow" element={<PlaceholderPage />} />
              <Route path="help" element={<PlaceholderPage />} />
              <Route path="*" element={<PlaceholderPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
