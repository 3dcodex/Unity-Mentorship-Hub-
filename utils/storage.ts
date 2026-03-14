import { errorService } from '../services/errorService';

// Storage utility that respects cookie consent
export const storage = {
  hasConsent: (): boolean => {
    try {
      return localStorage.getItem('cookieConsent') === 'accepted';
    } catch {
      return false;
    }
  },

  setItem: (key: string, value: string): void => {
    if (storage.hasConsent() || key === 'cookieConsent') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        errorService.handleError(e, 'Storage not available');
      }
    }
  },

  getItem: (key: string): string | null => {
    if (storage.hasConsent() || key === 'cookieConsent') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  },

  removeItem: (key: string): void => {
    if (storage.hasConsent() || key === 'cookieConsent') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        errorService.handleError(e, 'Storage not available');
      }
    }
  },

  clear: (): void => {
    if (storage.hasConsent()) {
      try {
        const consent = localStorage.getItem('cookieConsent');
        localStorage.clear();
        if (consent) localStorage.setItem('cookieConsent', consent);
      } catch (e) {
        errorService.handleError(e, 'Storage not available');
      }
    }
  }
};
