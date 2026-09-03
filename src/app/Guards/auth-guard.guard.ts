import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authGuardGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. SSR Check: Ensure we are in the browser to access storage
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');
    const targetUrl = state.url;

    // Extract just the pathname (e.g., "/?ad=123" becomes "/")
    const pathOnly = targetUrl.split('?')[0];

    const adCode = route.queryParams['ad'];

    if (adCode) {
      // 1. Session storage mein save karo
      sessionStorage.setItem('adCode', adCode);

      // 2. URL ko clean karke wapas root ('/') par bhej do
      router.navigate(['/']);

      // 3. false return karein taaki purani request cancel ho jaye aur clean URL chale
      return false;
    }
    // route.queryParams se directly 'ad' ki value nikal rahe hain
    // ---- AD CODE LOGIC END ----

    // 2. Public Route Exception: Always allow '/check'
    if (pathOnly.startsWith('/check')) {
      return true;
    }

    if (token) {
      // 3. Logged in & hitting Root: Redirect to Dashboard
      if (pathOnly === '/') {
        router.navigate(['/dashboard/home']);
        return false;
      }
      // 4. Logged in & hitting any other route: Stay there
      return true;
    } else {
      // 5. Not logged in: Redirect to Root (unless already there)
      if (pathOnly !== '/') {
        router.navigate(['/'], { queryParams: { returnUrl: targetUrl } });
        return false;
      }
      return true;
    }
  }

  // Default for SSR/Non-browser environments
  return true;
};
