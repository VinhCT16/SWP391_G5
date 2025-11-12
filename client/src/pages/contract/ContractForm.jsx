import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createContractFromRequest, getAllServices } from '../../api/contractApi';
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

  const loadDefaultServices = () => {
    const mockServices = [
      { _id: '1', name: 'Local Move', price: 500 },
      { _id: '2', name: 'Long Distance Move', price: 1500 },
      { _id: '3', name: 'Commercial Move', price: 800 }
    ];
    setServices(mockServices);
    setError('Failed to load services from server. Using default services. Note: These services may not exist in the database.');
  };

  const loadServices = async () => {
    try {
      console.log('Loading services from API...');
      const response = await getAllServices();
      console.log('Services API response:', response);
      console.log('Services data:', response?.data);
      
      if (response && response.data) {
        if (response.data.services && Array.isArray(response.data.services)) {
          if (response.data.services.length > 0) {
            setServices(response.data.services);
            console.log(`✅ Loaded ${response.data.services.length} services from server`);
            // Clear error if successful
            setError('');
            return;
          } else {
            console.warn('No services found in database, using default services');
            loadDefaultServices();
            return;
          }
        } else {
          console.warn('Invalid response format - services is not an array:', response.data);
          loadDefaultServices();
          return;
        }
      } else {
        console.warn('Invalid response format - no data property:', response);
        loadDefaultServices();
        return;
      }
    } catch (err) {
      console.error('❌ Failed to load services:', err);
      console.error('Error response:', err.response);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        message: err.response?.data?.message || err.message,
        data: err.response?.data,
        url: err.config?.url,
        method: err.config?.method
      });
      
      // Check if it's an auth error
      if (err.response?.status === 401) {
        setError('Authentication error: Session expired. Please login again.');
        // Don't use default services for auth errors
        return;
      } else if (err.response?.status === 403) {
        setError('Access denied: You do not have permission to access services.');
        return;
      } else if (err.response?.status === 404) {
        setError('Services endpoint not found. Please check server configuration.');
        loadDefaultServices();
        return;
      } else if (err.response?.status >= 500) {
        setError('Server error while loading services. Using default services.');
        loadDefaultServices();
        return;
      } else if (!err.response) {
        // Network error or server not reachable
        setError('Cannot connect to server. Using default services.');
        console.error('Network error - server may be down or unreachable');
        loadDefaultServices();
        return;
      } else {
        setError(`Error loading services: ${err.response?.data?.message || err.message}. Using default services.`);
        loadDefaultServices();
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'serviceId') {
      // Auto-fill base price when service is selected
      const selectedService = services.find(s => s._id === value);
      setFormData(prev => ({
        ...prev,
        serviceId: value,
        pricing: {
          ...prev.pricing,
          basePrice: selectedService ? selectedService.price : prev.pricing.basePrice
        }
      }));
    } else if (name.includes('.')) {
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

  const calculateTotal = useCallback(() => {
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
  }, [formData.pricing.basePrice, formData.pricing.additionalServices, formData.pricing.deposit]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.serviceId) {
      setError('Please select a service type');
      setLoading(false);
      return;
    }

    if (!formData.pricing.basePrice || formData.pricing.basePrice <= 0) {
      setError('Base price must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      // Prepare contract data with all required fields
      const contractData = {
        serviceId: formData.serviceId,
        pricing: {
          basePrice: Number(formData.pricing.basePrice),
          additionalServices: formData.pricing.additionalServices || [],
          totalPrice: Number(formData.pricing.totalPrice),
          deposit: Number(formData.pricing.deposit) || 0,
          balance: Number(formData.pricing.balance) || 0
        },
        paymentMethod: {
          type: formData.paymentMethod.type,
          details: formData.paymentMethod.details || {}
        },
        terms: {
          liability: formData.terms.liability || 'Standard moving liability coverage',
          cancellation: formData.terms.cancellation || '24-hour notice required for cancellation',
          additionalTerms: formData.terms.additionalTerms || ''
        }
      };

      const res = await createContractFromRequest(requestId, contractData);
      const newId = res?.data?.contract?.id;
      if (newId) {
        navigate(`/contracts/${newId}`);
      } else {
        navigate('/manager-dashboard');
      }
    } catch (err) {
      console.error('Error creating contract:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        message: err.response?.data?.message,
        data: err.response?.data,
        details: err.response?.data?.details
      });
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        const errorMsg = err.response?.data?.message || 'Unauthorized access';
        setError(`${errorMsg}. Please login again.`);
        
        // Redirect to login after showing error
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else if (err.response?.status === 403) {
        const errorMsg = err.response?.data?.message || 'Access denied';
        const details = err.response?.data?.details;
        
        let fullErrorMsg = errorMsg;
        if (details) {
          fullErrorMsg += ` (User ID: ${details.userId}, Role: ${details.userRole || 'unknown'})`;
        }
        fullErrorMsg += '. Please ensure you are logged in as a manager and have completed your manager profile setup.';
        
        setError(fullErrorMsg);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to create contract');
      }
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
