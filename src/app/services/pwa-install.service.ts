import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: any;
  private installPrompt$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.listenForInstallPrompt();
  }

  private listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.installPrompt$.next(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.installPrompt$.next(false);
    });
  }

  get installPromptAvailable$() {
    return this.installPrompt$.asObservable();
  }

  get isInstallPromptAvailable() {
    return this.installPrompt$.value;
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.installPrompt$.next(false);
    return outcome === 'accepted';
  }
}
