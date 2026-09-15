import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const dashBoardGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const url: string = state.url;

  if (url.startsWith('/dashboard')) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};