import React, { useState, useEffect } from 'react';
import { 
  FaUsers, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaSort, FaBan, FaCheck,
  FaUserShield, FaCrown, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaChartLine,
  FaExclamationTriangle, FaSync, FaDownload, FaUpload, FaEye, FaTimes
} from 'react-icons/fa';
import { useNotification } from '../common/Notification';
import LoadingSpinner from '../common/LoadingSpinner';

const UserManagement = ({ adminService }) => {
  const { showSuccess, showError } = useNotification();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    newThisMonth: 0
  });

  useEffect(() => {
    loadUsers();
    loadUserStats();
  }, [currentPage, searchTerm, filterRole, filterStatus, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsers({
        page: currentPage,
        per_page: 15,
        search: searchTerm,
        role_filter: filterRole,
        status_filter: filterStatus,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (response.success) {
        setUsers(response.data || []);
        setTotalPages(response.meta?.pages || 1);
      } else {
        showError('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await adminService.getUserStats();
      console.log('🔍 UserManagement loadUserStats response:', response);
      if (response.success) {
        const statsData = response.statistics || response.data || {};
        console.log('🔍 UserManagement statsData:', statsData);
        setStats({
          total: statsData.total_users || 0,
          active: statsData.active_users || 0,
          admins: statsData.admin_users || 0,
          newThisMonth: statsData.recent_registrations || 0
        });
        console.log('🔍 UserManagement final stats:', {
          total: statsData.total_users || 0,
          active: statsData.active_users || 0,
          admins: statsData.admin_users || 0,
          newThisMonth: statsData.recent_registrations || 0
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      let response;
      switch (action) {
        case 'activate':
          response = await adminService.updateUserStatus(userId, 'active');
          showSuccess('User activated successfully');
          break;
        case 'deactivate':
          response = await adminService.updateUserStatus(userId, 'inactive');
          showSuccess('User deactivated successfully');
          break;
        case 'promote':
          response = await adminService.updateUserRole(userId, 'admin');
          showSuccess('User promoted to admin');
          break;
        case 'demote':
          response = await adminService.updateUserRole(userId, 'user');
          showSuccess('User demoted from admin');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            response = await adminService.deleteUser(userId);
            showSuccess('User deleted successfully');
          } else {
            return;
          }
          break;
        default:
          break;
      }

      if (response && response.success) {
        loadUsers();
        loadUserStats();
      } else {
        showError(response?.message || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing user action:', error);
      showError('Action failed');
    }
  };

  const getUserRoleIcon = (user) => {
    if (user.admin_level === 'super_admin') return <FaCrown style={{ color: '#ffd700' }} />;
    if (['admin', 'moderator'].includes(user.admin_level)) return <FaUserShield style={{ color: '#3b82f6' }} />;
    return <FaUser style={{ color: '#6b7280' }} />;
  };

  const getUserRoleText = (user) => {
    if (user.admin_level === 'super_admin') return 'Super Admin';
    if (user.admin_level === 'admin') return 'Admin';
    if (user.admin_level === 'moderator') return 'Moderator';
    return 'User';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || 
                       (filterRole === 'admin' && ['admin', 'super_admin', 'moderator'].includes(user.admin_level)) ||
                       (filterRole === 'user' && user.admin_level === 'user');
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const StatsCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            {title}
          </p>
          <p style={{ 
            color: '#1f2937', 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            margin: '0.25rem 0 0 0' 
          }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
        <Icon style={{ color, fontSize: '2rem' }} />
      </div>
    </div>
  );

  if (loading && users.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          margin: 0,
          marginBottom: '0.5rem'
        }}>
          User Management
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <StatsCard
          title="Total Users"
          value={stats.total}
          icon={FaUsers}
          color="#3b82f6"
          subtitle="All registered users"
        />
        <StatsCard
          title="Active Users"
          value={stats.active}
          icon={FaCheck}
          color="#10b981"
          subtitle="Currently active"
        />
        <StatsCard
          title="Administrators"
          value={stats.admins}
          icon={FaUserShield}
          color="#f59e0b"
          subtitle="Admin level users"
        />
        <StatsCard
          title="New This Month"
          value={stats.newThisMonth}
          icon={FaChartLine}
          color="#8b5cf6"
          subtitle="Recent signups"
        />
      </div>

      {/* Filters and Search */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e5e7eb',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '300px', flex: 1 }}>
            <FaSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#1f2937'
              }}
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#1f2937'
            }}
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#1f2937'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => { loadUsers(); loadUserStats(); }}
            style={{
              padding: '0.75rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <FaSync />
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#374151' }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#374151' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#374151' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#374151' }}>Joined</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#374151' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id} style={{ 
                  borderTop: '1px solid #e5e7eb',
                  '&:hover': { background: '#f9fafb' }
                }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, #3b82f6, #1d4ed8)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {user.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#1f2937' 
                        }}>
                          {user.name || 'N/A'}
                        </div>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: '#6b7280' 
                        }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getUserRoleIcon(user)}
                      <span style={{ color: '#374151' }}>
                        {getUserRoleText(user)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: user.is_active ? '#dcfce7' : '#fee2e2',
                      color: user.is_active ? '#166534' : '#991b1b'
                    }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#374151' }}>
                    {formatDate(user.created_at)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {user.is_active ? (
                        <button
                          onClick={() => handleUserAction('deactivate', user.id)}
                          style={{
                            padding: '0.5rem',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Deactivate user"
                        >
                          <FaBan />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction('activate', user.id)}
                          style={{
                            padding: '0.5rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Activate user"
                        >
                          <FaCheck />
                        </button>
                      )}
                      
                      {user.admin_level === 'user' ? (
                        <button
                          onClick={() => handleUserAction('promote', user.id)}
                          style={{
                            padding: '0.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Promote to admin"
                        >
                          <FaUserShield />
                        </button>
                      ) : user.admin_level !== 'super_admin' && (
                        <button
                          onClick={() => handleUserAction('demote', user.id)}
                          style={{
                            padding: '0.5rem',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                          title="Demote from admin"
                        >
                          <FaUser />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleUserAction('delete', user.id)}
                        style={{
                          padding: '0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        title="Delete user"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <FaUsers style={{ fontSize: '3rem', marginBottom: '1rem' }} />
            <h3>No users found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <span style={{ color: '#374151' }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === totalPages ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManagement;