import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCustomerContracts, getContractProgress } from '../api/contractApi';
import BackButton from '../components/BackButton';

const CustomerProgressTracking = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load customer contracts
  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await getCustomerContracts();
      setContracts(response.data.contracts || []);
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  // Load contract progress
  const loadContractProgress = async (contractId) => {
    try {
      setLoading(true);
      const response = await getContractProgress(contractId);
      setProgress(response.data);
    } catch (err) {
      console.error('Error loading progress:', err);
      setError('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  // Handle contract selection
  const handleContractSelect = (contract) => {
    setSelectedContract(contract);
    loadContractProgress(contract._id);
  };

  // Load contracts on component mount
  useEffect(() => {
    loadContracts();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#ff9800';
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'signed': return '#2196f3';
      case 'active': return '#9c27b0';
      case 'in_progress': return '#ff5722';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'assigned': return '📋';
      case 'in-progress': return '🔄';
      case 'blocked': return '🚫';
      case 'overdue': return '⚠️';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📝';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <BackButton fallbackPath="/customer-dashboard" />
      
      <h1>Contract Progress Tracking</h1>
      <p>Track the progress of your moving contracts and tasks</p>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Contracts List */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: 'fit-content'
        }}>
          <h3>Your Contracts</h3>
          {loading ? (
            <p>Loading contracts...</p>
          ) : contracts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contracts.map((contract) => (
                <div
                  key={contract._id}
                  onClick={() => handleContractSelect(contract)}
                  style={{
                    padding: '15px',
                    border: selectedContract?._id === contract._id ? '2px solid #007bff' : '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedContract?._id === contract._id ? '#f8f9fa' : 'white',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong>Contract #{contract.contractId}</strong>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: getStatusColor(contract.status) + '20',
                      color: getStatusColor(contract.status)
                    }}>
                      {contract.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <p><strong>From:</strong> {contract.moveDetails?.fromAddress}</p>
                    <p><strong>To:</strong> {contract.moveDetails?.toAddress}</p>
                    <p><strong>Date:</strong> {new Date(contract.moveDetails?.moveDate).toLocaleDateString()}</p>
                    <p><strong>Total:</strong> ${contract.pricing?.totalPrice}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No contracts found</p>
          )}
        </div>

        {/* Progress Details */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {selectedContract ? (
            <>
              <h3>Progress Details</h3>
              {progress ? (
                <div>
                  {/* Overall Progress */}
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h4>Overall Progress</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                      <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: `conic-gradient(#007bff ${progress.progress.progressPercentage * 3.6}deg, #e9ecef 0deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#007bff'
                      }}>
                        {progress.progress.progressPercentage}%
                      </div>
                      <div>
                        <p><strong>Status:</strong> {progress.progress.status}</p>
                        <p><strong>Completed Tasks:</strong> {progress.progress.completedTasks} / {progress.progress.totalTasks}</p>
                        <p><strong>Contract ID:</strong> {selectedContract.contractId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Task Details */}
                  {progress.request?.tasks && progress.request.tasks.length > 0 && (
                    <div>
                      <h4>Task Breakdown</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {progress.request.tasks.map((task, index) => (
                          <div
                            key={task.taskId || index}
                            style={{
                              padding: '15px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              backgroundColor: '#f8f9fa'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>{getTaskStatusIcon(task.status)}</span>
                                <strong>{task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}</strong>
                              </div>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor: getStatusColor(task.status) + '20',
                                color: getStatusColor(task.status)
                              }}>
                                {task.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              <p><strong>Priority:</strong> {task.priority}</p>
                              <p><strong>Estimated Duration:</strong> {task.estimatedDuration} hours</p>
                              {task.description && <p><strong>Description:</strong> {task.description}</p>}
                              {task.assignedStaff && <p><strong>Assigned Staff:</strong> {task.assignedStaff.name}</p>}
                              {task.deadline && <p><strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>Loading progress details...</p>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <h3>Select a Contract</h3>
              <p>Choose a contract from the list to view its progress</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProgressTracking;

