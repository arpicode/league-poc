import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { tournamentsApi } from '../../api/tournaments';
import { PageHeader } from '../../components/PageHeader';
import { Pager } from '../../components/Pager';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../lib/format';
import { pageQueryFrom } from '../../lib/forms';

export function loader({ request }: LoaderFunctionArgs) {
  return tournamentsApi.list(pageQueryFrom(request.url), request.signal);
}

export default function TournamentsPage() {
  const { content: tournaments, page } = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Tournaments">
        <Link className="btn btn-primary" to="new">
          New tournament
        </Link>
      </PageHeader>
      {tournaments.length === 0 ? (
        <p className="text-body-secondary">No tournaments yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Board game</th>
                <th>Status</th>
                <th>Max players</th>
                <th>Dates</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((tournament) => (
                <tr key={tournament.id}>
                  <td>
                    <Link to={String(tournament.id)}>{tournament.name}</Link>
                  </td>
                  <td>{tournament.boardGame.name}</td>
                  <td>
                    <StatusBadge status={tournament.status} />
                  </td>
                  <td>{tournament.maxPlayers ?? 'Unlimited'}</td>
                  <td>
                    {formatDate(tournament.startsOn)}
                    {tournament.endsOn && ` → ${formatDate(tournament.endsOn)}`}
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
