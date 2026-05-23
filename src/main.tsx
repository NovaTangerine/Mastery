/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (import.meta.env.DEV) {
  import('cssstudio').then(({ startStudio }) => {
    startStudio();
  });
}

// Suppress benign ResizeObserver errors caused by virtualization and Firebase timestamp warnings
const originalError = console.error;
console.error = (...args) => {
  const msgStr = args.map(a => typeof a === 'string' ? a : (a instanceof Error ? a.message : '')).join(' ');
  if (
    msgStr.includes('ResizeObserver loop completed with undelivered notifications') || 
    msgStr.includes('ResizeObserver loop limit exceeded') ||
    msgStr.includes('Detected an update time that is in the future')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

const originalWarn = console.warn;
console.warn = (...args) => {
  const msgStr = args.map(a => typeof a === 'string' ? a : '').join(' ');
  if (msgStr.includes('Detected an update time that is in the future')) {
    return;
  }
  originalWarn.call(console, ...args);
};

const originalLog = console.log;
console.log = (...args) => {
  const msgStr = args.map(a => typeof a === 'string' ? a : '').join(' ');
  if (msgStr.includes('Detected an update time that is in the future')) {
    return;
  }
  originalLog.call(console, ...args);
};

const originalInfo = console.info;
console.info = (...args) => {
  const msgStr = args.map(a => typeof a === 'string' ? a : '').join(' ');
  if (msgStr.includes('Detected an update time that is in the future')) {
    return;
  }
  originalInfo.call(console, ...args);
};

window.addEventListener('error', (e) => {
  if (
    e.message?.includes('ResizeObserver loop completed with undelivered notifications') || 
    e.message?.includes('ResizeObserver loop limit exceeded')
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
