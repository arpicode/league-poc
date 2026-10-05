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
import type { BoardGameRequest } from '../../api/types';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { ProblemAlert } from '../../components/ProblemAlert';
import { fieldError, idParam, numberOrNull, text, toActionResult } from '../../lib/forms';

export function loader({ params, request }: LoaderFunctionArgs) {
  return params.id ? boardGamesApi.get(idParam(params.id), request.signal) : null;
}

export async function action({ params, request }: ActionFunctionArgs) {
  const form = await request.formData();
  const body: BoardGameRequest = {
    name: text(form, 'name'),
    minPlayers: numberOrNull(form, 'minPlayers'),
    maxPlayers: numberOrNull(form, 'maxPlayers'),
    avgDurationMin: numberOrNull(form, 'avgDurationMin'),
  };

  try {
    if (params.id) {
      await boardGamesApi.update(idParam(params.id), body);
    } else {
      await boardGamesApi.create(body);
    }
  } catch (error) {
    return toActionResult(error);
  }

  return redirect('/boardgames');
}

export default function BoardGameFormPage() {
  const game = useLoaderData<typeof loader>();
  const problem = useActionData<typeof action>()?.problem;
  const submitting = useNavigation().state === 'submitting';

  return (
    <>
      <PageHeader title={game ? `Edit ${game.name}` : 'New board game'} />
      <ProblemAlert problem={problem} />
      <Form method="post" className="col-lg-6" noValidate>
        <FormField
          label="Name"
          name="name"
          defaultValue={game?.name}
          required
          minLength={2}
          maxLength={120}
          error={fieldError(problem, 'name')}
        />
        <div className="row">
          <FormField
            className="col-sm-4 mb-3"
            label="Min players"
            name="minPlayers"
            type="number"
            min={1}
            defaultValue={game?.minPlayers}
            required
            error={fieldError(problem, 'minPlayers')}
          />
          <FormField
            className="col-sm-4 mb-3"
            label="Max players"
            name="maxPlayers"
            type="number"
            min={1}
            defaultValue={game?.maxPlayers}
            required
            error={fieldError(problem, 'maxPlayers')}
          />
          <FormField
            className="col-sm-4 mb-3"
            label="Avg. duration (min)"
            name="avgDurationMin"
            type="number"
            min={1}
            defaultValue={game?.avgDurationMin ?? undefined}
            error={fieldError(problem, 'avgDurationMin')}
          />
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <Link className="btn btn-outline-secondary" to="/boardgames">
            Cancel
          </Link>
        </div>
      </Form>
    </>
  );
}
