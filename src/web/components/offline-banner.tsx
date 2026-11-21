import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

import { getLocalSimulationMode } from '@/data/adapters/local';
import { dataMode } from '@/data/repositories';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(getLocalSimulationMode().offline);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-100">
      <WifiOff aria-hidden="true" size={16} />
      <span>{dataMode === 'local' ? 'You’re offline. Your local demo data is still available.' : 'You’re offline. Some requests may not load until you reconnect.'}</span>
    </div>
  );
}
