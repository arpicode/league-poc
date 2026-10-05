import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from 'react-router';
import { boardGamesApi } from '../../api/boardGames';
import { fetchAll } from '../../api/client';
import { tournamentsApi } from '../../api/tournaments';
import { TOURNAMENT_STATUSES, type TournamentCreateRequest, type TournamentStatus } from '../../api/types';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { ProblemAlert } from '../../components/ProblemAlert';
import { fieldError, idParam, numberOrNull, text, textOrNull, toActionResult } from '../../lib/forms';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const [tournament, boardGames] = await Promise.all([
    params.id ? tournamentsApi.get(idParam(params.id), request.signal) : null,
    fetchAll((query) => boardGamesApi.list(query, request.signal)),
  ]);

  return { tournament, boardGames };
}

export async function action({ params, request }: ActionFunctionArgs) {
  const form = await request.formData();
  const body: TournamentCreateRequest = {
    boardGameId: numberOrNull(form, 'boardGameId'),
    name: text(form, 'name'),
    maxPlayers: numberOrNull(form, 'maxPlayers'),
    startsOn: textOrNull(form, 'startsOn'),
    endsOn: textOrNull(form, 'endsOn'),
  };

  let id: number;
  try {
    if (params.id) {
      // Status changes go through the detail page's transitions; the form keeps the current one.
      const status = text(form, 'status') as TournamentStatus;
      if (!TOURNAMENT_STATUSES.includes(status)) throw new Error(`Unknown status ${status}`);
      id = (await tournamentsApi.update(idParam(params.id), { ...body, status })).id;
    } else {
      id = (await tournamentsApi.create(body)).id;
    }
  } catch (error) {
    return toActionResult(error);
  }

  return redirect(`/tournaments/${id}`);
}

export default function TournamentFormPage() {
  const { tournament, boardGames } = useLoaderData<typeof loader>();
  const problem = useActionData<typeof action>()?.problem;
  const submitting = useNavigation().state === 'submitting';
  // Only a draft may change its board game: a disabled select is not submitted, so a hidden input carries it.
  const boardGameLocked = tournament !== null && tournament.status !== 'DRAFT';
  const cancelTo = tournament ? `/tournaments/${tournament.id}` : '/tournaments';

  return (
    <>
      <PageHeader title={tournament ? `Edit ${tournament.name}` : 'New tournament'} />
      <ProblemAlert problem={problem} />
      {boardGames.length === 0 && !tournament && (
        <div className="alert alert-info">
          A tournament needs a board game: <Link to="/boardgames/new">create one first</Link>.
        </div>
      )}
      <Form key={tournament?.id ?? 'new'} method="post" className="col-lg-6" noValidate>
        {tournament && <input type="hidden" name="status" value={tournament.status} />}
        {boardGameLocked && <input type="hidden" name="boardGameId" value={tournament.boardGame.id} />}
        <FormField
          label="Name"
          name="name"
          defaultValue={tournament?.name}
          required
          minLength={2}
          maxLength={150}
          error={fieldError(problem, 'name')}
        />
        <FormField label="Board game" name="boardGameId" error={fieldError(problem, 'boardGameId')}>
          {(controlProps) => (
            <select
              {...controlProps}
              name="boardGameId"
              defaultValue={tournament?.boardGame.id ?? ''}
              disabled={boardGameLocked}
              required
            >
              <option value="">Choose a board game…</option>
              {boardGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField
          label="Max players (empty for unlimited)"
          name="maxPlayers"
          type="number"
          min={2}
          defaultValue={tournament?.maxPlayers ?? undefined}
          error={fieldError(problem, 'maxPlayers')}
        />
        <div className="row">
          <FormField
            className="col-sm-6 mb-3"
            label="Starts on"
            name="startsOn"
            type="date"
            defaultValue={tournament?.startsOn ?? undefined}
            error={fieldError(problem, 'startsOn')}
          />
          <FormField
            className="col-sm-6 mb-3"
            label="Ends on"
            name="endsOn"
            type="date"
            defaultValue={tournament?.endsOn ?? undefined}
            error={fieldError(problem, 'endsOn')}
          />
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <Link className="btn btn-outline-secondary" to={cancelTo}>
            Cancel
          </Link>
        </div>
      </Form>
    </>
  );
}
