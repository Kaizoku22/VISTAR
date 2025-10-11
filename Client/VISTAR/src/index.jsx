import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* Provides components Global User Object */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
