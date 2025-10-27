import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock contract data
  const mockContracts = [
    {
      _id: '1',
      contractNumber: 'CON-2024-001',
      requestId: 'REQ-001',
      customerName: 'Nguyễn Văn A',
      customerPhone: '0123456789',
      serviceType: 'Chuyển nhà nội thành',
      status: 'DRAFT',
      totalAmount: 2500000,
      createdAt: '2024-01-10T10:00:00Z',
      address: {
        from: '123 Đường ABC, Quận 1, TP.HCM',
        to: '456 Đường XYZ, Quận 3, TP.HCM'
      },
      movingDate: '2024-01-15T08:00:00Z'
    },
    {
      _id: '2',
      contractNumber: 'CON-2024-002',
      requestId: 'REQ-002',
      customerName: 'Trần Thị B',
      customerPhone: '0987654321',
      serviceType: 'Chuyển nhà liên tỉnh',
      status: 'ISSUED',
      totalAmount: 5000000,
      createdAt: '2024-01-12T14:30:00Z',
      address: {
        from: '789 Đường DEF, Quận 2, TP.HCM',
        to: '321 Đường GHI, Quận 7, TP.HCM'
      },
      movingDate: '2024-01-20T09:00:00Z'
    },
    {
      _id: '3',
      contractNumber: 'CON-2024-003',
      requestId: 'REQ-003',
      customerName: 'Lê Văn C',
      customerPhone: '0555666777',
      serviceType: 'Chuyển văn phòng',
      status: 'ACCEPTED',
      totalAmount: 8000000,
      createdAt: '2024-01-14T16:45:00Z',
      address: {
        from: '555 Đường JKL, Quận 4, TP.HCM',
        to: '777 Đường MNO, Quận 5, TP.HCM'
      },
      movingDate: '2024-01-25T10:00:00Z'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setContracts(mockContracts);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'ISSUED': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'ISSUED': return 'Đã phát hành';
      case 'ACCEPTED': return 'Đã chấp nhận';
      case 'REJECTED': return 'Đã từ chối';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesFilter = filter === 'all' || contract.status === filter;
    const matchesSearch = !searchTerm || 
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customerPhone.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="ml-3 text-gray-600">Đang tải hợp đồng...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackButton fallbackPath="/" />
      
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📄 Quản lý hợp đồng
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Xem và quản lý các hợp đồng dịch vụ chuyển nhà
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng hợp đồng</p>
              <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Đã chấp nhận</p>
              <p className="text-2xl font-bold text-gray-900">
                {contracts.filter(c => c.status === 'ACCEPTED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
              <p className="text-2xl font-bold text-gray-900">
                {contracts.filter(c => ['DRAFT', 'ISSUED'].includes(c.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng giá trị</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(contracts.reduce((sum, c) => sum + c.totalAmount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm theo số hợp đồng, tên khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">🔽</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="ISSUED">Đã phát hành</option>
              <option value="ACCEPTED">Đã chấp nhận</option>
              <option value="REJECTED">Đã từ chối</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="space-y-6">
        {filteredContracts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {searchTerm || filter !== "all" 
                ? "Không tìm thấy hợp đồng phù hợp với bộ lọc" 
                : "Chưa có hợp đồng nào"
              }
            </div>
            <p className="text-gray-400">
              {searchTerm || filter !== "all" 
                ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc" 
                : "Hợp đồng sẽ được tạo khi có yêu cầu chuyển nhà được duyệt"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredContracts.map((contract) => (
              <div key={contract._id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contract.contractNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Yêu cầu: {contract.requestId}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                    {getStatusText(contract.status)}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Khách hàng:</span>
                    <span className="font-medium">{contract.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SĐT:</span>
                    <span className="font-medium">{contract.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dịch vụ:</span>
                    <span className="font-medium">{contract.serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày chuyển:</span>
                    <span className="font-medium">{formatDate(contract.movingDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="font-bold text-green-600">{formatCurrency(contract.totalAmount)}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Từ:</strong> {contract.address.from}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    <strong>Đến:</strong> {contract.address.to}
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Xem chi tiết
                    </button>
                    {contract.status === 'DRAFT' && (
                      <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                        Phát hành
                      </button>
                    )}
                    {contract.status === 'ISSUED' && (
                      <button className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm">
                        Chấp nhận
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động nhanh</h3>
        <div className="flex gap-4 flex-wrap">
          <Link to="/requests" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            📋 Xem yêu cầu
          </Link>
          <Link to="/dashboard" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
            📊 Báo cáo
          </Link>
          <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
            📄 Tạo hợp đồng mới
          </button>
        </div>
      </div>
    </div>
  );
}
