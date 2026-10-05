import type { RegistrationStatus, TournamentStatus } from '../api/types';
import { humanize } from '../lib/format';

const COLORS: Record<TournamentStatus | RegistrationStatus, string> = {
  DRAFT: 'secondary',
  OPEN: 'success',
  IN_PROGRESS: 'primary',
  CLOSED: 'dark',
  CANCELLED: 'danger',
  CONFIRMED: 'success',
  WAITLISTED: 'warning',
};

export function StatusBadge({ status }: { status: TournamentStatus | RegistrationStatus }) {
  return <span className={`badge text-bg-${COLORS[status]}`}>{humanize(status)}</span>;
}
