# Admin Features Documentation

## Tổng quan
Hệ thống đã được cập nhật để hỗ trợ role **Admin** với đầy đủ các chức năng quản lý tài khoản người dùng.

## Các chức năng Admin

### 1. Quản lý tài khoản người dùng

#### Customer Management:
- ✅ Xem danh sách khách hàng đăng ký
- ✅ Cập nhật hoặc khóa tài khoản vi phạm
- ✅ Hỗ trợ xử lý khiếu nại, phản hồi
- ✅ Quản lý thông tin khách hàng (tên, số điện thoại)
- ✅ Theo dõi hoạt động khách hàng (số review, request)

#### Manager/Staff Management:
- ✅ Thêm mới, chỉnh sửa, xóa tài khoản nhân viên
- ✅ Phân quyền (staff, quản lý kho, điều phối viên...)
- ✅ Theo dõi hoạt động và hiệu suất làm việc

### 2. API Endpoints

#### User Management:
```
GET    /api/admin/users              - Lấy danh sách users (có phân trang, filter)
GET    /api/admin/users/stats        - Thống kê users
GET    /api/admin/users/:userId      - Lấy thông tin user cụ thể
POST   /api/admin/users              - Tạo user mới
PUT    /api/admin/users/:userId      - Cập nhật user
PUT    /api/admin/users/:userId/toggle-status - Khóa/mở khóa tài khoản
PUT    /api/admin/users/:userId/reset-password - Reset mật khẩu
DELETE /api/admin/users/:userId      - Xóa user
```

#### Customer Management:
```
GET    /api/admin/customers          - Lấy danh sách khách hàng (có phân trang, filter)
GET    /api/admin/customers/stats    - Thống kê khách hàng
GET    /api/admin/customers/:customerId - Lấy thông tin khách hàng cụ thể
PUT    /api/admin/customers/:customerId - Cập nhật thông tin khách hàng
```

#### Complaint Management:
```
GET    /api/admin/complaints         - Lấy danh sách khiếu nại (có phân trang, filter)
GET    /api/admin/complaints/stats   - Thống kê khiếu nại
PUT    /api/admin/complaints/:complaintId - Xử lý khiếu nại (respond, resolve, close)
```

#### Admin Profile:
```
POST   /api/auth/create-admin        - Tạo admin profile
```

### 3. Database Models

#### User Model (đã cập nhật):
- Thêm role "admin" vào enum
- Thêm field isActive để quản lý trạng thái tài khoản

#### Admin Model (mới):
- userId: Reference đến User
- adminId: ID quản trị viên
- department: Phòng ban
- permissions: Các quyền chi tiết
- isActive: Trạng thái hoạt động
- lastLogin: Lần đăng nhập cuối

#### Complaint Model (mới):
- complaintId: ID khiếu nại
- customerId: Reference đến User (khách hàng)
- customerName: Tên khách hàng
- customerEmail: Email khách hàng
- subject: Tiêu đề khiếu nại
- description: Mô tả chi tiết
- status: Trạng thái (pending, in_progress, resolved, closed)
- priority: Mức độ ưu tiên (low, medium, high, urgent)
- category: Loại khiếu nại (service_quality, billing, technical, general, other)
- adminResponse: Phản hồi từ admin
- adminNotes: Ghi chú nội bộ
- resolution: Thông tin giải quyết
- attachments: File đính kèm

### 4. Frontend Components

#### AdminDashboard.jsx:
- **Overview Tab**: Thống kê tổng quan, biểu đồ users theo role, thống kê khách hàng và khiếu nại
- **User Management Tab**: Quản lý users với filter, search, pagination
- **Customer Management Tab**: Quản lý khách hàng với filter, search, pagination, khóa/mở khóa tài khoản
- **Complaint Management Tab**: Quản lý khiếu nại với filter theo status, priority, category, xử lý khiếu nại
- **Staff Management Tab**: Quản lý nhân viên (có thể mở rộng)
- **Settings Tab**: Cài đặt hệ thống (có thể mở rộng)

#### Tính năng UI:
- Responsive design
- Real-time filtering và search
- Pagination cho danh sách users, customers, complaints
- Toggle lock/unlock tài khoản khách hàng
- Edit thông tin khách hàng (tên, số điện thoại)
- Xử lý khiếu nại (respond, resolve, close)
- Status và priority badges với màu sắc phân biệt
- Role-based access control

### 5. Security Features

#### Authentication & Authorization:
- Middleware `requireAdmin` cho các route admin
- Middleware `requireAdminOrManager` cho các chức năng chung
- JWT token validation
- Role-based route protection

#### Data Protection:
- Password hashing với bcrypt
- Sensitive data filtering (không trả về password)
- Input validation và sanitization

### 6. Cách sử dụng

#### Tạo Admin Account:
1. Đăng ký user với role "admin"
2. Tạo admin profile với endpoint `/api/auth/create-admin`
3. Đăng nhập và truy cập `/admin-dashboard`

#### Quản lý Users:
1. Vào Admin Dashboard
2. Chọn tab "User Management"
3. Sử dụng filter để tìm kiếm users
4. Thực hiện các thao tác: view, edit, lock/unlock, delete

### 7. Cấu trúc Files

#### Backend:
```
server/
├── models/
│   ├── User.js (updated)
│   ├── Admin.js (new)
│   ├── Customer.js (existing)
│   └── Complaint.js (new)
├── controllers/
│   └── adminController.js (updated)
├── routes/
│   ├── auth.js (updated)
│   └── adminRoutes.js (updated)
└── utils/
    └── authMiddleware.js (updated)
```

#### Frontend:
```
client/src/
├── api/
│   └── adminApi.js (updated)
├── pages/
│   ├── AdminDashboard.jsx (updated)
│   └── AdminDashboard.css (updated)
├── components/
│   ├── Navigation.jsx (updated)
│   └── DashboardRedirect.jsx (updated)
└── App.js (updated)
```

### 8. Mở rộng trong tương lai

#### Có thể thêm:
- Audit logs cho các thao tác admin
- Email notifications khi có thay đổi
- Advanced reporting và analytics
- Bulk operations (import/export users)
- Advanced permission system
- System settings management
- Activity monitoring dashboard

### 9. Testing

Để test các chức năng admin:
1. Tạo user với role admin
2. Tạo admin profile
3. Đăng nhập và truy cập admin dashboard
4. Test các chức năng CRUD users
5. Test filtering và search
6. Test lock/unlock functionality

### 10. Lưu ý

- Tất cả admin routes đều yêu cầu authentication
- Admin có quyền cao nhất trong hệ thống
- Cần cẩn thận khi xóa users (có thể ảnh hưởng đến data liên quan)
- Nên backup database trước khi thực hiện các thao tác quan trọng
