import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { Player } from '../../api/types';
import { server } from '../../test/server';
import { api, page, renderRoute } from '../../test/utils';

const alice: Player = {
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
};

describe('players', () => {
  it('lists players and requests the page from the URL', async () => {
    let query = '';
    server.use(
      http.get(api('/players'), ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(page([alice], 1, 20, 21));
      }),
    );

    renderRoute('/players?page=2');

    expect(await screen.findByRole('cell', { name: 'alice' })).toBeInTheDocument();
    expect(query).toBe('?page=1&size=20');
    expect(screen.getByText('Page 2 of 2 · 21 total')).toBeInTheDocument();
  });

  it('creates a player and goes back to the list', async () => {
    let created: unknown;
    server.use(
      http.post(api('/players'), async ({ request }) => {
        created = await request.json();
        return HttpResponse.json({ ...alice, id: 2 }, { status: 201 });
      }),
      http.get(api('/players'), () => HttpResponse.json(page([alice]))),
    );
    const { user, router } = renderRoute('/players/new');

    await user.type(await screen.findByLabelText('Username'), ' bob ');
    await user.type(screen.getByLabelText('Email'), 'bob@example.com');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('heading', { name: 'Players' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/players');
    expect(created).toEqual({ username: 'bob', email: 'bob@example.com' });
  });

  it('shows validation errors next to their field', async () => {
    server.use(
      http.post(api('/players'), () =>
        HttpResponse.json(
          {
            status: 400,
            detail: 'Request validation failed',
            code: 'VALIDATION_ERROR',
            errors: [{ field: 'username', message: 'Username must be between 3 and 50 characters' }],
          },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderRoute('/players/new');

    await user.type(await screen.findByLabelText('Username'), 'ab');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Username must be between 3 and 50 characters')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveClass('is-invalid');
    expect(screen.getByRole('alert')).toHaveTextContent('Please correct the highlighted fields.');
  });

  it('prefills the edit form and updates the player', async () => {
    let updated: unknown;
    server.use(
      http.get(api('/players/1'), () => HttpResponse.json(alice)),
      http.put(api('/players/1'), async ({ request }) => {
        updated = await request.json();
        return HttpResponse.json(alice);
      }),
      http.get(api('/players'), () => HttpResponse.json(page([alice]))),
    );
    const { user } = renderRoute('/players/1/edit');

    const username = await screen.findByLabelText('Username');
    expect(username).toHaveValue('alice');
    await user.clear(username);
    await user.type(username, 'alicia');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByRole('heading', { name: 'Players' });
    expect(updated).toEqual({ username: 'alicia', email: 'alice@example.com' });
  });

  it('deletes after confirmation and refreshes the list', async () => {
    let players = [alice];
    server.use(
      http.get(api('/players'), () => HttpResponse.json(page(players))),
      http.delete(api('/players/1'), () => {
        players = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderRoute('/players');

    const row = (await screen.findByRole('cell', { name: 'alice' })).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    await user.click(within(row).getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('No players yet.')).toBeInTheDocument();
  });

  it('shows the not found page for an unknown player', async () => {
    server.use(
      http.get(api('/players/9'), () =>
        HttpResponse.json(
          { status: 404, detail: 'Player 9 not found', code: 'PLAYER_NOT_FOUND' },
          { status: 404 },
        ),
      ),
    );

    renderRoute('/players/9/edit');

    expect(await screen.findByRole('heading', { name: 'Not found' })).toBeInTheDocument();
    expect(screen.getByText('Player 9 not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Players' })).toBeInTheDocument();
  });

  it('shows the right record when going from one edit page to another', async () => {
    const bob: Player = { ...alice, id: 2, username: 'bob', email: 'bob@example.com' };
    server.use(
      http.get(api('/players/1'), () => HttpResponse.json(alice)),
      http.get(api('/players/2'), () => HttpResponse.json(bob)),
    );
    const { user, router } = renderRoute('/players/1/edit');

    await user.type(await screen.findByLabelText('Username'), '-changed');
    await router.navigate('/players/2/edit');

    expect(await screen.findByRole('heading', { name: 'Edit bob' })).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveValue('bob');
    expect(screen.getByLabelText('Email')).toHaveValue('bob@example.com');
  });

  it('moves back to the last page when its only item is deleted', async () => {
    let players = Array.from({ length: 21 }, (_, i) => ({ ...alice, id: i + 1, username: `player${i + 1}` }));
    server.use(
      http.get(api('/players'), ({ request }) => {
        const number = Number(new URL(request.url).searchParams.get('page'));
        return HttpResponse.json(
          page(players.slice(number * 20, number * 20 + 20), number, 20, players.length),
        );
      }),
      http.delete(api('/players/21'), () => {
        players = players.filter((player) => player.id !== 21);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user, router } = renderRoute('/players?page=2');

    const row = (await screen.findByRole('cell', { name: 'player21' })).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    await user.click(within(row).getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByRole('cell', { name: 'player20' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?page=1');
  });

  it('retries the failed URL, query included', async () => {
    let calls = 0;
    server.use(
      http.get(api('/players'), () =>
        ++calls === 1
          ? HttpResponse.json({ status: 500, detail: 'Database down' }, { status: 500 })
          : HttpResponse.json(page([alice], 1, 20, 21)),
      ),
    );
    const { user } = renderRoute('/players?page=2');

    const retry = await screen.findByRole('link', { name: 'Try again' });
    expect(retry).toHaveAttribute('href', '/players?page=2');
    await user.click(retry);

    expect(await screen.findByRole('cell', { name: 'alice' })).toBeInTheDocument();
  });
});
