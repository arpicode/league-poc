const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const date = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTime.format(new Date(value)) : '—';
}

/** LocalDate ("2026-10-05") has no zone: format it in UTC so it never shifts by a day. */
export function formatDate(value: string | null | undefined): string {
  return value ? date.format(new Date(`${value}T00:00:00Z`)) : '—';
}

export function humanize(value: string): string {
  const words = value.toLowerCase().replaceAll('_', ' ');

  return words.charAt(0).toUpperCase() + words.slice(1);
}
