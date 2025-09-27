import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaBell, FaSms, FaPaperPlane, FaUsers, FaInbox, FaReply, FaEye, FaCheck, FaTimes, FaClock } from 'react-icons/fa';

const CommunicationsHub = ({ adminService }) => {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ unread: 0, sent: 0, campaigns: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadCommunicationsData();
  }, []);

  const loadCommunicationsData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading communications data...');
      
      // Try to fetch real data from backend
      try {
        console.log('📤 Calling adminService.getMessages()...');
        const messagesResponse = await adminService.getMessages();
        console.log('📥 Messages response:', messagesResponse);
        
        console.log('📤 Calling adminService.getCommunicationStats()...');
        const statsResponse = await adminService.getCommunicationStats();
        console.log('📥 Stats response:', statsResponse);
        
        if (messagesResponse.success) {
          setMessages(messagesResponse.data);
          console.log('✅ Messages loaded from backend:', messagesResponse.data.length);
        } else {
          console.warn('⚠️ Messages response not successful:', messagesResponse.message);
        }
        
        if (statsResponse.success) {
          setStats(statsResponse.data);
          console.log('✅ Communication stats loaded from backend');
        } else {
          console.warn('⚠️ Stats response not successful:', statsResponse.message);
        }
      } catch (backendError) {
        console.warn('⚠️ Backend unavailable, using mock data:', backendError.message);
        console.error('Backend error details:', backendError);
        
        // Fallback to mock data with proper structure
        setMessages([
          { 
            id: 1, 
            sender_name: 'Sarah M.', 
            sender_email: 'sarah@example.com',
            subject: 'Tour booking inquiry', 
            message: 'Hi, I would like to book a tour for next week. Can you help me with availability?',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'unread',
            urgency: 'normal',
            service_type: 'tour',
            admin_response: null,
            responded_at: null
          },
          { 
            id: 2, 
            sender_name: 'Mike C.', 
            sender_email: 'mike@example.com',
            subject: 'Story submission question', 
            message: 'I have a great story about my dog. How do I submit it?',
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            status: 'replied',
            urgency: 'normal',
            service_type: 'story',
            admin_response: 'Thank you for your interest! You can submit your story through the Stories section in your profile.',
            responded_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          },
          { 
            id: 3, 
            sender_name: 'Emma W.', 
            sender_email: 'emma@example.com',
            subject: 'Gallery submission', 
            message: 'I have some beautiful photos of my dog that I would like to share.',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'read',
            urgency: 'normal',
            service_type: 'gallery',
            admin_response: null,
            responded_at: null
          },
          { 
            id: 4, 
            sender_name: 'David L.', 
            sender_email: 'david@example.com',
            subject: 'Website feedback', 
            message: 'The website looks great! I love the new design.',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'unread',
            urgency: 'low',
            service_type: 'feedback',
            admin_response: null,
            responded_at: null
          }
        ]);
        
        setStats({ unread: 12, sent: 8, campaigns: 3 });
      }
      
    } catch (error) {
      console.error('Failed to load communications data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message) => {
    setSelectedMessage(message);
    
    // Mark message as read if it's unread
    if (message.status === 'unread') {
      try {
        await adminService.markMessageAsRead(message.id);
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? { ...msg, status: 'read' } : msg
        ));
        // Update stats
        setStats(prev => ({ ...prev, unread: prev.unread - 1 }));
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedMessage) {
      console.log('❌ Reply validation failed:', { replyText: replyText.trim(), selectedMessage: !!selectedMessage });
      return;
    }
    
    console.log('🔄 Starting reply process:', { messageId: selectedMessage.id, replyText: replyText.trim() });
    setReplying(true);
    
    try {
      console.log('📤 Calling adminService.replyToMessage...');
      const response = await adminService.replyToMessage(selectedMessage.id, replyText);
      console.log('📥 Reply response received:', response);
      
      if (response.success) {
        console.log('✅ Reply successful, updating local state...');
        // Update local state with admin response
        setMessages(prev => prev.map(msg => 
          msg.id === selectedMessage.id ? { 
            ...msg, 
            status: 'replied',
            admin_response: replyText,
            responded_at: new Date().toISOString()
          } : msg
        ));
        
        // Update stats
        setStats(prev => ({ ...prev, sent: prev.sent + 1 }));
        
        // Clear reply and close modal
        setReplyText('');
        setSelectedMessage(null);
        
        console.log('✅ Reply sent successfully');
      } else {
        console.error('❌ Failed to send reply:', response.message);
        alert(`Failed to send reply: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Error sending reply:', error);
      alert(`Error sending reply: ${error.message}`);
    } finally {
      setReplying(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'unread': return <FaClock style={{ color: '#f59e0b' }} />;
      case 'read': return <FaEye style={{ color: '#6b7280' }} />;
      case 'replied': return <FaCheck style={{ color: '#10b981' }} />;
      case 'closed': return <FaTimes style={{ color: '#ef4444' }} />;
      default: return <FaEnvelope style={{ color: '#6b7280' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unread': return '#f59e0b';
      case 'read': return '#6b7280';
      case 'replied': return '#10b981';
      case 'closed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'normal': return '#6b7280';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'tour': return '🗺️';
      case 'story': return '📖';
      case 'gallery': return '📸';
      case 'feedback': return '💬';
      default: return '📧';
    }
  };

  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{
          fontSize: 'var(--text-4xl)',
          fontWeight: '800',
          color: 'var(--gray-900)',
          margin: 0,
          marginBottom: 'var(--space-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)'
        }}>
          <FaEnvelope style={{ color: 'var(--primary-teal)' }} />
          Communications Hub
        </h1>
        <p style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--gray-600)',
          margin: 0
        }}>
          Manage messages, notifications, and communication campaigns.
        </p>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-8)'
      }}>
        {[
          { label: 'Unread Messages', value: stats.unread || '0', icon: FaInbox, color: 'var(--primary-teal)' },
          { label: 'Sent Today', value: stats.sent || '0', icon: FaPaperPlane, color: 'var(--primary-blue)' },
          { label: 'Active Campaigns', value: stats.campaigns || '0', icon: FaBell, color: 'var(--accent-teal)' }
        ].map((metric, index) => (
          <div key={index} style={{
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--gray-200)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-md)',
            transition: 'all var(--transition-base)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-4px)';
            e.target.style.boxShadow = 'var(--shadow-lg)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'var(--shadow-md)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: `${metric.color}20`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <metric.icon style={{ fontSize: 'var(--text-xl)', color: metric.color }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: '800',
                  color: 'var(--gray-900)',
                  margin: 0,
                  lineHeight: 1
                }}>
                  {metric.value}
                </h3>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--gray-600)',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {metric.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--gradient-card)',
        borderRadius: 'var(--radius-2xl)',
        border: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--gray-200)',
          background: 'rgba(0, 191, 174, 0.02)'
        }}>
          <h2 style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: 0
          }}>
            Recent Messages
          </h2>
        </div>
        
        <div style={{ padding: 0 }}>
          {messages.length === 0 ? (
            <div style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
              color: 'var(--gray-600)'
            }}>
              <FaInbox style={{
                fontSize: 'var(--text-4xl)',
                marginBottom: 'var(--space-4)',
                opacity: 0.5
              }} />
              <p style={{ margin: 0, fontSize: 'var(--text-base)' }}>
                No messages yet
              </p>
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} style={{
                padding: 'var(--space-5)',
                borderBottom: '1px solid var(--gray-100)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: message.status === 'unread' ? 'rgba(0, 191, 174, 0.02)' : 'white',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer'
              }}
              onClick={() => handleViewMessage(message)}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--gray-50)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = message.status === 'unread' ? 'rgba(0, 191, 174, 0.02)' : 'white';
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: message.status === 'unread' ? 'var(--primary-teal)20' : 'var(--gray-100)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-lg)',
                    color: message.status === 'unread' ? 'var(--primary-teal)' : 'var(--gray-500)'
                  }}>
                    {getServiceIcon(message.service_type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <h4 style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: '600',
                        color: 'var(--gray-900)',
                        margin: 0,
                        flex: 1
                      }}>
                        {message.subject}
                      </h4>
                      {message.urgency && message.urgency !== 'normal' && (
                        <span style={{
                          fontSize: 'var(--text-xs)',
                          color: getUrgencyColor(message.urgency),
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          background: `${getUrgencyColor(message.urgency)}20`,
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {message.urgency}
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--gray-600)',
                      margin: 0,
                      marginBottom: '2px'
                    }}>
                      From: {message.sender_name} ({message.sender_email})
                    </p>
                    {message.message && (
                      <p style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--gray-500)',
                        margin: 0,
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {message.message.length > 80 ? `${message.message.substring(0, 80)}...` : message.message}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  textAlign: 'right'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                  }}>
                    {getStatusIcon(message.status || 'unread')}
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: getStatusColor(message.status || 'unread'),
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {message.status || 'unread'}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--gray-500)',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatDate(message.created_at)}
                  </span>
                  {message.status === 'unread' && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: 'var(--primary-teal)',
                      borderRadius: '50%'
                    }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Message Modal */}
      {selectedMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--space-4)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-6)',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-4)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--gray-200)'
            }}>
              <h3 style={{
                fontSize: 'var(--text-xl)',
                fontWeight: '700',
                color: 'var(--gray-900)',
                margin: 0
              }}>
                {selectedMessage.subject}
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 'var(--text-xl)',
                  color: 'var(--gray-500)',
                  cursor: 'pointer',
                  padding: 'var(--space-2)'
                }}
              >
                <FaTimes />
              </button>
            </div>
            
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-3)'
              }}>
                <div>
                  <p style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--gray-600)',
                    margin: 0,
                    marginBottom: 'var(--space-1)'
                  }}>
                    From: {selectedMessage.sender_name} ({selectedMessage.sender_email})
                  </p>
                  <p style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--gray-500)',
                    margin: 0
                  }}>
                    {formatDate(selectedMessage.created_at)}
                  </p>
                  {selectedMessage.service_type && (
                    <p style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--gray-500)',
                      margin: 0,
                      marginTop: 'var(--space-1)'
                    }}>
                      Service: {selectedMessage.service_type} {getServiceIcon(selectedMessage.service_type)}
                    </p>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)'
                }}>
                  {selectedMessage.urgency && selectedMessage.urgency !== 'normal' && (
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: getUrgencyColor(selectedMessage.urgency),
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      background: `${getUrgencyColor(selectedMessage.urgency)}20`,
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      {selectedMessage.urgency}
                    </span>
                  )}
                  {getStatusIcon(selectedMessage.status || 'unread')}
                  <span style={{
                    fontSize: 'var(--text-xs)',
                    color: getStatusColor(selectedMessage.status || 'unread'),
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {selectedMessage.status || 'unread'}
                  </span>
                </div>
              </div>
              
              <div style={{
                background: 'var(--gray-50)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-4)'
              }}>
                <h4 style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: '600',
                  color: 'var(--gray-700)',
                  margin: 0,
                  marginBottom: 'var(--space-2)'
                }}>
                  Message:
                </h4>
                <p style={{
                  fontSize: 'var(--text-base)',
                  color: 'var(--gray-800)',
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedMessage.message || 'No message content available'}
                </p>
              </div>

              {/* Admin Response Section */}
              {selectedMessage.admin_response && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 'var(--space-4)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <FaCheck style={{ color: 'var(--primary-teal)' }} />
                    <h4 style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: '600',
                      color: 'var(--primary-teal)',
                      margin: 0
                    }}>
                      Admin Response
                    </h4>
                    {selectedMessage.responded_at && (
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--gray-500)',
                        marginLeft: 'auto'
                      }}>
                        {formatDate(selectedMessage.responded_at)}
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--gray-800)',
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedMessage.admin_response}
                  </p>
                </div>
              )}
            </div>
            
            {/* Reply Section */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 'var(--text-sm)',
                fontWeight: '600',
                color: 'var(--gray-700)',
                marginBottom: 'var(--space-2)'
              }}>
                Reply to {selectedMessage.sender_name}:
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--gray-300)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--text-base)',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: 'var(--space-4)'
                }}
              />
              
              <div style={{
                display: 'flex',
                gap: 'var(--space-3)',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setSelectedMessage(null)}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || replying}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: replyText.trim() && !replying ? 'var(--primary-teal)' : 'var(--gray-300)',
                    color: replyText.trim() && !replying ? 'white' : 'var(--gray-500)',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: '600',
                    cursor: replyText.trim() && !replying ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                  }}
                >
                  {replying ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaReply />
                      Send Reply
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationsHub; 