// Service Worker registration with cookie consent check
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    const consent = localStorage.getItem('cookieConsent');
    
    if (consent === 'accepted') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            // Service worker registered successfully
          })
          .catch(error => {
            // Service worker registration failed - this is expected in development
          });
      });
    } else if (consent === 'declined') {
      // Unregister service worker if consent declined
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
  }
};

// Listen for consent changes
window.addEventListener('storage', (e) => {
  if (e.key === 'cookieConsent') {
    if (e.newValue === 'accepted') {
      registerServiceWorker();
    } else if (e.newValue === 'declined') {
      navigator.serviceWorker?.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
  }
});
