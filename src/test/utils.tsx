import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '../routes';

/** Renders the real route tree (loaders and actions included) at `path`, against MSW. */
export function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const user = userEvent.setup();

  return { router, user, ...render(<RouterProvider router={router} />) };
}

/** jsdom resolves fetch('/api/...') against this origin; MSW handlers use the same absolute URLs. */
export const api = (path: string) => `${window.location.origin}/api/v1${path}`;

export function page<T>(content: T[], number = 0, size = 20, totalElements = content.length) {
  return {
    content,
    page: { size, number, totalElements, totalPages: Math.max(1, Math.ceil(totalElements / size)) },
  };
}
