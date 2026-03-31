import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign ResizeObserver errors caused by virtualization
const originalError = console.error;
console.error = (...args) => {
  const msg = args[0];
  if (
    (typeof msg === 'string' && 
      (msg.includes('ResizeObserver loop completed with undelivered notifications') || 
       msg.includes('ResizeObserver loop limit exceeded'))) ||
    (msg instanceof Error && 
      (msg.message.includes('ResizeObserver loop completed with undelivered notifications') || 
       msg.message.includes('ResizeObserver loop limit exceeded')))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

window.addEventListener('error', (e) => {
  if (
    e.message.includes('ResizeObserver loop completed with undelivered notifications') || 
    e.message.includes('ResizeObserver loop limit exceeded')
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
