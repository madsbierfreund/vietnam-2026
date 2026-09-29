import type { Status } from '@/lib/types';

// booket = grøn, valgt = amber, idé = grå.
export function StatusChip({ status }: { status: Status }) {
  return <span className={`chip chip-${status}`}>{status}</span>;
}
