import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PrivacyPolicy from './components/PrivacyPolicy.jsx'
import TermsOfService from './components/TermsOfService.jsx'

// Global fetch interceptor to inject JWT token in all API calls
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  if (typeof input === 'string' && (input.startsWith('/api') || input.includes('/api/'))) {
    const token = localStorage.getItem("zerofit_token") || sessionStorage.getItem("zerofit_token");
    if (token) {
      const newInit = init ? { ...init } : {};
      let headers = newInit.headers || {};
      if (headers instanceof Headers) {
        const newHeaders = new Headers(headers);
        newHeaders.set("Authorization", `Bearer ${token}`);
        newInit.headers = newHeaders;
      } else if (Array.isArray(headers)) {
        const newHeaders = [...headers];
        newHeaders.push(["Authorization", `Bearer ${token}`]);
        newInit.headers = newHeaders;
      } else {
        newInit.headers = {
          ...headers,
          "Authorization": `Bearer ${token}`
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

