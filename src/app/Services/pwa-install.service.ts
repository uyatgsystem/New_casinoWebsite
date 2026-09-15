import { Injectable, Inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class PwaInstallService {
  private deferredPrompt: any = null;
  canInstall = signal<boolean>(false);
  isInstalled = signal<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.init();
    }
  }

  private init(): void {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone
    ) {
      this.isInstalled.set(true);
      return;
    }

    // ✅ Pick up the event if it already fired before Angular bootstrapped
    if ((window as any).__pwaInstallPrompt) {
      this.deferredPrompt = (window as any).__pwaInstallPrompt;
      this.canInstall.set(true);
      console.log('✅ Recovered early PWA prompt');
    }

    // ✅ Also listen for future fires (e.g., user dismissed once, then revisits)
    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.deferredPrompt = event;
      (window as any).__pwaInstallPrompt = event;
      this.canInstall.set(true);
      console.log('✅ PWA prompt captured by service');
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      (window as any).__pwaInstallPrompt = null;
      this.canInstall.set(false);
      this.isInstalled.set(true);
    });
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) {
      return 'unavailable';
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      this.deferredPrompt = null;
      this.canInstall.set(false);
    }
    return outcome as 'accepted' | 'dismissed';
  }
}
