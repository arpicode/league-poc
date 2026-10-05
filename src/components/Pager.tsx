import { Link, useLocation } from 'react-router';
import type { Page } from '../api/types';

/** Previous/next links that keep the other query params; the URL's `page` is 1-based. */
export function Pager({ page }: { page: Page<unknown>['page'] }) {
  const location = useLocation();
  if (page.totalPages <= 1) return null;

  const current = page.number + 1;
  const hrefFor = (target: number) => {
    const params = new URLSearchParams(location.search);
    params.set('page', String(target));

    return `?${params.toString()}`;
  };

  return (
    <nav aria-label="Pagination" className="d-flex align-items-center gap-3">
      <ul className="pagination mb-0">
        <li className={`page-item${current <= 1 ? ' disabled' : ''}`}>
          <Link className="page-link" to={hrefFor(current - 1)} aria-disabled={current <= 1}>
            Previous
          </Link>
        </li>
        <li className={`page-item${current >= page.totalPages ? ' disabled' : ''}`}>
          <Link className="page-link" to={hrefFor(current + 1)} aria-disabled={current >= page.totalPages}>
            Next
          </Link>
        </li>
      </ul>
      <span className="text-body-secondary small">
        Page {current} of {page.totalPages} · {page.totalElements} total
      </span>
    </nav>
  );
}
