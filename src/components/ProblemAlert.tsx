import type { ProblemDetail } from '../api/types';

interface Props {
  problem: ProblemDetail | undefined;
  /** Field errors are shown next to their input when the form knows the field. */
  showFieldErrors?: boolean;
}

export function ProblemAlert({ problem, showFieldErrors = false }: Props) {
  if (!problem) return null;

  return (
    <div className="alert alert-danger" role="alert">
      <div>{problem.detail ?? problem.title ?? 'Something went wrong.'}</div>
      {showFieldErrors && problem.errors && problem.errors.length > 0 && (
        <ul className="mb-0 mt-2">
          {problem.errors.map((violation) => (
            <li key={`${violation.field}-${violation.message}`}>{violation.message}</li>
          ))}
        </ul>
      )}
      {problem.errorId && <div className="small text-body-secondary mt-1">Error id: {problem.errorId}</div>}
    </div>
  );
}
