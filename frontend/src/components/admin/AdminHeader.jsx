import React from 'react';
import { 
  FaBars, FaTimes, FaUserCircle, FaBell, FaSearch, 
  FaCog, FaSignOutAlt, FaChevronDown 
} from 'react-icons/fa';

const AdminHeader = ({ 
  user, 
  sidebarOpen, 
  onToggleSidebar, 
  onLogout 
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);

  const notifications = [
    { id: 1, text: 'New story submitted for review', time: '5m ago', unread: true },
    { id: 2, text: 'Gallery upload completed', time: '1h ago', unread: false },
    { id: 3, text: 'System backup completed', time: '2h ago', unread: false }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header style={{
      height: '80px',
      background: 'var(--gradient-card)',
      borderBottom: '1px solid var(--gray-200)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-6)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Left Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          style={{
            padding: 'var(--space-2)',
            background: 'transparent',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--gray-600)',
            cursor: 'pointer',
            transition: 'all var(--transition-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'var(--gray-100)';
            e.target.style.borderColor = 'var(--primary-teal)';
            e.target.style.color = 'var(--primary-teal)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.borderColor = 'var(--gray-300)';
            e.target.style.color = 'var(--gray-600)';
          }}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Search Bar */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <FaSearch style={{
            position: 'absolute',
            left: 'var(--space-3)',
            color: 'var(--gray-400)',
            fontSize: 'var(--text-sm)',
            zIndex: 1
          }} />
          <input
            type="text"
            placeholder="Search admin panel..."
            style={{
              width: '300px',
              padding: 'var(--space-2) var(--space-10)',
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius-xl)',
              background: 'white',
              fontSize: 'var(--text-sm)',
              color: 'var(--gray-700)',
              transition: 'all var(--transition-base)',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-teal)';
              e.target.style.boxShadow = '0 0 0 3px rgba(0, 191, 174, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--gray-300)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{
              position: 'relative',
              padding: 'var(--space-2)',
              background: 'transparent',
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--gray-600)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--gray-100)';
              e.target.style.borderColor = 'var(--primary-teal)';
              e.target.style.color = 'var(--primary-teal)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'var(--gray-300)';
              e.target.style.color = 'var(--gray-600)';
            }}
          >
            <FaBell />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'var(--error)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                borderRadius: 'var(--radius-full)',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid white'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 'var(--space-2)',
              width: '320px',
              background: 'white',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: 'var(--space-4)',
                borderBottom: '1px solid var(--gray-200)',
                background: 'var(--gray-50)'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: 'var(--text-lg)',
                  fontWeight: '600',
                  color: 'var(--gray-900)'
                }}>
                  Notifications
                </h3>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    style={{
                      padding: 'var(--space-4)',
                      borderBottom: '1px solid var(--gray-100)',
                      background: notification.unread ? 'rgba(0, 191, 174, 0.02)' : 'white',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--gray-50)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = notification.unread ? 'rgba(0, 191, 174, 0.02)' : 'white';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 'var(--space-2)'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: 'var(--text-sm)',
                        color: 'var(--gray-700)',
                        lineHeight: 1.4
                      }}>
                        {notification.text}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--gray-500)',
                          whiteSpace: 'nowrap'
                        }}>
                          {notification.time}
                        </span>
                        {notification.unread && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            background: 'var(--primary-teal)',
                            borderRadius: 'var(--radius-full)'
                          }} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              background: 'transparent',
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              color: 'var(--gray-700)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--gray-100)';
              e.target.style.borderColor = 'var(--primary-teal)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.borderColor = 'var(--gray-300)';
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--gradient-primary)',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 'var(--text-sm)',
              fontWeight: 'bold'
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                color: 'var(--gray-900)'
              }}>
                {user?.name || 'Admin'}
              </div>
              <div style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--gray-500)',
                textTransform: 'capitalize'
              }}>
                {user?.admin_level?.replace('_', ' ') || 'Administrator'}
              </div>
            </div>
            <FaChevronDown style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--gray-400)',
              transition: 'transform var(--transition-base)',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }} />
          </button>

          {/* User Dropdown */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 'var(--space-2)',
              width: '200px',
              background: 'white',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              overflow: 'hidden'
            }}>
              <button
                style={{
                  width: '100%',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--gray-700)',
                  transition: 'background var(--transition-fast)',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--gray-50)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <FaCog />
                <span>Settings</span>
              </button>
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--error)',
                  transition: 'background var(--transition-fast)',
                  textAlign: 'left',
                  borderTop: '1px solid var(--gray-200)'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.05)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;