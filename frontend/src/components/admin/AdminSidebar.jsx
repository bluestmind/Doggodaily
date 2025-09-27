import React from 'react';
import { 
  FaTachometerAlt, FaChartLine, FaUsers, FaImages, FaRoute, 
  FaBook, FaEnvelope, FaShieldAlt, FaCog, FaSignOutAlt,
  FaBars, FaTimes, FaUserCircle, FaCrown, FaUpload, FaEdit, FaGlobe
} from 'react-icons/fa';

const AdminSidebar = ({ 
  isOpen, 
  activeSection, 
  onSectionChange, 
  userLevel, 
  onToggle, 
  onLogout 
}) => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 1024);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt, level: 'all' },
    { id: 'analytics', label: 'Analytics', icon: FaChartLine, level: 'all' },
    { id: 'stories', label: 'Stories', icon: FaBook, level: 'all' },
    { id: 'story-moderation', label: 'Story Moderation', icon: FaUpload, level: 'admin' },
    { id: 'books', label: 'Book Management', icon: FaBook, level: 'admin' },
    { id: 'gallery', label: 'Gallery', icon: FaImages, level: 'all' },
    { id: 'tours', label: 'Tours', icon: FaRoute, level: 'all' },
    { id: 'users', label: 'Users', icon: FaUsers, level: 'admin' },
    { id: 'communications', label: 'Messages', icon: FaEnvelope, level: 'all' },
    { id: 'security', label: 'Security', icon: FaShieldAlt, level: 'super_admin' },
    { id: 'settings', label: 'Settings', icon: FaCog, level: 'super_admin' }
  ];

  const hasAccess = (itemLevel) => {
    if (itemLevel === 'all') return true;
    if (itemLevel === 'admin' && ['admin', 'super_admin'].includes(userLevel)) return true;
    if (itemLevel === 'super_admin' && userLevel === 'super_admin') return true;
    return false;
  };

  const getRoleDisplay = () => {
    const roleMap = {
      'super_admin': { label: 'Super Admin', icon: FaCrown, color: 'var(--warning)' },
      'admin': { label: 'Administrator', icon: FaUserCircle, color: 'var(--primary-teal)' },
      'moderator': { label: 'Moderator', icon: FaUserCircle, color: 'var(--info)' }
    };
    return roleMap[userLevel] || roleMap['moderator'];
  };

  const roleInfo = getRoleDisplay();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: isOpen ? '256px' : '80px',
        zIndex: 1000,
        transition: 'all var(--transition-base)',
        transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
        background: 'linear-gradient(180deg, var(--navy) 0%, var(--deep-blue) 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: 'var(--shadow-xl)'
      }}
      className={`admin-sidebar ${isOpen ? 'open' : 'closed'}`}
      >
        {/* Header */}
        <div style={{
          padding: isOpen ? 'var(--space-6)' : 'var(--space-4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          {isOpen ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--gradient-primary)',
                  borderRadius: 'var(--radius-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  🐕
                </div>
                <div>
                  <h2 style={{
                    color: 'white',
                    fontSize: 'var(--text-lg)',
                    fontWeight: '700',
                    margin: 0
                  }}>
                    Admin Panel
                  </h2>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: 'var(--text-xs)',
                    margin: 0
                  }}>
                    DoggoDaily
                  </p>
                </div>
              </div>
              
              {/* User Info */}
              <div style={{
                padding: 'var(--space-3)',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-lg)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  marginBottom: 'var(--space-2)'
                }}>
                  <roleInfo.icon style={{ 
                    color: roleInfo.color, 
                    fontSize: 'var(--text-sm)' 
                  }} />
                  <span style={{
                    color: 'white',
                    fontSize: 'var(--text-xs)',
                    fontWeight: '600'
                  }}>
                    {roleInfo.label}
                  </span>
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: 'var(--text-xs)'
                }}>
                  Active Session
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                color: 'white'
              }}>
                🐕
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ padding: 'var(--space-4) 0', flex: 1, overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {menuItems.filter(item => hasAccess(item.level)).map((item) => (
              <li key={item.id} style={{ margin: '0 var(--space-2) var(--space-1)' }}>
                <button
                                        onClick={() => {
                        onSectionChange(item.id);
                        // Auto-close sidebar on mobile after section selection
                        if (isMobile && isOpen) {
                          onToggle();
                        }
                      }}
                  style={{
                    width: '100%',
                    padding: isOpen ? 'var(--space-3) var(--space-4)' : 'var(--space-3)',
                    background: activeSection === item.id 
                      ? 'rgba(0, 191, 174, 0.2)' 
                      : 'transparent',
                    border: activeSection === item.id 
                      ? '1px solid var(--primary-teal)' 
                      : '1px solid transparent',
                    borderRadius: 'var(--radius-lg)',
                    color: activeSection === item.id 
                      ? 'var(--primary-teal)' 
                      : 'rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isOpen ? 'var(--space-3)' : '0',
                    justifyContent: isOpen ? 'flex-start' : 'center',
                    fontSize: 'var(--text-sm)',
                    fontWeight: '500',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== item.id) {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== item.id) {
                      e.target.style.background = 'transparent';
                      e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                    }
                  }}
                >
                  <item.icon style={{ fontSize: 'var(--text-lg)', flexShrink: 0 }} />
                  {isOpen && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: isOpen ? 'var(--space-3) var(--space-4)' : 'var(--space-3)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-lg)',
              color: '#fecaca',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              gap: isOpen ? 'var(--space-3)' : '0',
              justifyContent: isOpen ? 'flex-start' : 'center',
              fontSize: 'var(--text-sm)',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.2)';
              e.target.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.1)';
              e.target.style.color = '#fecaca';
            }}
          >
            <FaSignOutAlt style={{ fontSize: 'var(--text-lg)' }} />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;