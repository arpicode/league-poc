import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { BoardGame, Player, Registration, Tournament } from '../../api/types';
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

const tournament = (overrides: Partial<Tournament> = {}): Tournament => ({
  id: 7,
  boardGame: { id: 1, name: 'Catan' },
  name: 'Autumn Cup',
  status: 'OPEN',
  maxPlayers: 2,
  startsOn: '2026-11-01',
  endsOn: '2026-11-02',
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
  ...overrides,
});

const player = (id: number, username: string): Player => ({
  id,
  username,
  email: `${username}@example.com`,
  createdAt: '2026-10-01T10:00:00Z',
  updatedAt: '2026-10-01T10:00:00Z',
});

const registration = (p: Player, status: Registration['status'], waitlistPosition: number | null = null) => ({
  tournamentId: 7,
  player: { id: p.id, username: p.username },
  registeredAt: '2026-10-02T10:00:00Z',
  status,
  waitlistPosition,
});

const alice = player(1, 'alice');
const bob = player(2, 'bob');
const carol = player(3, 'carol');

function detailHandlers(state: { tournament: Tournament; registrations: Registration[] }) {
  return [
    http.get(api('/tournaments/7'), () => HttpResponse.json(state.tournament)),
    http.get(api('/tournaments/7/registrations'), () => HttpResponse.json(page(state.registrations))),
    http.get(api('/players'), () => HttpResponse.json(page([alice, bob, carol]))),
  ];
}

describe('tournaments', () => {
  it('lists tournaments with their status', async () => {
    server.use(http.get(api('/tournaments'), () => HttpResponse.json(page([tournament()]))));

    renderRoute('/tournaments');

    const row = (await screen.findByRole('link', { name: 'Autumn Cup' })).closest('tr')!;
    expect(within(row).getByText('Catan')).toBeInTheDocument();
    expect(within(row).getByText('Open')).toBeInTheDocument();
  });

  it('creates a tournament and opens its page', async () => {
    let created: unknown;
    server.use(
      http.get(api('/boardgames'), () => HttpResponse.json(page([catan]))),
      http.post(api('/tournaments'), async ({ request }) => {
        created = await request.json();
        return HttpResponse.json(tournament({ status: 'DRAFT' }), { status: 201 });
      }),
      ...detailHandlers({ tournament: tournament({ status: 'DRAFT' }), registrations: [] }),
    );
    const { user, router } = renderRoute('/tournaments/new');

    await user.type(await screen.findByLabelText('Name'), 'Autumn Cup');
    await user.selectOptions(screen.getByLabelText('Board game'), 'Catan');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Registrations start once the tournament is open.')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/tournaments/7');
    expect(created).toEqual({
      boardGameId: 1,
      name: 'Autumn Cup',
      maxPlayers: null,
      startsOn: null,
      endsOn: null,
    });
  });

  it('locks the board game once the tournament left draft, but still submits it', async () => {
    let updated: unknown;
    server.use(
      http.get(api('/boardgames'), () => HttpResponse.json(page([catan]))),
      http.put(api('/tournaments/7'), async ({ request }) => {
        updated = await request.json();
        return HttpResponse.json(tournament());
      }),
      ...detailHandlers({ tournament: tournament(), registrations: [] }),
    );
    const { user } = renderRoute('/tournaments/7/edit');

    expect(await screen.findByLabelText('Board game')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByRole('heading', { name: 'Registrations' });
    expect(updated).toMatchObject({ boardGameId: 1, status: 'OPEN', name: 'Autumn Cup' });
  });

  it('shows the roster with the waitlist and registers a new player', async () => {
    const state = {
      tournament: tournament(),
      registrations: [registration(alice, 'CONFIRMED'), registration(bob, 'CONFIRMED')],
    };
    let registered: unknown;
    server.use(
      ...detailHandlers(state),
      http.post(api('/tournaments/7/registrations'), async ({ request }) => {
        registered = await request.json();
        state.registrations = [...state.registrations, registration(carol, 'WAITLISTED', 1)];
        return HttpResponse.json(state.registrations[2], { status: 201 });
      }),
    );
    const { user } = renderRoute('/tournaments/7');

    expect(await screen.findByText('2 confirmed / 2')).toBeInTheDocument();
    const select = screen.getByLabelText('Player');
    // Already registered players are not offered again.
    expect(within(select).queryByRole('option', { name: 'alice' })).not.toBeInTheDocument();

    await user.selectOptions(select, 'carol');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    const row = (await screen.findByRole('cell', { name: 'carol' })).closest('tr')!;
    expect(within(row).getByText('Waitlisted')).toBeInTheDocument();
    expect(within(row).getByText('#1')).toBeInTheDocument();
    expect(registered).toEqual({ playerId: 3 });
  });

  it('withdraws a player', async () => {
    const state = { tournament: tournament(), registrations: [registration(alice, 'CONFIRMED')] };
    server.use(
      ...detailHandlers(state),
      http.delete(api('/tournaments/7/registrations/1'), () => {
        state.registrations = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderRoute('/tournaments/7');

    const row = (await screen.findByRole('cell', { name: 'alice' })).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Withdraw' }));
    await user.click(within(row).getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('No registrations yet.')).toBeInTheDocument();
  });

  it('offers the legal transitions and sends the full tournament with the new status', async () => {
    const state = { tournament: tournament({ status: 'DRAFT' }), registrations: [] };
    let updated: unknown;
    server.use(
      ...detailHandlers(state),
      http.put(api('/tournaments/7'), async ({ request }) => {
        updated = await request.json();
        state.tournament = tournament({ status: 'OPEN' });
        return HttpResponse.json(state.tournament);
      }),
    );
    const { user } = renderRoute('/tournaments/7');

    await screen.findByRole('button', { name: 'Open registrations' });
    expect(screen.getByRole('button', { name: 'Cancel tournament' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start tournament' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open registrations' }));

    expect(await screen.findByRole('button', { name: 'Start tournament' })).toBeInTheDocument();
    expect(updated).toEqual({
      boardGameId: 1,
      name: 'Autumn Cup',
      maxPlayers: 2,
      startsOn: '2026-11-01',
      endsOn: '2026-11-02',
      status: 'OPEN',
    });
  });

  it('shows a refused transition as an alert', async () => {
    server.use(
      ...detailHandlers({ tournament: tournament(), registrations: [] }),
      http.put(api('/tournaments/7'), () =>
        HttpResponse.json(
          { status: 409, detail: 'Tournament cannot go from OPEN to IN_PROGRESS', errorId: 'e-1' },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderRoute('/tournaments/7');

    await user.click(await screen.findByRole('button', { name: 'Start tournament' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Tournament cannot go from OPEN to IN_PROGRESS');
    expect(alert).toHaveTextContent('Error id: e-1');
  });

  it('is read-only once closed', async () => {
    server.use(...detailHandlers({ tournament: tournament({ status: 'CLOSED' }), registrations: [] }));

    renderRoute('/tournaments/7');

    expect(await screen.findByText('Registrations are closed.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /tournament|registrations/i })).not.toBeInTheDocument();
  });
});
