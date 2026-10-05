import { redirect, type RouteObject } from 'react-router';
import { Layout } from './components/Layout';
import { RouteError } from './components/RouteError';
import BoardGameFormPage, * as boardGameForm from './features/boardgames/BoardGameFormPage';
import BoardGamesPage, * as boardGames from './features/boardgames/BoardGamesPage';
import * as deleteBoardGame from './features/boardgames/deleteBoardGame';
import * as deletePlayer from './features/players/deletePlayer';
import PlayerFormPage, * as playerForm from './features/players/PlayerFormPage';
import PlayersPage, * as players from './features/players/PlayersPage';
import * as deleteTournament from './features/tournaments/deleteTournament';
import TournamentDetailPage, * as tournamentDetail from './features/tournaments/TournamentDetailPage';
import TournamentFormPage, * as tournamentForm from './features/tournaments/TournamentFormPage';
import TournamentsPage, * as tournaments from './features/tournaments/TournamentsPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    // Rendered inside the layout's outlet by the pathless route below, so the navbar survives errors;
    // this one only catches a failure of the layout itself.
    errorElement: <RouteError />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          { index: true, loader: () => redirect('/tournaments') },
          {
            path: 'tournaments',
            children: [
              { index: true, element: <TournamentsPage />, loader: tournaments.loader },
              {
                path: 'new',
                element: <TournamentFormPage />,
                loader: tournamentForm.loader,
                action: tournamentForm.action,
              },
              {
                path: ':id',
                element: <TournamentDetailPage />,
                loader: tournamentDetail.loader,
                action: tournamentDetail.action,
              },
              {
                path: ':id/edit',
                element: <TournamentFormPage />,
                loader: tournamentForm.loader,
                action: tournamentForm.action,
              },
              { path: ':id/delete', action: deleteTournament.action },
            ],
          },
          {
            path: 'players',
            children: [
              { index: true, element: <PlayersPage />, loader: players.loader },
              {
                path: 'new',
                element: <PlayerFormPage />,
                loader: playerForm.loader,
                action: playerForm.action,
              },
              {
                path: ':id/edit',
                element: <PlayerFormPage />,
                loader: playerForm.loader,
                action: playerForm.action,
              },
              { path: ':id/delete', action: deletePlayer.action },
            ],
          },
          {
            path: 'boardgames',
            children: [
              { index: true, element: <BoardGamesPage />, loader: boardGames.loader },
              {
                path: 'new',
                element: <BoardGameFormPage />,
                loader: boardGameForm.loader,
                action: boardGameForm.action,
              },
              {
                path: ':id/edit',
                element: <BoardGameFormPage />,
                loader: boardGameForm.loader,
                action: boardGameForm.action,
              },
              { path: ':id/delete', action: deleteBoardGame.action },
            ],
          },
          {
            path: '*',
            loader: () => {
              throw new Response('Not found', { status: 404 });
            },
          },
        ],
      },
    ],
  },
];
