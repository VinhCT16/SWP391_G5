import React, { useState, useEffect } from 'react';
import Button from '../../../components/shared/Button';
import ServiceModal from '../../../components/dashboard/ServiceModal';
import { getAllServices, createService, updateService, deleteService } from '../../../api/contractApi';

export default function ServicesTab() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllServices();
      setServices(response.services || response.data?.services || []);
    } catch (err) {
      console.error('Error loading services:', err);
      setError(err.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteService(serviceId);
      await loadServices();
    } catch (err) {
      setError(err.message || 'Failed to delete service');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (serviceData) => {
    try {
      setLoading(true);
      setError(null);

      if (editingService) {
        // Update existing service
        await updateService(editingService._id, serviceData);
      } else {
        // Create new service
        await createService(serviceData);
      }

      setShowModal(false);
      setEditingService(null);
      await loadServices();
    } catch (err) {
      setError(err.message || `Failed to ${editingService ? 'update' : 'create'} service`);
      throw err; // Re-throw to prevent modal from closing
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-section">
      <div className="management-header">
        <h2>Service Management</h2>
        <Button onClick={handleAddService}>Add New Service</Button>
      </div>

      {error && (
        <div className="error-message" style={{ 
          padding: '12px', 
          background: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {loading && !services.length ? (
        <div className="loading-state">Loading services...</div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Base Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length > 0 ? (
                services.map(service => (
                  <tr key={service._id || service.id}>
                    <td>
                      <strong>{service.name}</strong>
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#007bff' 
                      }}>
                        {new Intl.NumberFormat('vi-VN').format(service.price || 0)} đ
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                        <Button
                          variant="info"
                          size="small"
                          onClick={() => handleEditService(service)}
                          disabled={loading}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDeleteService(service._id || service.id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No services found. Click "Add New Service" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ServiceModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingService(null);
        }}
        onSubmit={handleSubmit}
        service={editingService}
        loading={loading}
      />
    </div>
  );
}

