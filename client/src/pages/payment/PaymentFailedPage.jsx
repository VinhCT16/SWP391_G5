import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PaymentFailedPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const message = searchParams.get('message') || 'Thanh toán thất bại';
  const requestId = searchParams.get('requestId');

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>❌</div>
        <h1 style={{ 
          color: '#f44336', 
          marginBottom: '16px',
          fontSize: '32px'
        }}>
          Thanh toán thất bại
        </h1>
        <p style={{ 
          color: '#666', 
          marginBottom: '24px',
          fontSize: '18px'
        }}>
          {decodeURIComponent(message)}
        </p>
        
        {requestId && (
          <div style={{
            background: '#fff3cd',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#856404'
          }}>
            <p style={{ margin: 0 }}>
              <strong>Request ID:</strong> {requestId}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              Bạn có thể thử thanh toán lại từ trang chi tiết yêu cầu.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {requestId && (
            <button
              onClick={() => navigate(`/requests/${requestId}/detail`)}
              style={{
                padding: '12px 24px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Thử lại thanh toán
            </button>
          )}
          <button
            onClick={() => navigate('/my-requests')}
            style={{
              padding: '12px 24px',
              background: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Về danh sách yêu cầu
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

