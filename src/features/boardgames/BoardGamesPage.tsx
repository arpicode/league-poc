import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { boardGamesApi } from '../../api/boardGames';
import { ConfirmButton } from '../../components/ConfirmButton';
import { PageHeader } from '../../components/PageHeader';
import { Pager } from '../../components/Pager';
import { pageQueryFrom } from '../../lib/forms';

export function loader({ request }: LoaderFunctionArgs) {
  return boardGamesApi.list(pageQueryFrom(request.url), request.signal);
}

export default function BoardGamesPage() {
  const { content: boardGames, page } = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader title="Board games">
        <Link className="btn btn-primary" to="new">
          New board game
        </Link>
      </PageHeader>
      {boardGames.length === 0 ? (
        <p className="text-body-secondary">No board games yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Players</th>
                <th>Average duration</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {boardGames.map((game) => (
                <tr key={game.id}>
                  <td>{game.name}</td>
                  <td>
                    {game.minPlayers === game.maxPlayers
                      ? game.minPlayers
                      : `${game.minPlayers}–${game.maxPlayers}`}
                  </td>
                  <td>{game.avgDurationMin ? `${game.avgDurationMin} min` : '—'}</td>
                  <td className="text-end text-nowrap">
                    <Link className="btn btn-sm btn-outline-primary me-1" to={`${game.id}/edit`}>
                      Edit
                    </Link>
                    <ConfirmButton action={`${game.id}/delete`} label="Delete" />
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
