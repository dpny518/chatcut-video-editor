import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { PostHogProvider } from 'posthog-js/react'
import posthog from 'posthog-js'

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  posthog.init(process.env.REACT_APP_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {isProd ? (
      <PostHogProvider client={posthog}>
        <App />
      </PostHogProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);

reportWebVitals();