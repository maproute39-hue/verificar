import { environment } from '../../environments/environment';

export interface AppConfig {
    pocketbaseUrl: string;
    gotenbergBaseUrl: string;
    imagesCollectionId: string;
}

declare global {
    interface Window {
        __APP_CONFIG__?: Partial<AppConfig>;
    }
}

export const appConfig: AppConfig = {
    pocketbaseUrl: window.__APP_CONFIG__?.pocketbaseUrl || environment.pocketbaseUrl,
    gotenbergBaseUrl: window.__APP_CONFIG__?.gotenbergBaseUrl || environment.gotenbergBaseUrl,
    imagesCollectionId: window.__APP_CONFIG__?.imagesCollectionId || environment.imagesCollectionId,
};

export function requireConfigValue(key: keyof AppConfig): string {
    const value = appConfig[key]?.trim();
    if (!value) {
        throw new Error(`Falta configurar ${key}`);
    }
    return value;
}
