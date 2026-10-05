import { useState } from 'react';
import { useFetcher } from 'react-router';
import type { ActionResult } from '../lib/forms';

interface Props {
  /** Route action to post to; defaults to the current route's. */
  action?: string;
  fields?: Record<string, string>;
  label: string;
  confirmLabel?: string;
}

/** A destructive button that asks for a second click, then posts through a fetcher and shows its error inline. */
export function ConfirmButton({ action, fields = {}, label, confirmLabel = 'Confirm' }: Props) {
  const fetcher = useFetcher<ActionResult | null>();
  const [confirming, setConfirming] = useState(false);
  const busy = fetcher.state !== 'idle';
  const problem = fetcher.data?.problem;

  if (!confirming) {
    return (
      <span className="d-inline-flex flex-column align-items-end">
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setConfirming(true)}>
          {label}
        </button>
        {problem && <small className="text-danger">{problem.detail}</small>}
      </span>
    );
  }

  return (
    <fetcher.Form
      method="post"
      action={action}
      className="d-inline-flex gap-1"
      onSubmit={() => setConfirming(false)}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className="btn btn-sm btn-danger" disabled={busy}>
        {confirmLabel}
      </button>
      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </fetcher.Form>
  );
}
