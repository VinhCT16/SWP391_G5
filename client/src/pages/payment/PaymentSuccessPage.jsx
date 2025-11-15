import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getRequest } from '../../api/requestApi';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestId = searchParams.get('requestId');
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const data = await getRequest(requestId);
      setRequest(data);
    } catch (err) {
      console.error('Error loading request:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>✅</div>
        <h1 style={{ 
          color: '#4caf50', 
          marginBottom: '16px',
          fontSize: '32px'
        }}>
          Thanh toán thành công!
        </h1>
        <p style={{ 
          color: '#666', 
          marginBottom: '24px',
          fontSize: '18px'
        }}>
          Cảm ơn bạn đã thanh toán. Giao dịch của bạn đã được xử lý thành công.
        </p>
        
        {request && (
          <div style={{
            background: '#f5f5f5',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Thông tin giao dịch:</h3>
            <p><strong>Request ID:</strong> {request.requestId || request._id}</p>
            <p><strong>Trạng thái:</strong> 
              <span style={{ 
                color: '#4caf50', 
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                Đã thanh toán
              </span>
            </p>
            {request.vnpayTransaction && (
              <>
                <p><strong>Mã giao dịch:</strong> {request.vnpayTransaction.transactionId}</p>
                <p><strong>Số tiền:</strong> {request.vnpayTransaction.amount?.toLocaleString('vi-VN')} ₫</p>
              </>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/my-requests')}
            style={{
              padding: '12px 24px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Xem yêu cầu của tôi
          </button>
          <button
            onClick={() => navigate('/customer-dashboard')}
            style={{
              padding: '12px 24px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Về Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

