import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

export default function ServiceModal({ isOpen, onClose, onSubmit, service, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (service) {
        // Edit mode
        setFormData({
          name: service.name || '',
          price: service.price || ''
        });
      } else {
        // Add mode
        setFormData({
          name: '',
          price: ''
        });
      }
    }
  }, [isOpen, service]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const serviceData = {
      name: formData.name.trim(),
      price: Number(formData.price)
    };
    await onSubmit(serviceData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service ? "Edit Service" : "Add New Service"}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Service Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="e.g., Local Move, Long Distance Move"
          />
        </div>
        <div className="form-group">
          <label htmlFor="price">Base Price (VND) *</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="1000"
            className="form-input"
            placeholder="e.g., 500000"
          />
          <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            This price will be used as the default base price when creating contracts (in VND)
          </small>
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : (service ? 'Update' : 'Create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

