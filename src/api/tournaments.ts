import { request, toQueryString } from './client';
import type {
  Page,
  PageQuery,
  Registration,
  Tournament,
  TournamentCreateRequest,
  TournamentStatus,
  TournamentUpdateRequest,
} from './types';

const BASE = '/tournaments';

export const tournamentsApi = {
  list: (query?: PageQuery, signal?: AbortSignal) =>
    request<Page<Tournament>>(`${BASE}${toQueryString(query)}`, { signal }),
  get: (id: number, signal?: AbortSignal) => request<Tournament>(`${BASE}/${id}`, { signal }),
  create: (body: TournamentCreateRequest) => request<Tournament>(BASE, { method: 'POST', body }),
  update: (id: number, body: TournamentUpdateRequest) =>
    request<Tournament>(`${BASE}/${id}`, { method: 'PUT', body }),
  remove: (id: number) => request<void>(`${BASE}/${id}`, { method: 'DELETE' }),
};

export const registrationsApi = {
  list: (tournamentId: number, query?: PageQuery, signal?: AbortSignal) =>
    request<Page<Registration>>(`${BASE}/${tournamentId}/registrations${toQueryString(query)}`, { signal }),
  register: (tournamentId: number, playerId: number) =>
    request<Registration>(`${BASE}/${tournamentId}/registrations`, { method: 'POST', body: { playerId } }),
  withdraw: (tournamentId: number, playerId: number) =>
    request<void>(`${BASE}/${tournamentId}/registrations/${playerId}`, { method: 'DELETE' }),
};

/** Client-side mirror of TournamentStatus.canTransitionTo, minus the no-op self transitions. */
export const NEXT_STATUSES: Record<TournamentStatus, TournamentStatus[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

export const isTerminal = (status: TournamentStatus) => status === 'CLOSED' || status === 'CANCELLED';
