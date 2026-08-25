import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PrivacyPolicy from './components/PrivacyPolicy.jsx'
import TermsOfService from './components/TermsOfService.jsx'

// Global fetch interceptor to inject JWT token in all API calls
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  let url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
  if (url) {
    const token = localStorage.getItem("ZEROFIT_token") || 
                  localStorage.getItem("zerofit_token") || 
                  sessionStorage.getItem("ZEROFIT_token") || 
                  sessionStorage.getItem("zerofit_token");
    if (token) {
      const newInit = init ? { ...init } : {};
      let headers = newInit.headers || {};
      if (headers instanceof Headers) {
        const newHeaders = new Headers(headers);
        if (!newHeaders.has("Authorization")) {
          newHeaders.set("Authorization", `Bearer ${token}`);
        }
        newInit.headers = newHeaders;
      } else if (Array.isArray(headers)) {
        const newHeaders = [...headers];
        if (!newHeaders.some(h => Array.isArray(h) && h[0] && h[0].toLowerCase() === 'authorization')) {
          newHeaders.push(["Authorization", `Bearer ${token}`]);
        }
        newInit.headers = newHeaders;
      } else {
        newInit.headers = {
          "Authorization": `Bearer ${token}`,
          ...headers
        };
      }
      return originalFetch.call(window, input, newInit);
    }
  }
  return originalFetch.call(window, input, init);
};

const pathname = window.location.pathname;
let RootComponent = App;
if (pathname === '/privacy') RootComponent = PrivacyPolicy;
if (pathname === '/terms') RootComponent = TermsOfService;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
}

