import { isRouteErrorResponse, Link, useLocation, useRouteError } from 'react-router';
import { ApiError } from '../api/client';
import { ProblemAlert } from './ProblemAlert';

export function RouteError() {
  const error = useRouteError();
  const location = useLocation();

  if (
    (error instanceof ApiError && error.status === 404) ||
    (isRouteErrorResponse(error) && error.status === 404)
  ) {
    return (
      <div className="py-4">
        <h1 className="h3">Not found</h1>
        <p>{error instanceof ApiError ? error.message : 'This page does not exist.'}</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }

  const problem =
    error instanceof ApiError
      ? error.problem
      : { status: 500, detail: error instanceof Error ? error.message : 'Unexpected error.' };

  return (
    <div className="py-4">
      <h1 className="h3">Something went wrong</h1>
      <ProblemAlert problem={problem} />
      {/* The boundary sits on a pathless route, so "." would resolve to "/": retry the failed URL itself. */}
      <Link to={location} replace>
        Try again
      </Link>
    </div>
  );
}
