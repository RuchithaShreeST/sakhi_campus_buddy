import { CompanionState } from '@/types/wellness';
import { SakhiGirl } from './SakhiGirl';

export function Companion({ state, compact = false }: { state: CompanionState; compact?: boolean }) {
  return <SakhiGirl state={state} compact={compact} />;
}

