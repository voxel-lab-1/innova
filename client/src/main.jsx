import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global fetch interceptor to inject JWT token in all API calls
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  if (typeof input === 'string' && (input.startsWith('/api') || input.includes('/api/'))) {
    const token = localStorage.getItem("innova_token") || sessionStorage.getItem("innova_token");
    if (token) {
      init = init || {};
      let headers = init.headers || {};
      if (headers instanceof Headers) {
        headers.set("Authorization", `Bearer ${token}`);
      } else if (Array.isArray(headers)) {
        headers.push(["Authorization", `Bearer ${token}`]);
      } else {
        headers = {
          ...headers,
          "Authorization": `Bearer ${token}`
        };
      }
      init.headers = headers;
    }
  }
  return originalFetch.call(window, input, init);
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

