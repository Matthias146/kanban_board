import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../../../features/auth/data-access/auth.service';

export const guestOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isReady).pipe(
    filter(Boolean),
    take(1),
    map(() => {
      return authService.isAuthenticated() ? router.createUrlTree(['/board']) : true;
    }),
  );
};
