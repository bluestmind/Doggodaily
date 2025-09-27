import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import adminService from '../services/adminService';
import enhancedAdminService from '../services/enhancedAdminService';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import SecurityPanel from '../components/admin/SecurityPanel';
import EnhancedSecurityPanel from '../components/admin/EnhancedSecurityPanel';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import EnhancedAnalyticsDashboard from '../components/admin/EnhancedAnalyticsDashboard';
import ToursManagement from '../components/admin/ToursManagement';
import StoriesManagement from '../components/admin/StoriesManagement';
import GalleryManagement from '../components/admin/GalleryManagement';
import EnhancedGalleryManagement from '../components/admin/EnhancedGalleryManagement';
import StoryModeration from '../components/admin/StoryModeration';
import BookManagement from '../components/admin/BookManagement';
import SystemSettings from '../components/admin/SystemSettings';
import CommunicationsHub from '../components/admin/CommunicationsHub';
import AuthCheck from '../components/admin/AuthCheck';
import BackendStatusBanner from '../components/admin/BackendStatusBanner';
import '../components/admin/AdminResponsive.css';

const PERMISSION_LEVELS = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  VIEWER: 'viewer'
};

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    if (!user) {
      console.log('⏳ Waiting for user data...');
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
      if (window.innerWidth <= 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial state

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard adminService={adminService} onSectionChange={setActiveSection} />;
      case 'analytics':
        return <EnhancedAnalyticsDashboard />;
      case 'stories':
        return <StoriesManagement adminService={adminService} />;
      case 'story-moderation':
        return <StoryModeration adminService={enhancedAdminService} />;
        case 'books':
          return <BookManagement adminService={enhancedAdminService} />;
        case 'gallery':
          return <EnhancedGalleryManagement adminService={enhancedAdminService} />;
      case 'tours':
        return <ToursManagement adminService={adminService} />;
      case 'users':
        return <UserManagement adminService={adminService} />;
      case 'communications':
        return <CommunicationsHub adminService={adminService} />;
      case 'security':
        return user?.admin_level === 'super_admin' ? 
                      <EnhancedSecurityPanel /> : 
          <AdminDashboard adminService={adminService} />;
      case 'settings':
        return user?.admin_level === 'super_admin' ? 
          <SystemSettings adminService={adminService} /> : 
          <AdminDashboard adminService={adminService} />;
      default:
        return <AdminDashboard adminService={adminService} />;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--gradient-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--gray-200)',
            borderTop: '4px solid var(--primary-teal)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <p style={{
            marginTop: 'var(--space-4)',
            color: 'var(--gray-600)',
            fontSize: 'var(--text-base)'
          }}>
            Loading admin panel...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !user.admin_level) {
    return null;
  }

  return (
    <AuthCheck>
      <BackendStatusBanner />
      <div style={{
        minHeight: '100vh',
        background: 'var(--gradient-secondary)',
        display: 'flex'
      }}>
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userLevel={user.admin_level}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginLeft: !isMobile ? (sidebarOpen ? '256px' : '80px') : '0',
        transition: 'margin-left var(--transition-base)',
        minHeight: '100vh',
        width: !isMobile ? `calc(100% - ${sidebarOpen ? '256px' : '80px'})` : '100%'
      }}
      className="admin-main-content"
      >
        {/* Header */}
        <AdminHeader 
          user={user}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />
        
        {/* Content Area */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--gray-50)'
        }}>
          {renderContent()}
        </main>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Desktop */
          @media (min-width: 1025px) {
            .admin-sidebar {
              position: fixed !important;
              transform: translateX(0) !important;
              z-index: 1000 !important;
            }
            .admin-main-content {
              margin-left: ${sidebarOpen ? '256px' : '80px'} !important;
              width: calc(100% - ${sidebarOpen ? '256px' : '80px'}) !important;
            }
          }
          
          /* Tablet */
          @media (max-width: 1024px) and (min-width: 769px) {
            .admin-sidebar {
              transform: translateX(${sidebarOpen ? '0' : '-100%'}) !important;
              z-index: 1001 !important;
              width: 256px !important;
            }
            .admin-main-content {
              margin-left: 0 !important;
              width: 100% !important;
            }
          }
          
          /* Mobile */
          @media (max-width: 768px) {
            .admin-sidebar {
              width: 280px !important;
              transform: translateX(${sidebarOpen ? '0' : '-100%'}) !important;
              z-index: 1002 !important;
            }
            .admin-main-content {
              margin-left: 0 !important;
              width: 100% !important;
              padding: 0 !important;
            }
          }
          
          /* Small Mobile */
          @media (max-width: 480px) {
            .admin-sidebar {
              width: 100% !important;
              transform: translateX(${sidebarOpen ? '0' : '-100%'}) !important;
              z-index: 1003 !important;
            }
            .admin-main-content {
              margin-left: 0 !important;
              width: 100% !important;
            }
          }
        `}
      </style>
      </div>
    </AuthCheck>
  );
};

export default AdminPage; 