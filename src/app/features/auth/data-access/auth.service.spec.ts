import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User, UserCredential } from 'firebase/auth';
import { AuthService } from './auth.service';

const authMocks = vi.hoisted(() => {
  return {
    createUserWithEmailAndPassword: vi.fn(),
    onAuthStateChanged: vi.fn(),
    signInAnonymously: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock('firebase/auth', () => {
  return {
    createUserWithEmailAndPassword: authMocks.createUserWithEmailAndPassword,
    onAuthStateChanged: authMocks.onAuthStateChanged,
    signInAnonymously: authMocks.signInAnonymously,
    signInWithEmailAndPassword: authMocks.signInWithEmailAndPassword,
    signOut: authMocks.signOut,
  };
});

vi.mock('../../../core/firebase/firebase.client', () => {
  return {
    auth: { mocked: true },
  };
});

function emitAuthState(
  callback: ((user: User | null) => void) | { next?: (user: User | null) => void },
  user: User | null,
): void {
  if (typeof callback === 'function') {
    callback(user);
    return;
  }

  callback.next?.(user);
}

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authMocks.onAuthStateChanged.mockImplementation((_, callback) => {
      emitAuthState(callback, null);
      return vi.fn();
    });

    authMocks.createUserWithEmailAndPassword.mockResolvedValue({} as UserCredential);
    authMocks.signInWithEmailAndPassword.mockResolvedValue({} as UserCredential);
    authMocks.signInAnonymously.mockResolvedValue({} as UserCredential);
    authMocks.signOut.mockResolvedValue(undefined);
  });

  it('should create the service', () => {
    const service = new AuthService();

    expect(service).toBeTruthy();
  });

  it('should set unauthenticated state when there is no user', () => {
    const service = new AuthService();

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isGuest()).toBe(false);
    expect(service.isReady()).toBe(true);
  });

  it('should map firebase user from onAuthStateChanged', () => {
    const fakeUser = {
      uid: 'user-123',
      email: 'test@example.com',
      isAnonymous: false,
    } as User;

    authMocks.onAuthStateChanged.mockImplementation((_, callback) => {
      emitAuthState(callback, fakeUser);
      return vi.fn();
    });

    const service = new AuthService();

    expect(service.user()).toEqual({
      uid: 'user-123',
      email: 'test@example.com',
      isAnonymous: false,
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isGuest()).toBe(false);
    expect(service.isReady()).toBe(true);
  });

  it('should mark user as guest when firebase user is anonymous', () => {
    const fakeGuestUser = {
      uid: 'guest-123',
      email: null,
      isAnonymous: true,
    } as User;

    authMocks.onAuthStateChanged.mockImplementation((_, callback) => {
      emitAuthState(callback, fakeGuestUser);
      return vi.fn();
    });

    const service = new AuthService();

    expect(service.user()).toEqual({
      uid: 'guest-123',
      email: null,
      isAnonymous: true,
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isGuest()).toBe(true);
    expect(service.isReady()).toBe(true);
  });

  it('should call createUserWithEmailAndPassword on register', async () => {
    const service = new AuthService();

    await service.register('test@example.com', 'secret123');

    expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'secret123',
    );
  });

  it('should trim email on register', async () => {
    const service = new AuthService();

    await service.register('  test@example.com  ', 'secret123');

    expect(authMocks.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'secret123',
    );
  });

  it('should call signInWithEmailAndPassword on login', async () => {
    const service = new AuthService();

    await service.login('test@example.com', 'secret123');

    expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'secret123',
    );
  });

  it('should trim email on login', async () => {
    const service = new AuthService();

    await service.login('  test@example.com  ', 'secret123');

    expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'secret123',
    );
  });

  it('should call signInAnonymously on guest login', async () => {
    const service = new AuthService();

    await service.loginAsGuest();

    expect(authMocks.signInAnonymously).toHaveBeenCalledTimes(1);
    expect(authMocks.signInAnonymously).toHaveBeenCalledWith(expect.anything());
  });

  it('should call signOut on logout', async () => {
    const service = new AuthService();

    await service.logout();

    expect(authMocks.signOut).toHaveBeenCalledTimes(1);
    expect(authMocks.signOut).toHaveBeenCalledWith(expect.anything());
  });
});
