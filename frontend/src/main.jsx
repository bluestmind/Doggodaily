import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { StoriesProvider } from './contexts/StoriesContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './components/common/Notification';
import ErrorBoundary from './components/common/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AuthProvider>
              <StoriesProvider>
                <App />
              </StoriesProvider>
            </AuthProvider>
          </BrowserRouter>
        </NotificationProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
