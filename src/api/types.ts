// Mirrors the DTOs of league-api (feat/game-match-slice). Dates are ISO strings as sent on the wire:
// OffsetDateTime -> "2026-10-05T14:30:00.123+02:00", LocalDate -> "2026-10-05".

/** Spring Data `PagedModel` envelope. */
export interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string;
}

/** RFC 9457 problem detail, extended by the API with `code`, `errorId` and field `errors`. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  errorId?: string;
  errors?: FieldViolation[];
}

export interface FieldViolation {
  field: string;
  message: string;
}

// Players

export interface Player {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerRequest {
  username: string;
  email: string;
}

export interface PlayerSummary {
  id: number;
  username: string;
}

// Board games

export interface BoardGame {
  id: number;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  avgDurationMin: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardGameRequest {
  name: string;
  minPlayers: number | null;
  maxPlayers: number | null;
  avgDurationMin: number | null;
}

export interface BoardGameSummary {
  id: number;
  name: string;
}

// Tournaments

export const TOURNAMENT_STATUSES = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'CANCELLED'] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export interface Tournament {
  id: number;
  boardGame: BoardGameSummary;
  name: string;
  status: TournamentStatus;
  maxPlayers: number | null;
  startsOn: string | null;
  endsOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentCreateRequest {
  boardGameId: number | null;
  name: string;
  maxPlayers: number | null;
  startsOn: string | null;
  endsOn: string | null;
}

export interface TournamentUpdateRequest extends TournamentCreateRequest {
  status: TournamentStatus;
}

// Registrations

export type RegistrationStatus = 'CONFIRMED' | 'WAITLISTED';

export interface Registration {
  tournamentId: number;
  player: PlayerSummary;
  registeredAt: string;
  status: RegistrationStatus;
  /** 1-based, 1 being the next to be promoted; null when CONFIRMED. */
  waitlistPosition: number | null;
}

// Game matches: the entity exists in the API but no endpoint exposes it yet.

export type GameMatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
