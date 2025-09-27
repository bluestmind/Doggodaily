import React from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import LanguageSync from './components/layout/LanguageSync';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfileModern from './pages/ProfileModern';
import GalleryPage from './pages/GalleryPage';
import StoriesPage from './pages/StoriesPage';
import StoryDetails from './pages/StoryDetails';
import ToursPage from './pages/ToursPage';
import TourDetails from './pages/TourDetails';
import BookPage from './pages/BookPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import AdminErrorBoundary from './components/admin/AdminErrorBoundary';

// Enhanced Protected Route Components
function ProtectedRoute({ children }) {
  const { user, isAuthenticated, loading, isInitialized } = useAuth();

  console.log('🛡️ ProtectedRoute check:');
  console.log('  - Loading:', loading);
  console.log('  - Initialized:', isInitialized);
  console.log('  - User:', user ? 'present' : 'null');
  console.log('  - isAuthenticated (function):', typeof isAuthenticated);

  // Show loading spinner while initializing
  if (loading || !isInitialized) {
    console.log('⏳ Still loading or not initialized, showing spinner...');
    return <LoadingSpinner fullScreen message="Checking authentication..." />;
  }

  // Call the function to get actual boolean value
  const authenticated = isAuthenticated();
  console.log('  - Authenticated:', authenticated);

  if (!authenticated) {
    console.log('❌ User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ User authenticated, rendering protected content');
  return children;
}

function ProtectedAdminRoute() {
  const { user, isAuthenticated, isAdmin, loading, isInitialized } = useAuth();

  console.log('🛡️ ProtectedAdminRoute check:');
  console.log('  - Loading:', loading);
  console.log('  - Initialized:', isInitialized);
  console.log('  - User:', user ? 'present' : 'null');
  console.log('  - isAuthenticated (function):', typeof isAuthenticated);
  console.log('  - isAdmin (function):', typeof isAdmin);

  // Show loading spinner while initializing
  if (loading || !isInitialized) {
    console.log('⏳ Still loading or not initialized, showing spinner...');
    return <LoadingSpinner fullScreen message="Checking admin permissions..." />;
  }

  // Call the functions to get actual boolean values
  const authenticated = isAuthenticated();
  const adminUser = isAdmin();
  
  console.log('  - Authenticated:', authenticated);
  console.log('  - Admin user:', adminUser);
  console.log('  - User admin_level:', user?.admin_level);

  if (!authenticated) {
    console.log('❌ User not authenticated, redirecting to admin login');
    return <Navigate to="/admin/login" replace />;
  }

  if (!adminUser) {
    console.log('❌ User not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Admin user authenticated, rendering admin panel');
  return <AdminPage />;
}

// Main App Component
function App() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <LanguageSync />
      <Routes>
        {/* Admin Routes - No main layout */}
        <Route path="/admin/login" element={
          <AdminErrorBoundary>
            <AdminLoginPage />
          </AdminErrorBoundary>
        } />
        <Route path="/admin" element={
          <AdminErrorBoundary>
            <ProtectedAdminRoute />
          </AdminErrorBoundary>
        } />
        
        {/* All other routes with main layout */}
        <Route path="/*" element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/stories" element={<StoriesPage />} />
                <Route path="/stories/:id" element={<StoryDetails />} />
                <Route path="/tours" element={<ToursPage />} />
                <Route path="/tours/:id" element={<TourDetails />} />
                <Route path="/book" element={<BookPage />} />
                <Route path="/contact" element={<ContactPage />} />
                
                {/* Protected Routes */}
                                        <Route 
                          path="/profile" 
                          element={
                            <ProtectedRoute>
                              <ProfileModern />
                            </ProtectedRoute>
                          } 
                        />
                
                {/* Catch all route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;
