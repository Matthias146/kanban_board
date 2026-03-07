import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AuthState, AuthUser } from './auth.models';
import { Router } from '@angular/router';
const AUTH_STORAGE_KEY = 'kanban-board.auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly state = signal<AuthState>(this.loadInitialState());
  private readonly router = inject(Router);
  readonly user = computed(() => this.state().user);
  readonly token = computed(() => this.state().token);
  readonly isAuthenticated = computed(() => !!this.state().token);

  constructor() {
    effect(() => {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.state()));
    });
  }

  login(email: string, _password: string): void {
    const demoUser: AuthUser = {
      id: crypto.randomUUID(),
      name: 'Matthias Hammelehle',
      email,
      _password,
    };

    this.state.set({
      token: 'demo-token',
      user: demoUser,
    });
  }

  logout(): void {
    this.state.set({
      token: null,
      user: null,
    });

    this.router.navigateByUrl('/login');
  }

  private loadInitialState(): AuthState {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedAuth) {
      return {
        token: null,
        user: null,
      };
    }

    try {
      return JSON.parse(storedAuth) as AuthState;
    } catch {
      return {
        token: null,
        user: null,
      };
    }
  }
}
