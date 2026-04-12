import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

// Warn loudly in production if the backend URL is not configured.
// This prevents silent 404s where API calls hit the Vercel domain.
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.error(
    '[Niyam AI] VITE_API_URL is not set. ' +
    'All API calls will 404. ' +
    'Go to Vercel → Settings → Environment Variables → add VITE_API_URL=https://your-render-url.onrender.com → Redeploy.'
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Sora, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
            },
            success: { style: { background: '#D1FAE5', color: '#2D7D46' } },
            error: { style: { background: '#FEE2E2', color: '#C0392B' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
