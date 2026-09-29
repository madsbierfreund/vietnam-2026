import type { TransportKind } from '@/lib/types';

// Små streg-ikoner til tidslinjen. currentColor, så de følger teksten.
export function TransportIcon({ kind }: { kind: TransportKind }) {
  const faelles = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-label': kind,
    role: 'img',
  };
  switch (kind) {
    case 'fly':
      return (
        <svg {...faelles}>
          <path d="M2 16l20-7-2-2-7 3-5-6-2 1 3 7-5 2-2-1-1 1 3 3z" />
        </svg>
      );
    case 'bil':
      return (
        <svg {...faelles}>
          <path d="M5 16h14v-4l-2-5H7l-2 5z" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      );
    case 'båd':
      return (
        <svg {...faelles}>
          <path d="M3 16l2 4h14l2-4z" />
          <path d="M12 3v13M12 5l6 8h-6" />
        </svg>
      );
    default:
      return (
        <svg {...faelles}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}
