
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/firebase';
import './src/index.css';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker after consent
registerServiceWorker();

// Firebase is initialized in ./src/firebase.ts