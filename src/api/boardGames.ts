import { request, toQueryString } from './client';
import type { BoardGame, BoardGameRequest, Page, PageQuery } from './types';

const BASE = '/boardgames';

export const boardGamesApi = {
  list: (query?: PageQuery, signal?: AbortSignal) =>
    request<Page<BoardGame>>(`${BASE}${toQueryString(query)}`, { signal }),
  get: (id: number, signal?: AbortSignal) => request<BoardGame>(`${BASE}/${id}`, { signal }),
  create: (body: BoardGameRequest) => request<BoardGame>(BASE, { method: 'POST', body }),
  update: (id: number, body: BoardGameRequest) =>
    request<BoardGame>(`${BASE}/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
