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
import { playersApi } from '../../api/players';
import type { PlayerRequest } from '../../api/types';
import { FormField } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { ProblemAlert } from '../../components/ProblemAlert';
import { fieldError, idParam, text, toActionResult } from '../../lib/forms';

export function loader({ params, request }: LoaderFunctionArgs) {
  return params.id ? playersApi.get(idParam(params.id), request.signal) : null;
}

export async function action({ params, request }: ActionFunctionArgs) {
  const form = await request.formData();
  const body: PlayerRequest = { username: text(form, 'username'), email: text(form, 'email') };

  try {
    if (params.id) {
      await playersApi.update(idParam(params.id), body);
    } else {
      await playersApi.create(body);
    }
  } catch (error) {
    return toActionResult(error);
  }

  return redirect('/players');
}

export default function PlayerFormPage() {
  const player = useLoaderData<typeof loader>();
  const problem = useActionData<typeof action>()?.problem;
  const submitting = useNavigation().state === 'submitting';

  return (
    <>
      <PageHeader title={player ? `Edit ${player.username}` : 'New player'} />
      <ProblemAlert problem={problem} />
      {/* Keyed by record: going from one edit URL to another must not keep the previous record's inputs. */}
      <Form key={player?.id ?? 'new'} method="post" className="col-lg-6" noValidate>
        <FormField
          label="Username"
          name="username"
          defaultValue={player?.username}
          required
          minLength={3}
          maxLength={50}
          error={fieldError(problem, 'username')}
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          defaultValue={player?.email}
          required
          maxLength={255}
          error={fieldError(problem, 'email')}
        />
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <Link className="btn btn-outline-secondary" to="/players">
            Cancel
          </Link>
        </div>
      </Form>
    </>
  );
}
