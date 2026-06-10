import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/start-page/start-page').then((m) => m.StartPage),
  },
  {
    path: 'game',
    loadComponent: () => import('../pages/game-page/game-page').then((m) => m.GamePage),
  },
  {
    path: 'results',
    loadComponent: () => import('../pages/results-page/results-page').then((m) => m.ResultsPage),
  },
  {
    path: 'lobby',
    loadComponent: () => import('../pages/game-lobby/game-lobby.page').then((m) => m.GameLobbyPage),
  },
];
