import { ApiError } from '../api/client';
import type { PageQuery, ProblemDetail } from '../api/types';

/** Trimmed text field; empty becomes null so the API applies its own "blank" rules. */
export function textOrNull(form: FormData, name: string): string | null {
  const value = form.get(name);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();

  return trimmed === '' ? null : trimmed;
}

export function text(form: FormData, name: string): string {
  return textOrNull(form, name) ?? '';
}

/** Number field; empty or not a number becomes null, the API answers with a field error if it was required. */
export function numberOrNull(form: FormData, name: string): number | null {
  const value = textOrNull(form, name);
  if (value === null) return null;
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/** Result an action hands to its form through useActionData. */
export interface ActionResult {
  problem: ProblemDetail;
}

/**
 * Validation (400) and business-rule (409) failures belong to the form that caused them, so they are
 * returned as action data. Anything else (404, 5xx, network) goes to the route's error boundary.
 */
export function toActionResult(error: unknown): ActionResult {
  if (error instanceof ApiError && (error.status === 400 || error.status === 409)) {
    return { problem: error.problem };
  }
  throw error;
}

export function fieldError(problem: ProblemDetail | undefined, field: string): string | undefined {
  return problem?.errors
    ?.filter((violation) => violation.field === field)
    .map((violation) => violation.message)
    .join(' ');
}

export function idParam(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError({ status: 404, code: 'NOT_FOUND', detail: 'This page does not exist.' });
  }

  return id;
}

export const DEFAULT_PAGE_SIZE = 20;

/** Pagination comes from the URL (`?page=` 1-based for humans) so pages are linkable and survive reloads. */
export function pageQueryFrom(url: URL | string, size = DEFAULT_PAGE_SIZE): PageQuery {
  const params = new URL(url).searchParams;
  const page = Number(params.get('page') ?? '1');

  return { page: Number.isInteger(page) && page > 0 ? page - 1 : 0, size };
}

// Select inputs need every option, not one page. Spring's default max page size is 2000.
export const ALL = { size: 1000 } satisfies PageQuery;
