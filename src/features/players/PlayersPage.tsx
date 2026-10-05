import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { playersApi } from '../../api/players';
import { ConfirmButton } from '../../components/ConfirmButton';
import { PageHeader } from '../../components/PageHeader';
import { Pager } from '../../components/Pager';
import { formatDateTime } from '../../lib/format';
import { pageQueryFrom } from '../../lib/forms';

export function loader({ request }: LoaderFunctionArgs) {
  return playersApi.list(pageQueryFrom(request.url), request.signal);
}

export default function PlayersPage() {
  const { content: players, page } = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Players">
        <Link className="btn btn-primary" to="new">
          New player
        </Link>
      </PageHeader>
      {players.length === 0 ? (
        <p className="text-body-secondary">No players yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{player.username}</td>
                  <td>{player.email}</td>
                  <td>{formatDateTime(player.createdAt)}</td>
                  <td className="text-end text-nowrap">
                    <Link className="btn btn-sm btn-outline-primary me-1" to={`${player.id}/edit`}>
                      Edit
                    </Link>
                    <ConfirmButton action={`${player.id}/delete`} label="Delete" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} />
    </>
  );
}
