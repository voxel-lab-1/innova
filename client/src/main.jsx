import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global fetch interceptor to inject JWT token in all API calls
const originalFetch = window.fetch;
window.fetch = async function (input, init = {}) {
  let url = typeof input === 'string' ? input : input.url;
  const isApi = url && (url.startsWith('/api') || url.includes('/api/'));
  if (isApi) {
    const token = localStorage.getItem("innova_token") || sessionStorage.getItem("innova_token");
    if (token) {
      if (typeof input === 'string') {
        init.headers = {
          ...init.headers,
          "Authorization": `Bearer ${token}`
        };
      } else {
        try {
          input.headers.set("Authorization", `Bearer ${token}`);
        } catch (e) {
          input = new Request(input, {
            headers: {
              ...Object.fromEntries(input.headers.entries()),
              "Authorization": `Bearer ${token}`
            }
          });
        }
      }
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err));
  });

  // Reload the page when a new service worker takes over control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

