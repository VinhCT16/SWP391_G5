import React from 'react';
import Modal from '../../../components/shared/Modal';
import StatusBadge from '../../../components/shared/StatusBadge';
import adminApi from '../../../api/adminApi';
import { useState, useEffect } from 'react';

export default function CustomerDetailsModal({ customer, customerComplaints, onClose }) {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer && customer._id) {
      // Only load if we don't have full customer data
      if (!customerData || customerData.customer?._id !== customer._id) {
        loadCustomerData();
      }
    }
  }, [customer]);

  const loadCustomerData = async () => {
    if (!customer?._id) return;
    
    try {
      setLoading(true);
      const response = await adminApi.getCustomerById(customer._id);
      setCustomerData(response.data);
    } catch (err) {
      console.error('Error loading customer data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Use customerData if available, otherwise try to use customer directly
  const displayData = customerData || (customer && customer.customer ? customer : null);
  if (!displayData) return null;

  const complaints = customerComplaints || [];
  const hasComplaints = complaints.length > 0;

  return (
    <Modal isOpen={true} onClose={onClose} title="Customer Details" size="large">
      <div style={{ padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
                Basic Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <strong>Name:</strong> {displayData.customer?.name || 'N/A'}
                </div>
                <div>
                  <strong>Email:</strong> {displayData.customer?.email || 'N/A'}
                </div>
                <div>
                  <strong>Phone:</strong> {displayData.customer?.phone || 'N/A'}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <span style={{ marginLeft: '8px' }}>
                    <StatusBadge status={displayData.customer?.isActive ? 'active' : 'locked'} />
                  </span>
                </div>
                <div>
                  <strong>Total Requests:</strong> {displayData.totalRequests || 0}
                </div>
                <div>
                  <strong>Total Reviews:</strong> {displayData.totalReviews || 0}
                </div>
                {displayData.customer?.createdAt && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Created:</strong> {new Date(displayData.customer.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {displayData.profile && (
              <>
                {displayData.profile.requestHistory && displayData.profile.requestHistory.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
                      Request History ({displayData.profile.requestHistory.length})
                    </h3>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {displayData.profile.requestHistory.map((req, idx) => (
                        <div key={idx} style={{
                          padding: '10px',
                          marginBottom: '10px',
                          background: '#f8f9fa',
                          borderRadius: '4px'
                        }}>
                          <div><strong>Request ID:</strong> {req.requestId?.toString().substring(0, 8) || 'N/A'}</div>
                          <div><strong>Status:</strong> {req.status || 'N/A'}</div>
                          {req.createdAt && (
                            <div><strong>Created:</strong> {new Date(req.createdAt).toLocaleDateString()}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {displayData.profile.reviews && displayData.profile.reviews.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
                      Reviews ({displayData.profile.reviews.length})
                    </h3>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {displayData.profile.reviews.map((review, idx) => (
                        <div key={idx} style={{
                          padding: '10px',
                          marginBottom: '10px',
                          background: '#f8f9fa',
                          borderRadius: '4px'
                        }}>
                          <div><strong>Rating:</strong> {review.rating}/5</div>
                          <div><strong>Content:</strong> {review.content || 'N/A'}</div>
                          {review.createdAt && (
                            <div><strong>Created:</strong> {new Date(review.createdAt).toLocaleDateString()}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {hasComplaints && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#333', marginBottom: '15px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
                  Complaints ({complaints.length})
                </h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Subject</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Priority</th>
                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((complaint) => (
                        <tr key={complaint._id}>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                            {complaint.subject}
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                            <StatusBadge status={complaint.status} />
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              background: complaint.priority === 'urgent' ? '#f5c6cb' : 
                                         complaint.priority === 'high' ? '#f8d7da' :
                                         complaint.priority === 'medium' ? '#fff3cd' : '#e9ecef'
                            }}>
                              {complaint.priority}
                            </span>
                          </td>
                          <td style={{ padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!hasComplaints && customerComplaints !== undefined && (
              <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px', textAlign: 'center' }}>
                No complaints found for this customer.
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

