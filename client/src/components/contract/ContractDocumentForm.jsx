import React from 'react';
import './ContractDocumentForm.css';

const ContractDocumentForm = ({ contract, onManagerSign, onCustomerSign, userRole }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const managerName = contract.managerId?.userId?.name || 'Manager Name';
  const customerName = contract.customerId?.name || 'Customer Name';
  const managerEmail = contract.managerId?.userId?.email || '';
  const customerEmail = contract.customerId?.email || '';
  const customerPhone = contract.customerId?.phone || '';

  const canManagerSign = userRole === 'manager' && 
    (contract.status === 'approved' || contract.status === 'pending_approval') && 
    !contract.signatures?.managerSigned;

  const canCustomerSign = userRole === 'customer' && 
    (contract.status === 'approved' || contract.status === 'pending_approval') && 
    !contract.signatures?.customerSigned;

  return (
    <div className="contract-document-container">
      <div className="contract-document">
        {/* Header */}
        <div className="contract-header-section">
          <h1 className="contract-title">MOVING SERVICE CONTRACT</h1>
          <div className="contract-id">Contract ID: {contract.contractId}</div>
          <div className="contract-date">Date: {formatDate(contract.createdAt)}</div>
        </div>

        {/* Parties Information */}
        <div className="contract-section">
          <h2 className="section-title">PARTIES</h2>
          <div className="parties-grid">
            <div className="party-info">
              <h3>CUSTOMER</h3>
              <p className="party-name"><strong>{customerName}</strong></p>
              <p className="party-detail">Email: {customerEmail}</p>
              {customerPhone && <p className="party-detail">Phone: {customerPhone}</p>}
            </div>
            <div className="party-info">
              <h3>MANAGER</h3>
              <p className="party-name"><strong>{managerName}</strong></p>
              {managerEmail && <p className="party-detail">Email: {managerEmail}</p>}
              {contract.managerId?.employeeId && (
                <p className="party-detail">Employee ID: {contract.managerId.employeeId}</p>
              )}
              {contract.managerId?.department && (
                <p className="party-detail">Department: {contract.managerId.department}</p>
              )}
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="contract-section">
          <h2 className="section-title">SERVICE DETAILS</h2>
          <div className="service-details">
            <div className="detail-row">
              <span className="detail-label">Service Type:</span>
              <span className="detail-value">{contract.serviceId?.name || contract.moveDetails?.serviceType}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Move Date:</span>
              <span className="detail-value">{formatDate(contract.moveDetails?.moveDate)}</span>
            </div>
          </div>
        </div>

        {/* Move Details */}
        <div className="contract-section">
          <h2 className="section-title">MOVE DETAILS</h2>
          <div className="move-addresses">
            <div className="address-block">
              <h3>Origin Address</h3>
              <p>{contract.moveDetails?.fromAddress}</p>
            </div>
            <div className="address-block">
              <h3>Destination Address</h3>
              <p>{contract.moveDetails?.toAddress}</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="contract-section">
          <h2 className="section-title">PRICING</h2>
          <div className="pricing-table">
            <div className="pricing-row">
              <span className="pricing-label">Base Price:</span>
              <span className="pricing-value">{formatCurrency(contract.pricing?.basePrice)}</span>
            </div>
            {contract.pricing?.additionalServices && contract.pricing.additionalServices.length > 0 && (
              <>
                <div className="pricing-subheader">Additional Services:</div>
                {contract.pricing.additionalServices.map((service, index) => (
                  <div key={index} className="pricing-row indent">
                    <span className="pricing-label">{service.service}:</span>
                    <span className="pricing-value">{formatCurrency(service.price)}</span>
                  </div>
                ))}
              </>
            )}
            <div className="pricing-row total">
              <span className="pricing-label">Total Price:</span>
              <span className="pricing-value">{formatCurrency(contract.pricing?.totalPrice)}</span>
            </div>
            <div className="pricing-row">
              <span className="pricing-label">Deposit:</span>
              <span className="pricing-value">{formatCurrency(contract.pricing?.deposit)}</span>
            </div>
            <div className="pricing-row balance">
              <span className="pricing-label">Balance Due:</span>
              <span className="pricing-value">{formatCurrency(contract.pricing?.balance)}</span>
            </div>
          </div>
        </div>

        {/* Items List */}
        {contract.items && contract.items.length > 0 && (
          <div className="contract-section">
            <h2 className="section-title">ITEMS FOR TRANSPORTATION</h2>
            <div className="items-table">
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>#</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Quantity</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Value (VND)</th>
                    {contract.items.some(item => item.requiresSpecialHandling) && (
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Special Handling</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {contract.items.map((item, index) => (
                    <tr key={item.itemId || index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                      <td style={{ padding: '12px' }}>{item.description || 'N/A'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity || 1}</td>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>{item.category || 'other'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {item.estimatedValue ? formatCurrency(item.estimatedValue) : 'N/A'}
                      </td>
                      {contract.items.some(i => i.requiresSpecialHandling) && (
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {item.requiresSpecialHandling ? '⚠️ Yes' : '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="contract-section">
          <h2 className="section-title">PAYMENT METHOD</h2>
          <p className="payment-method">
            Payment Method: <strong>{contract.paymentMethod?.type?.replace('_', ' ').toUpperCase()}</strong>
          </p>
        </div>

        {/* Terms and Conditions */}
        <div className="contract-section">
          <h2 className="section-title">TERMS AND CONDITIONS</h2>
          <div className="terms-list">
            <div className="term-item">
              <h3>1. Liability Coverage</h3>
              <p>{contract.terms?.liability || 'Standard moving liability coverage as per industry standards.'}</p>
            </div>
            <div className="term-item">
              <h3>2. Cancellation Policy</h3>
              <p>{contract.terms?.cancellation || '24-hour notice required for cancellation. Cancellation fees may apply.'}</p>
            </div>
            {contract.terms?.additionalTerms && (
              <div className="term-item">
                <h3>3. Additional Terms</h3>
                <p>{contract.terms.additionalTerms}</p>
              </div>
            )}
          </div>
        </div>

        {/* Commitments */}
        <div className="contract-section">
          <h2 className="section-title">COMMITMENTS</h2>
          <div className="commitments-list">
            <div className="commitment-item">
              <h3>Customer Commitments:</h3>
              <ul>
                <li>Provide accurate information regarding items to be moved</li>
                <li>Ensure access to both origin and destination locations</li>
                <li>Be present or authorize representative at both locations</li>
                <li>Complete payment as per agreed schedule</li>
                <li>Notify of any changes at least 24 hours in advance</li>
              </ul>
            </div>
            <div className="commitment-item">
              <h3>Company Commitments:</h3>
              <ul>
                <li>Provide professional and qualified moving staff</li>
                <li>Handle all items with care and proper equipment</li>
                <li>Complete move within agreed timeframe</li>
                <li>Maintain appropriate insurance coverage</li>
                <li>Resolve any damages or issues in a timely manner</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Approval Information */}
        {contract.approval && contract.approval.approvedAt && (
          <div className="contract-section">
            <h2 className="section-title">APPROVAL INFORMATION</h2>
            <div className="approval-info">
              <p><strong>Approved Date:</strong> {formatDate(contract.approval.approvedAt)}</p>
              {contract.approval.notes && (
                <p><strong>Approval Notes:</strong> {contract.approval.notes}</p>
              )}
            </div>
          </div>
        )}

        {/* Signatures Section */}
        <div className="contract-section signatures-section">
          <h2 className="section-title">SIGNATURES</h2>
          <div className="signatures-grid">
            {/* Customer Signature */}
            <div className="signature-block">
              <div className="signature-field">
                {contract.signatures?.customerSigned ? (
                  <div className="signature-signed">
                    <div className="signature-line"></div>
                    <p className="signature-name">{customerName}</p>
                    <p className="signature-date">Signed: {formatDate(contract.signatures.signedAt)}</p>
                  </div>
                ) : (
                  <div className="signature-unsigned">
                    <div className="signature-line placeholder"></div>
                    <p className="signature-label">Customer Signature</p>
                    {canCustomerSign && (
                      <button 
                        className="sign-button"
                        onClick={onCustomerSign}
                      >
                        Sign as Customer
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="signature-title">Customer</p>
            </div>

            {/* Manager Signature */}
            <div className="signature-block">
              <div className="signature-field">
                {contract.signatures?.managerSigned ? (
                  <div className="signature-signed">
                    <div className="signature-line"></div>
                    <p className="signature-name">{managerName}</p>
                    <p className="signature-date">Signed: {formatDate(contract.signatures.signedAt)}</p>
                  </div>
                ) : (
                  <div className="signature-unsigned">
                    <div className="signature-line placeholder"></div>
                    <p className="signature-label">Manager Signature</p>
                    {canManagerSign && (
                      <button 
                        className="sign-button"
                        onClick={onManagerSign}
                      >
                        Sign as Manager
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="signature-title">Manager</p>
            </div>
          </div>

          {contract.signatures?.customerSigned && contract.signatures?.managerSigned && (
            <div className="contract-fully-signed">
              <p className="fully-signed-notice">
                ✓ This contract has been fully executed and signed by both parties on {formatDate(contract.signatures.signedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="contract-footer">
          <p>This contract is valid only when signed by both parties.</p>
          <p>For any questions, please contact the moving company.</p>
        </div>
      </div>
    </div>
  );
};

export default ContractDocumentForm;

