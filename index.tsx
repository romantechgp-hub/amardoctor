
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const init = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Mounting Error:", err);
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; font-family: sans-serif;">
        <h1 style="color: #ef4444; font-size: 2rem; font-weight: 900;">সিস্টেম এরর!</h1>
        <p style="color: #64748b; margin: 15px 0;">অ্যাপটি চালু হতে সমস্যা হয়েছে। ব্রাউজার রিফ্রেশ করুন অথবা ক্যাশ ক্লিয়ার করুন।</p>
        <button onclick="window.location.reload()" style="background: #2563eb; color: white; border: none; padding: 12px 25px; border-radius: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">আবার চেষ্টা করুন</button>
      </div>
    `;
  }
};

// Ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
