import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createContractFromRequest } from '../api/contractApi';
import './ContractForm.css';

const ContractForm = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    serviceId: '',
    pricing: {
      basePrice: 0,
      additionalServices: [],
      totalPrice: 0,
      deposit: 0,
      balance: 0
    },
    paymentMethod: {
      type: 'cash',
      details: {}
    },
    terms: {
      liability: 'Standard moving liability coverage',
      cancellation: '24-hour notice required for cancellation',
      additionalTerms: ''
    }
  });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load available services
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      // This would be replaced with actual API call
      const mockServices = [
        { _id: '1', name: 'Local Move', price: 500 },
        { _id: '2', name: 'Long Distance Move', price: 1500 },
        { _id: '3', name: 'Commercial Move', price: 800 }
      ];
      setServices(mockServices);
    } catch (err) {
      setError('Failed to load services');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAdditionalServiceChange = (index, field, value) => {
    const newServices = [...formData.pricing.additionalServices];
    newServices[index] = {
      ...newServices[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        additionalServices: newServices
      }
    }));
  };

  const addAdditionalService = () => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        additionalServices: [
          ...prev.pricing.additionalServices,
          { service: '', price: 0 }
        ]
      }
    }));
  };

  const removeAdditionalService = (index) => {
    const newServices = formData.pricing.additionalServices.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        additionalServices: newServices
      }
    }));
  };

  const calculateTotal = () => {
    const basePrice = formData.pricing.basePrice || 0;
    const additionalTotal = formData.pricing.additionalServices.reduce((sum, service) => 
      sum + (service.price || 0), 0
    );
    const total = basePrice + additionalTotal;
    const balance = total - (formData.pricing.deposit || 0);
    
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        totalPrice: total,
        balance: balance
      }
    }));
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.pricing.basePrice, formData.pricing.additionalServices, formData.pricing.deposit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createContractFromRequest(requestId, formData);
      navigate('/manager/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contract-form-container">
      <div className="contract-form-header">
        <h1>Create Contract</h1>
        <p>Fill in the contract details for the approved request</p>
      </div>

      <form onSubmit={handleSubmit} className="contract-form">
        {error && <div className="error-message">{error}</div>}

        {/* Service Selection */}
        <div className="form-group">
          <label htmlFor="serviceId">Service Type *</label>
          <select
            id="serviceId"
            name="serviceId"
            value={formData.serviceId}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a service</option>
            {services.map(service => (
              <option key={service._id} value={service._id}>
                {service.name} - ${service.price}
              </option>
            ))}
          </select>
        </div>

        {/* Pricing Section */}
        <div className="form-section">
          <h3>Pricing Details</h3>
          
          <div className="form-group">
            <label htmlFor="pricing.basePrice">Base Price ($)</label>
            <input
              type="number"
              id="pricing.basePrice"
              name="pricing.basePrice"
              value={formData.pricing.basePrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Additional Services */}
          <div className="additional-services">
            <h4>Additional Services</h4>
            {formData.pricing.additionalServices.map((service, index) => (
              <div key={index} className="additional-service-item">
                <input
                  type="text"
                  placeholder="Service name"
                  value={service.service}
                  onChange={(e) => handleAdditionalServiceChange(index, 'service', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={service.price}
                  onChange={(e) => handleAdditionalServiceChange(index, 'price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
                <button
                  type="button"
                  onClick={() => removeAdditionalService(index)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addAdditionalService}
              className="add-service-btn"
            >
              Add Service
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="pricing.deposit">Deposit ($)</label>
            <input
              type="number"
              id="pricing.deposit"
              name="pricing.deposit"
              value={formData.pricing.deposit}
              onChange={handleInputChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="pricing-summary">
            <div className="summary-item">
              <span>Base Price:</span>
              <span>${formData.pricing.basePrice}</span>
            </div>
            <div className="summary-item">
              <span>Additional Services:</span>
              <span>${formData.pricing.additionalServices.reduce((sum, service) => sum + (service.price || 0), 0)}</span>
            </div>
            <div className="summary-item total">
              <span>Total:</span>
              <span>${formData.pricing.totalPrice}</span>
            </div>
            <div className="summary-item">
              <span>Deposit:</span>
              <span>${formData.pricing.deposit}</span>
            </div>
            <div className="summary-item balance">
              <span>Balance:</span>
              <span>${formData.pricing.balance}</span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="form-section">
          <h3>Payment Method</h3>
          <div className="form-group">
            <label htmlFor="paymentMethod.type">Payment Type</label>
            <select
              id="paymentMethod.type"
              name="paymentMethod.type"
              value={formData.paymentMethod.type}
              onChange={handleInputChange}
            >
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
            </select>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="form-section">
          <h3>Terms and Conditions</h3>
          
          <div className="form-group">
            <label htmlFor="terms.liability">Liability Coverage</label>
            <textarea
              id="terms.liability"
              name="terms.liability"
              value={formData.terms.liability}
              onChange={handleInputChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="terms.cancellation">Cancellation Policy</label>
            <textarea
              id="terms.cancellation"
              name="terms.cancellation"
              value={formData.terms.cancellation}
              onChange={handleInputChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="terms.additionalTerms">Additional Terms</label>
            <textarea
              id="terms.additionalTerms"
              name="terms.additionalTerms"
              value={formData.terms.additionalTerms}
              onChange={handleInputChange}
              rows="4"
              placeholder="Any additional terms and conditions..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/manager/dashboard')}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Creating...' : 'Create Contract'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;
