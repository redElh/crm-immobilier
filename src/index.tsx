import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initTheme } from './contexts/ThemeContext';

/* Chromium raises a benign "ResizeObserver loop" error whenever an observer
   batch cannot deliver every notification in the same frame — it is not a
   failure and must not reach the dev overlay / error reporting. */
const isResizeObserverLoop = (message?: string | null): boolean =>
  !!message &&
  (message.includes('ResizeObserver loop completed with undelivered notifications') ||
   message.includes('ResizeObserver loop limit exceeded'));

window.addEventListener(
  'error',
  (event) => {
    if (isResizeObserverLoop(event.message)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  },
  true
);

initTheme();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
