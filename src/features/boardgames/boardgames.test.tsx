import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { BoardGame } from '../../api/types';
import { server } from '../../test/server';
import { api, page, renderRoute } from '../../test/utils';

const catan: BoardGame = {
  id: 1,
  name: 'Catan',
  minPlayers: 3,
  maxPlayers: 4,
  avgDurationMin: 90,
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
};

describe('board games', () => {
  it('lists board games', async () => {
    server.use(http.get(api('/boardgames'), () => HttpResponse.json(page([catan]))));

    renderRoute('/boardgames');

    const row = (await screen.findByRole('cell', { name: 'Catan' })).closest('tr')!;
    expect(within(row).getByText('3–4')).toBeInTheDocument();
    expect(within(row).getByText('90 min')).toBeInTheDocument();
  });

  it('sends numbers, and null for an empty optional duration', async () => {
    let created: unknown;
    server.use(
      http.post(api('/boardgames'), async ({ request }) => {
        created = await request.json();
        return HttpResponse.json(catan, { status: 201 });
      }),
      http.get(api('/boardgames'), () => HttpResponse.json(page([catan]))),
    );
    const { user } = renderRoute('/boardgames/new');

    await user.type(await screen.findByLabelText('Name'), 'Azul');
    await user.type(screen.getByLabelText('Min players'), '2');
    await user.type(screen.getByLabelText('Max players'), '4');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByRole('heading', { name: 'Board games' });
    expect(created).toEqual({ name: 'Azul', minPlayers: 2, maxPlayers: 4, avgDurationMin: null });
  });

  it('explains why a game in use cannot be deleted', async () => {
    server.use(
      http.get(api('/boardgames'), () => HttpResponse.json(page([catan]))),
      http.delete(api('/boardgames/1'), () =>
        HttpResponse.json(
          { status: 409, detail: 'This board game is used by a tournament', code: 'BOARD_GAME_IN_USE' },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderRoute('/boardgames');

    const row = (await screen.findByRole('cell', { name: 'Catan' })).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    await user.click(within(row).getByRole('button', { name: 'Confirm' }));

    expect(await within(row).findByText('This board game is used by a tournament')).toBeInTheDocument();
  });
});
