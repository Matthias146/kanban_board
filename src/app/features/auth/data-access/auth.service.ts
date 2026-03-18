import { computed, Injectable, signal } from '@angular/core';
import { AuthUser } from '../models/auth.models';
import { auth } from '../../../core/firebase/firebase.client';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly firebaseAuth = auth;

  private readonly currentUserSignal = signal<AuthUser | null>(null);
  private readonly isLoadingSignal = signal(true);

  readonly user = computed(() => this.currentUserSignal());
  readonly isLoading = computed(() => this.isLoadingSignal());
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly isGuest = computed(() => this.currentUserSignal()?.isAnonymous ?? false);

  constructor() {
    onAuthStateChanged(this.firebaseAuth, (user) => {
      this.currentUserSignal.set(this.mapFirebaseUser(user));
      this.isLoadingSignal.set(false);
    });
  }

  async register(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.firebaseAuth, email.trim(), password);
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.firebaseAuth, email.trim(), password);
  }

  async loginAsGuest(): Promise<void> {
    await signInAnonymously(this.firebaseAuth);
  }

  async logout(): Promise<void> {
    await signOut(this.firebaseAuth);
  }

  private mapFirebaseUser(user: User | null): AuthUser | null {
    if (!user) {
      return null;
    }

    return {
      uid: user.uid,
      email: user.email,
      isAnonymous: user.isAnonymous,
    };
  }
}
