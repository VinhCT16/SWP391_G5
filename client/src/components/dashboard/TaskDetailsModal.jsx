import React from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import StatusBadge from '../shared/StatusBadge';

export default function TaskDetailsModal({ isOpen, onClose, task, onStart, onComplete }) {
  if (!task) return null;

  // Get task type display name
  const getTaskTypeName = (type) => {
    const types = {
      'packing': 'Packing',
      'loading': 'Loading',
      'transporting': 'Transporting',
      'unloading': 'Unloading',
      'unpacking': 'Unpacking',
      'review': 'Review/Survey'
    };
    return types[type] || type?.charAt(0).toUpperCase() + type?.slice(1) || 'N/A';
  };

  // Get priority display
  const getPriorityDisplay = (priority) => {
    const colors = {
      'high': { color: '#d32f2f', bg: '#ffebee' },
      'medium': { color: '#f57c00', bg: '#fff3e0' },
      'low': { color: '#388e3c', bg: '#e8f5e9' }
    };
    const style = colors[priority] || { color: '#666', bg: '#f5f5f5' };
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 600,
        color: style.color,
        backgroundColor: style.bg
      }}>
        {priority?.toUpperCase() || 'N/A'}
      </span>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="large">
      <div style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '12px',
        padding: '28px',
        margin: '-20px -30px',
        minHeight: '100%'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Task Basic Info */}
          <div style={{ 
            padding: '24px', 
            marginBottom: 0, 
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e3f2fd'
            }}>
              <span style={{ fontSize: '24px', marginRight: '12px' }}>📋</span>
              <h3 style={{ margin: 0, color: '#1976d2', fontSize: '18px', fontWeight: 600 }}>Task Information</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ 
                padding: '14px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #2196f3',
                transition: 'transform 0.2s ease'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Task Type</div>
                <div style={{ fontSize: '16px', color: '#333', fontWeight: 600 }}>{getTaskTypeName(task.taskType)}</div>
              </div>
              <div style={{ 
                padding: '14px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #4caf50'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                <div style={{ marginTop: '4px' }}><StatusBadge status={task.status} /></div>
              </div>
              <div style={{ 
                padding: '14px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #ff9800'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</div>
                <div style={{ marginTop: '4px' }}>{getPriorityDisplay(task.priority)}</div>
              </div>
              <div style={{ 
                padding: '14px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #9c27b0'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Request #</div>
                <div style={{ fontSize: '16px', color: '#333', fontWeight: 600 }}>{task.requestNumber || task.requestId || 'N/A'}</div>
              </div>
              <div style={{ 
                padding: '14px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #00bcd4'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</div>
                <div style={{ fontSize: '16px', color: '#333', fontWeight: 600 }}>{task.estimatedDuration ? `${task.estimatedDuration} hours` : 'N/A'}</div>
              </div>
              <div style={{ 
                padding: '14px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #e91e63'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Deadline</div>
                <div style={{ fontSize: '16px', color: '#333', fontWeight: 600 }}>
                  {task.deadline ? new Date(task.deadline).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
            {task.description && (
              <div style={{ 
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #607d8b'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div>
                <p style={{ margin: 0, color: '#333', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{task.description}</p>
              </div>
            )}
          </div>

          {/* Customer & Move Details */}
          {(task.customer || task.moveDetails) && (
            <div style={{ 
              padding: '24px', 
              marginBottom: 0, 
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '2px solid #e3f2fd'
              }}>
                <span style={{ fontSize: '24px', marginRight: '12px' }}>👤</span>
                <h3 style={{ margin: 0, color: '#1976d2', fontSize: '18px', fontWeight: 600 }}>Customer & Move Details</h3>
              </div>
              {task.customer && (
                <div style={{ 
                  marginBottom: '20px',
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #2196f3'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</div>
                  <div style={{ fontSize: '16px', color: '#333', fontWeight: 600 }}>
                    {task.customer?.name || 'N/A'}
                    {task.customer?.email && (
                      <span style={{ fontSize: '14px', color: '#666', fontWeight: 400, marginLeft: '8px' }}>
                        ({task.customer.email})
                      </span>
                    )}
                    {task.customer?.phone && (
                      <span style={{ fontSize: '14px', color: '#666', fontWeight: 400, marginLeft: '8px' }}>
                        - {task.customer.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {task.moveDetails && (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ 
                    padding: '14px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #4caf50'
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📍 From</div>
                    <div style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>
                      {task.moveDetails?.fromAddress || task.moveDetails?.pickupAddress || 'N/A'}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '14px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #ff9800'
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📍 To</div>
                    <div style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>
                      {task.moveDetails?.toAddress || task.moveDetails?.deliveryAddress || 'N/A'}
                    </div>
                  </div>
                  <div style={{ 
                    padding: '14px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #9c27b0'
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 Move Date</div>
                    <div style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>
                      {task.moveDetails?.moveDate 
                        ? new Date(task.moveDetails.moveDate).toLocaleDateString() 
                        : task.moveDetails?.movingTime
                        ? new Date(task.moveDetails.movingTime).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                  {task.moveDetails?.serviceType && (
                    <div style={{ 
                      padding: '14px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      borderLeft: '4px solid #00bcd4'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚚 Service Type</div>
                      <div style={{ fontSize: '15px', color: '#333', fontWeight: 500 }}>{task.moveDetails.serviceType}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {(task.managerNotes || task.customerNotes) && (
            <div style={{ 
              padding: '24px', 
              marginBottom: 0, 
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '2px solid #e3f2fd'
              }}>
                <span style={{ fontSize: '24px', marginRight: '12px' }}>📝</span>
                <h3 style={{ margin: 0, color: '#1976d2', fontSize: '18px', fontWeight: 600 }}>Notes</h3>
              </div>
              {task.managerNotes && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manager Notes</div>
                  <div style={{ 
                    color: '#333', 
                    whiteSpace: 'pre-wrap', 
                    padding: '16px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #ff9800',
                    lineHeight: '1.6'
                  }}>
                    {task.managerNotes}
                  </div>
                </div>
              )}
              {task.customerNotes && (
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer Notes</div>
                  <div style={{ 
                    color: '#333', 
                    whiteSpace: 'pre-wrap', 
                    padding: '16px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #4caf50',
                    lineHeight: '1.6'
                  }}>
                    {task.customerNotes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {Array.isArray(task?.attachments) && task.attachments.length > 0 && (
            <div style={{ 
              padding: '24px', 
              marginBottom: 0, 
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '2px solid #e3f2fd'
              }}>
                <span style={{ fontSize: '24px', marginRight: '12px' }}>📎</span>
                <h3 style={{ margin: 0, color: '#1976d2', fontSize: '18px', fontWeight: 600 }}>Attachments</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {task.attachments.map((att, idx) => (
                  <a 
                    key={idx}
                    href={att.url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      color: '#2196f3', 
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      transition: 'all 0.2s ease',
                      fontWeight: 500
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e3f2fd';
                      e.currentTarget.style.borderColor = '#2196f3';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>📎</span>
                    <span>{att.name || `Attachment ${idx+1}`}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px 24px', 
          borderRadius: '12px',
          marginTop: '20px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <Button 
            variant="secondary" 
            onClick={onClose}
            style={{
              padding: '10px 24px',
              fontSize: '15px',
              fontWeight: 600
            }}
          >
            Close
          </Button>
          {(task.status === 'pending' || task.status === 'assigned') && onStart && (
            <Button 
              variant="success" 
              onClick={() => { onClose(); onStart(task); }}
              style={{
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                border: 'none',
                boxShadow: '0 4px 6px rgba(76, 175, 80, 0.3)'
              }}
            >
              🚀 Start Task
            </Button>
          )}
          {task.status === 'in-progress' && onComplete && (
            <Button 
              variant="info" 
              onClick={() => { onClose(); onComplete(task); }}
              style={{
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                border: 'none',
                boxShadow: '0 4px 6px rgba(33, 150, 243, 0.3)'
              }}
            >
              ✅ Mark as Done
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

