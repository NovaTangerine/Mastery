console.log("MAIN TSX EXECUTING");
/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ((import.meta as any).env.DEV) {
  import('cssstudio').then(({ startStudio }) => {
    startStudio();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
