import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaSearch, FaFilter, FaClock, FaUser, FaCalendar } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const StoryModeration = ({ adminService }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    published: 0,
    rejected: 0,
    recent_week: 0
  });

  useEffect(() => {
    loadSubmissions();
    loadStats();
  }, [currentPage, statusFilter, searchTerm]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = await adminService.getStorySubmissions({
        page: currentPage,
        per_page: 10,
        status: statusFilter,
        search: searchTerm
      });

      if (response.success) {
        setSubmissions(response.data || []);
        setTotalPages(response.meta?.pages || 1);
      } else {
        toast.error(response.message || 'Failed to load submissions');
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await adminService.getStorySubmissionStats();
      if (response.success) {
        setStats(response.stats || {});
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleApprove = async (submissionId, adminNotes = '') => {
    try {
      const response = await adminService.approveStorySubmission(submissionId, adminNotes);
      if (response.success) {
        toast.success('Story approved and published!');
        loadSubmissions();
        loadStats();
        setShowModal(false);
      } else {
        toast.error(response.message || 'Failed to approve story');
      }
    } catch (error) {
      console.error('Error approving story:', error);
      toast.error('Failed to approve story');
    }
  };

  const handleReject = async (submissionId, rejectionReason, adminNotes = '') => {
    try {
      const response = await adminService.rejectStorySubmission(submissionId, rejectionReason, adminNotes);
      if (response.success) {
        toast.success('Story rejected');
        loadSubmissions();
        loadStats();
        setShowModal(false);
      } else {
        toast.error(response.message || 'Failed to reject story');
      }
    } catch (error) {
      console.error('Error rejecting story:', error);
      toast.error('Failed to reject story');
    }
  };

  const openModal = (submission) => {
    setSelectedSubmission(submission);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSubmission(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#f59e0b', bg: '#fef3c7', text: 'Pending Review' },
      published: { color: '#10b981', bg: '#d1fae5', text: 'Published' },
      rejected: { color: '#ef4444', bg: '#fee2e2', text: 'Rejected' },
      draft: { color: '#6b7280', bg: '#f3f4f6', text: 'Draft' }
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: config.color,
        backgroundColor: config.bg
      }}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0
          }}>
            Story Moderation
          </h1>
          <p style={{
            color: '#6b7280',
            margin: '0.5rem 0 0 0'
          }}>
            Review and moderate user story submissions
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#dbeafe',
              color: '#2563eb'
            }}>
              <FaClock />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Pending</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#dcfce7',
              color: '#16a34a'
            }}>
              <FaCheck />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Published</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                {stats.published}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#fee2e2',
              color: '#dc2626'
            }}>
              <FaTimes />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Rejected</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                {stats.rejected}
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              background: '#f3f4f6',
              color: '#374151'
            }}>
              <FaUser />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Total</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                {stats.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            placeholder="Search stories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            background: 'white'
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Submissions Table */}
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Loading submissions...
          </div>
        ) : submissions.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            No submissions found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Story
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Author
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Submitted
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <h3 style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {submission.title}
                        </h3>
                        <p style={{
                          margin: 0,
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {submission.content?.substring(0, 100)}...
                        </p>
                        <div style={{
                          marginTop: '0.5rem',
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          alignItems: 'center'
                        }}>
                          {/* Language Badge */}
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            background: submission.language === 'it' ? '#dcfce7' : '#dbeafe',
                            color: submission.language === 'it' ? '#16a34a' : '#2563eb',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            {submission.language === 'it' ? '🇮🇹 IT' : '🇺🇸 EN'}
                          </span>
                          
                          {/* Tags */}
                          {submission.tags?.map((tag, index) => (
                            <span key={index} style={{
                              padding: '0.125rem 0.5rem',
                              background: '#f3f4f6',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              color: '#374151'
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaUser style={{ color: '#6b7280', fontSize: '0.875rem' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {submission.author?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(submission.status)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaCalendar style={{ color: '#6b7280', fontSize: '0.875rem' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {formatDate(submission.submitted_at)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => openModal(submission)}
                          style={{
                            padding: '0.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <FaEye />
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? '#f3f4f6' : 'white',
              color: currentPage === 1 ? '#9ca3af' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Previous
          </button>
          
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === totalPages ? '#f3f4f6' : 'white',
              color: currentPage === totalPages ? '#9ca3af' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedSubmission && (
        <StoryReviewModal
          submission={selectedSubmission}
          onClose={closeModal}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

// Story Review Modal Component
const StoryReviewModal = ({ submission, onClose, onApprove, onReject }) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = () => {
    onApprove(submission.id, adminNotes);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    onReject(submission.id, rejectionReason, adminNotes);
  };

  return (
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
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.75rem',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Review Story Submission
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Story Details */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              {submission.title}
            </h3>
            
            <div style={{
              background: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <p style={{
                margin: 0,
                lineHeight: '1.6',
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {submission.content}
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <strong style={{ color: '#374151' }}>Author:</strong>
                <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                  {submission.author?.name || 'Unknown'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#374151' }}>Category:</strong>
                <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                  {submission.category}
                </span>
              </div>
              <div>
                <strong style={{ color: '#374151' }}>Language:</strong>
                <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                  {submission.language === 'it' ? '🇮🇹 Italiano' : '🇺🇸 English'}
                </span>
              </div>
              <div>
                <strong style={{ color: '#374151' }}>Submitted:</strong>
                <span style={{ marginLeft: '0.5rem', color: '#6b7280' }}>
                  {new Date(submission.submitted_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {submission.tags && submission.tags.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong style={{ color: '#374151' }}>Tags:</strong>
                <div style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {submission.tags.map((tag, index) => (
                    <span key={index} style={{
                      padding: '0.25rem 0.75rem',
                      background: '#e5e7eb',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Admin Notes (Optional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any notes about this submission..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                resize: 'vertical',
                minHeight: '100px'
              }}
            />
          </div>

          {/* Rejection Reason (if rejecting) */}
          {showRejectForm && (
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejection..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  minHeight: '100px'
                }}
              />
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            
            {!showRejectForm ? (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaTimes />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaCheck />
                  Approve & Publish
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowRejectForm(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel Rejection
                </button>
                <button
                  onClick={handleReject}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaTimes />
                  Confirm Rejection
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryModeration;
