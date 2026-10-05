import type { Page, PageQuery, ProblemDetail } from './types';

export const API_BASE = '/api/v1';

/** Any non-2xx answer, or no answer at all, carried as a ProblemDetail so the UI handles one shape. */
export class ApiError extends Error {
  readonly problem: ProblemDetail;

  constructor(problem: ProblemDetail) {
    super(problem.detail ?? problem.title ?? `Request failed with status ${problem.status}`);
    this.name = 'ApiError';
    this.problem = problem;
  }

  get status(): number {
    return this.problem.status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

export async function request<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json, application/problem+json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', detail: 'The server could not be reached.' });
  }

  if (!response.ok) {
    throw new ApiError(await readProblem(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// A proxy in front of the API (Vite, nginx) answers with HTML or nothing when the API is down,
// so a body that is not a problem detail still has to become one.
async function readProblem(response: Response): Promise<ProblemDetail> {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('json')) {
    try {
      return { ...((await response.json()) as ProblemDetail), status: response.status };
    } catch {
      // fall through to the generic problem
    }
  }

  return {
    status: response.status,
    title: response.statusText,
    detail:
      response.status >= 500
        ? 'The server is unavailable or failed to answer.'
        : `Request failed (${response.status}).`,
  };
}

export function toQueryString({ page, size, sort }: PageQuery = {}): string {
  const params = new URLSearchParams();
  if (page !== undefined) params.set('page', String(page));
  if (size !== undefined) params.set('size', String(size));
  if (sort !== undefined) params.set('sort', sort);
  const query = params.toString();

  return query ? `?${query}` : '';
}

const FETCH_ALL_PAGE_SIZE = 1000;

/** Every item of a paginated listing, page after page: select inputs and roster counts need all of them. */
export async function fetchAll<T>(fetchPage: (query: PageQuery) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 0; ; page++) {
    const result = await fetchPage({ page, size: FETCH_ALL_PAGE_SIZE });
    items.push(...result.content);
    if (page + 1 >= result.page.totalPages) return items;
  }
}
