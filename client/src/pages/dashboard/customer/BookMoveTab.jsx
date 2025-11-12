import React, { useState } from 'react';
import { createRequest } from '../../../api/requestApi';
import Button from '../../../components/shared/Button';

export default function BookMoveTab({ user, onSuccess, loading, setLoading, error, setError }) {
  const [bookingForm, setBookingForm] = useState({
    fromAddress: '',
    toAddress: '',
    moveDate: '',
    serviceType: 'Local Move',
    phone: user?.phone || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const requestData = {
        moveDetails: {
          fromAddress: bookingForm.fromAddress,
          toAddress: bookingForm.toAddress,
          moveDate: bookingForm.moveDate,
          serviceType: bookingForm.serviceType,
          phone: bookingForm.phone
        },
        items: [],
        estimatedPrice: {
          basePrice: 0,
          additionalServices: [],
          totalPrice: 0
        }
      };

      await createRequest(requestData);
      
      setBookingForm({
        fromAddress: '',
        toAddress: '',
        moveDate: '',
        serviceType: 'Local Move',
        phone: user?.phone || ''
      });

      onSuccess?.();
      alert('Request submitted successfully!');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-section">
      <h2>Book Your Move</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <h3>Move Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Moving From</label>
              <input
                type="text"
                placeholder="Current address"
                value={bookingForm.fromAddress}
                onChange={(e) => setBookingForm({...bookingForm, fromAddress: e.target.value})}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Moving To</label>
              <input
                type="text"
                placeholder="Destination address"
                value={bookingForm.toAddress}
                onChange={(e) => setBookingForm({...bookingForm, toAddress: e.target.value})}
                required
                className="form-input"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Moving Date</label>
              <input
                type="date"
                value={bookingForm.moveDate}
                onChange={(e) => setBookingForm({...bookingForm, moveDate: e.target.value})}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Service Type</label>
              <select
                value={bookingForm.serviceType}
                onChange={(e) => setBookingForm({...bookingForm, serviceType: e.target.value})}
                className="form-select"
              >
                <option value="Local Move">Local Move</option>
                <option value="Long Distance">Long Distance</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <h3>Contact Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="Your phone number"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({...bookingForm, phone: e.target.value})}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={user?.email} readOnly className="form-input" />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: '20px' }}>
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </form>
    </div>
  );
}

