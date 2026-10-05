import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { fetchAll } from '../../api/client';
import { playersApi } from '../../api/players';
import { isTerminal, NEXT_STATUSES, registrationsApi, tournamentsApi } from '../../api/tournaments';
import { TOURNAMENT_STATUSES, type TournamentStatus } from '../../api/types';
import { ConfirmButton } from '../../components/ConfirmButton';
import { PageHeader } from '../../components/PageHeader';
import { ProblemAlert } from '../../components/ProblemAlert';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate, formatDateTime } from '../../lib/format';
import { idParam, numberOrNull, text, toActionResult } from '../../lib/forms';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const id = idParam(params.id);
  const { signal } = request;
  // The whole roster is loaded: the confirmed count and the "already registered" filter need all of it.
  const [tournament, registrations, players] = await Promise.all([
    tournamentsApi.get(id, signal),
    fetchAll((query) => registrationsApi.list(id, query, signal)),
    fetchAll((query) => playersApi.list(query, signal)),
  ]);

  return { tournament, registrations, players };
}

const TRANSITION_LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'Back to draft',
  OPEN: 'Open registrations',
  IN_PROGRESS: 'Start tournament',
  CLOSED: 'Close tournament',
  CANCELLED: 'Cancel tournament',
};

export async function action({ params, request }: ActionFunctionArgs) {
  const id = idParam(params.id);
  const form = await request.formData();
  const intent = text(form, 'intent');

  try {
    switch (intent) {
      case 'transition': {
        const status = text(form, 'status') as TournamentStatus;
        if (!TOURNAMENT_STATUSES.includes(status)) throw new Error(`Unknown status ${status}`);
        // PUT replaces the whole tournament: start from the current state rather than the possibly stale page.
        const current = await tournamentsApi.get(id);
        await tournamentsApi.update(id, {
          boardGameId: current.boardGame.id,
          name: current.name,
          maxPlayers: current.maxPlayers,
          startsOn: current.startsOn,
          endsOn: current.endsOn,
          status,
        });
        break;
      }
      case 'register': {
        const playerId = numberOrNull(form, 'playerId');
        if (playerId === null) {
          return { problem: { status: 400, detail: 'Choose a player to register.' } };
        }
        await registrationsApi.register(id, playerId);
        break;
      }
      case 'withdraw':
        await registrationsApi.withdraw(id, Number(text(form, 'playerId')));
        break;
      default:
        throw new Error(`Unknown intent ${intent}`);
    }
  } catch (error) {
    return toActionResult(error);
  }

  return null;
}

export default function TournamentDetailPage() {
  const { tournament, registrations, players } = useLoaderData<typeof loader>();
  const problem = useActionData<typeof action>()?.problem;
  const busy = useNavigation().state !== 'idle';

  const open = tournament.status === 'OPEN';
  const confirmed = registrations.filter((registration) => registration.status === 'CONFIRMED').length;
  const registeredIds = new Set(registrations.map((registration) => registration.player.id));
  const available = players.filter((player) => !registeredIds.has(player.id));

  return (
    <>
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/tournaments">Tournaments</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {tournament.name}
          </li>
        </ol>
      </nav>
      <PageHeader
        title={
          <>
            {tournament.name} <StatusBadge status={tournament.status} />
          </>
        }
      >
        {!isTerminal(tournament.status) && (
          <Link className="btn btn-outline-primary" to="edit">
            Edit
          </Link>
        )}
        {tournament.status === 'DRAFT' && <ConfirmButton action="delete" label="Delete" />}
      </PageHeader>

      <ProblemAlert problem={problem} />

      <div className="card mb-4">
        <div className="card-body">
          <dl className="row mb-0">
            <dt className="col-sm-3">Board game</dt>
            <dd className="col-sm-9">{tournament.boardGame.name}</dd>
            <dt className="col-sm-3">Players</dt>
            <dd className="col-sm-9">
              {confirmed} confirmed / {tournament.maxPlayers ?? 'unlimited'}
            </dd>
            <dt className="col-sm-3">Dates</dt>
            <dd className="col-sm-9">
              {formatDate(tournament.startsOn)} → {formatDate(tournament.endsOn)}
            </dd>
          </dl>
        </div>
        {NEXT_STATUSES[tournament.status].length > 0 && (
          <div className="card-footer d-flex flex-wrap gap-2">
            {NEXT_STATUSES[tournament.status].map((status) => (
              <Form method="post" key={status}>
                <input type="hidden" name="intent" value="transition" />
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  className={`btn btn-sm ${status === 'CANCELLED' ? 'btn-outline-danger' : 'btn-primary'}`}
                  disabled={busy}
                >
                  {TRANSITION_LABELS[status]}
                </button>
              </Form>
            ))}
          </div>
        )}
      </div>

      <h2 className="h4">Registrations</h2>
      {open && (
        <Form method="post" className="row g-2 align-items-end mb-3">
          <input type="hidden" name="intent" value="register" />
          <div className="col-sm-6 col-md-4">
            <label htmlFor="playerId" className="form-label">
              Player
            </label>
            <select id="playerId" name="playerId" className="form-select" defaultValue="">
              <option value="">Choose a player…</option>
              {available.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.username}
                </option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              Register
            </button>
          </div>
        </Form>
      )}
      {!open && (
        <p className="text-body-secondary small">
          {tournament.status === 'DRAFT'
            ? 'Registrations start once the tournament is open.'
            : 'Registrations are closed.'}
        </p>
      )}

      {registrations.length === 0 ? (
        <p className="text-body-secondary">No registrations yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Status</th>
                <th>Registered</th>
                {open && <th />}
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr key={registration.player.id}>
                  <td>{registration.player.username}</td>
                  <td>
                    <StatusBadge status={registration.status} />
                    {registration.waitlistPosition !== null && (
                      <span className="ms-2 small text-body-secondary">#{registration.waitlistPosition}</span>
                    )}
                  </td>
                  <td>{formatDateTime(registration.registeredAt)}</td>
                  {open && (
                    <td className="text-end">
                      <ConfirmButton
                        label="Withdraw"
                        fields={{ intent: 'withdraw', playerId: String(registration.player.id) }}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
