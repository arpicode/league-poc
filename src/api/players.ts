import { request, toQueryString } from './client';
import type { Page, PageQuery, Player, PlayerRequest } from './types';

const BASE = '/players';

export const playersApi = {
  list: (query?: PageQuery, signal?: AbortSignal) =>
    request<Page<Player>>(`${BASE}${toQueryString(query)}`, { signal }),
  get: (id: number, signal?: AbortSignal) => request<Player>(`${BASE}/${id}`, { signal }),
  create: (body: PlayerRequest) => request<Player>(BASE, { method: 'POST', body }),
  update: (id: number, body: PlayerRequest) => request<Player>(`${BASE}/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};
