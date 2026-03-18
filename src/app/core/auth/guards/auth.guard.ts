import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../../../features/auth/data-access/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isReady).pipe(
    filter(Boolean),
    take(1),
    map(() => {
      return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
    }),
  );
};
