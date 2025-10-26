import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getContractById, exportContractPDF } from '../api/contractApi';
import './CustomerContractView.css';

const CustomerContractView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      setLoading(true);
      const response = await getContractById(id);
      setContract(response.data.contract);
    } catch (err) {
      setError('Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await exportContractPDF(id);
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contract-${contract.contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export PDF');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { class: 'status-draft', text: 'Draft' },
      pending_approval: { class: 'status-pending', text: 'Pending Approval' },
      approved: { class: 'status-approved', text: 'Approved' },
      signed: { class: 'status-signed', text: 'Signed' },
      active: { class: 'status-active', text: 'Active' },
      completed: { class: 'status-completed', text: 'Completed' },
      cancelled: { class: 'status-cancelled', text: 'Cancelled' }
    };

    const config = statusConfig[status] || { class: 'status-default', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="contract-view-container">
        <div className="loading">Loading contract...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="contract-view-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/customer/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="contract-view-container">
        <div className="no-contract">
          <h2>Contract not found</h2>
          <button onClick={() => navigate('/customer/dashboard')} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-view-container">
      <div className="contract-view-header">
        <div className="header-content">
          <h1>Contract Details</h1>
          <p>Contract #{contract.contractId}</p>
        </div>
        <div className="header-actions">
          {getStatusBadge(contract.status)}
          <button onClick={handleExportPDF} className="export-btn">
            Export PDF
          </button>
        </div>
      </div>

      <div className="contract-content">
        {/* Contract Information */}
        <div className="contract-section">
          <h2>Contract Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Contract ID</label>
              <span>{contract.contractId}</span>
            </div>
            <div className="info-item">
              <label>Status</label>
              <span>{getStatusBadge(contract.status)}</span>
            </div>
            <div className="info-item">
              <label>Created Date</label>
              <span>{formatDate(contract.createdAt)}</span>
            </div>
            <div className="info-item">
              <label>Service Type</label>
              <span>{contract.serviceId?.name}</span>
            </div>
          </div>
        </div>

        {/* Move Details */}
        <div className="contract-section">
          <h2>Move Details</h2>
          <div className="move-details">
            <div className="address-section">
              <div className="address-item">
                <h3>From Address</h3>
                <p>{contract.moveDetails?.fromAddress}</p>
              </div>
              <div className="address-item">
                <h3>To Address</h3>
                <p>{contract.moveDetails?.toAddress}</p>
              </div>
            </div>
            <div className="move-info">
              <div className="info-item">
                <label>Move Date</label>
                <span>{formatDate(contract.moveDetails?.moveDate)}</span>
              </div>
              <div className="info-item">
                <label>Service Type</label>
                <span>{contract.moveDetails?.serviceType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Details */}
        <div className="contract-section">
          <h2>Pricing Details</h2>
          <div className="pricing-details">
            <div className="pricing-item">
              <label>Base Price</label>
              <span>{formatCurrency(contract.pricing?.basePrice || 0)}</span>
            </div>
            
            {contract.pricing?.additionalServices && contract.pricing.additionalServices.length > 0 && (
              <div className="additional-services">
                <h3>Additional Services</h3>
                {contract.pricing.additionalServices.map((service, index) => (
                  <div key={index} className="service-item">
                    <span>{service.service}</span>
                    <span>{formatCurrency(service.price)}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pricing-summary">
              <div className="summary-item">
                <label>Total Price</label>
                <span className="total-price">{formatCurrency(contract.pricing?.totalPrice || 0)}</span>
              </div>
              <div className="summary-item">
                <label>Deposit</label>
                <span>{formatCurrency(contract.pricing?.deposit || 0)}</span>
              </div>
              <div className="summary-item balance">
                <label>Balance Due</label>
                <span className="balance-amount">{formatCurrency(contract.pricing?.balance || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="contract-section">
          <h2>Payment Information</h2>
          <div className="payment-info">
            <div className="info-item">
              <label>Payment Method</label>
              <span>{contract.paymentMethod?.type?.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="contract-section">
          <h2>Terms and Conditions</h2>
          <div className="terms-content">
            <div className="term-item">
              <h3>Liability Coverage</h3>
              <p>{contract.terms?.liability}</p>
            </div>
            <div className="term-item">
              <h3>Cancellation Policy</h3>
              <p>{contract.terms?.cancellation}</p>
            </div>
            {contract.terms?.additionalTerms && (
              <div className="term-item">
                <h3>Additional Terms</h3>
                <p>{contract.terms.additionalTerms}</p>
              </div>
            )}
          </div>
        </div>

        {/* Approval Information */}
        {contract.approval && (
          <div className="contract-section">
            <h2>Approval Information</h2>
            <div className="approval-info">
              {contract.approval.approvedAt && (
                <div className="info-item">
                  <label>Approved Date</label>
                  <span>{formatDate(contract.approval.approvedAt)}</span>
                </div>
              )}
              {contract.approval.notes && (
                <div className="info-item">
                  <label>Approval Notes</label>
                  <span>{contract.approval.notes}</span>
                </div>
              )}
              {contract.approval.rejectionReason && (
                <div className="info-item">
                  <label>Rejection Reason</label>
                  <span className="rejection-reason">{contract.approval.rejectionReason}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signatures */}
        {contract.signatures && (
          <div className="contract-section">
            <h2>Signatures</h2>
            <div className="signatures-info">
              <div className="signature-item">
                <label>Customer Signed</label>
                <span className={contract.signatures.customerSigned ? 'signed' : 'not-signed'}>
                  {contract.signatures.customerSigned ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="signature-item">
                <label>Manager Signed</label>
                <span className={contract.signatures.managerSigned ? 'signed' : 'not-signed'}>
                  {contract.signatures.managerSigned ? 'Yes' : 'No'}
                </span>
              </div>
              {contract.signatures.signedAt && (
                <div className="signature-item">
                  <label>Signed Date</label>
                  <span>{formatDate(contract.signatures.signedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="contract-actions">
        <button onClick={() => navigate('/customer/dashboard')} className="back-btn">
          Back to Dashboard
        </button>
        {contract.status === 'approved' && !contract.signatures?.customerSigned && (
          <button className="sign-btn">
            Sign Contract
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomerContractView;
