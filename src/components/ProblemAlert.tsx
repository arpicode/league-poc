import type { ProblemDetail } from '../api/types';

/** Shows a problem's message and its errorId, which matches a log line on the API side. */
export function ProblemAlert({ problem }: { problem: ProblemDetail | undefined }) {
  if (!problem) return null;

  // The API's validation detail addresses developers ("see 'errors'"); the messages themselves sit under each field.
  const message =
    problem.code === 'VALIDATION_ERROR'
      ? 'Please correct the highlighted fields.'
      : (problem.detail ?? problem.title ?? 'Something went wrong.');

  return (
    <div className="alert alert-danger" role="alert">
      <div>{message}</div>
      {problem.errorId && <div className="small text-body-secondary mt-1">Error id: {problem.errorId}</div>}
    </div>
  );
}
