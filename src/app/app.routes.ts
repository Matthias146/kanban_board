import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { AppShell } from './core/layout/app-shell/app-shell';
import { BoardPage } from './features/kanban/pages/board-page/board-page';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'board',
        pathMatch: 'full',
      },
      {
        path: 'board',
        component: BoardPage,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'board',
  },
];
