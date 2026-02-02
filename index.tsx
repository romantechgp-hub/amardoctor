
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const mountApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("React mounting failed:", error);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; text-align: center; font-family: sans-serif;">
        <div style="max-width: 400px;">
          <h1 style="color: #e11d48;">Initialization Error</h1>
          <p style="color: #64748b;">The application failed to start. This might be due to a network issue or unsupported browser.</p>
          <button onclick="window.location.reload()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Retry</button>
        </div>
      </div>
    `;
  }
};

mountApp();
