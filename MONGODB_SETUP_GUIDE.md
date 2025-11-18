# Hướng Dẫn Thiết Lập MongoDB cho Hệ Thống SWP391_G5

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Cài Đặt MongoDB](#cài-đặt-mongodb)
3. [Tạo Database](#tạo-database)
4. [Cấu Hình Kết Nối](#cấu-hình-kết-nối)
5. [Cấu Trúc Database](#cấu-trúc-database)
6. [Kiểm Tra Kết Nối](#kiểm-tra-kết-nối)
7. [Troubleshooting](#troubleshooting)

---

## 📌 Tổng Quan

Hệ thống SWP391_G5 sử dụng **MongoDB** làm database chính. Database này lưu trữ tất cả dữ liệu của hệ thống quản lý dịch vụ chuyển nhà, bao gồm:
- Thông tin người dùng (users)
- Yêu cầu dịch vụ (requests)
- Hợp đồng (contracts)
- Nhiệm vụ (tasks)
- Đánh giá (reviews)
- Khiếu nại (complaints)
- Và các dữ liệu khác

---

## 🔧 Cài Đặt MongoDB

### Option 1: MongoDB Local (Máy Cục Bộ)

#### Windows:
1. Tải MongoDB Community Server từ: https://www.mongodb.com/try/download/community
2. Chọn version phù hợp với Windows
3. Chạy file installer và làm theo hướng dẫn
4. Chọn "Complete" installation
5. Chọn "Install MongoDB as a Service"
6. Hoàn tất cài đặt

#### macOS:
```bash
# Sử dụng Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option 2: MongoDB Atlas (Cloud - Khuyến Nghị)

1. Truy cập: https://www.mongodb.com/cloud/atlas
2. Đăng ký/Đăng nhập tài khoản
3. Tạo cluster mới (chọn Free tier M0)
4. Chọn cloud provider và region (gần nhất với bạn)
5. Đặt tên cluster (ví dụ: `swp391-cluster`)
6. Click "Create Cluster"

---

## 🗄️ Tạo Database

### Với MongoDB Local:

1. **Khởi động MongoDB:**
   ```bash
   # Windows (nếu đã cài như service, tự động chạy)
   # Hoặc chạy thủ công:
   mongod

   # macOS/Linux
   sudo systemctl start mongod
   # hoặc
   brew services start mongodb-community
   ```

2. **Kết nối MongoDB Shell:**
   ```bash
   mongosh
   ```

3. **Tạo database:**
   ```javascript
   use swp391_moving_service
   ```

4. **Tạo user (tùy chọn, cho bảo mật):**
   ```javascript
   db.createUser({
     user: "swp391_admin",
     pwd: "your_secure_password",
     roles: [{ role: "readWrite", db: "swp391_moving_service" }]
   })
   ```

### Với MongoDB Atlas:

1. **Tạo Database User:**
   - Vào tab "Database Access"
   - Click "Add New Database User"
   - Chọn "Password" authentication
   - Username: `swp391_admin`
   - Password: Tạo mật khẩu mạnh (lưu lại để dùng sau)
   - Database User Privileges: "Atlas admin" hoặc "Read and write to any database"
   - Click "Add User"

2. **Whitelist IP Address:**
   - Vào tab "Network Access"
   - Click "Add IP Address"
   - Chọn "Allow Access from Anywhere" (0.0.0.0/0) cho development
   - Hoặc thêm IP cụ thể của bạn cho production
   - Click "Confirm"

3. **Lấy Connection String:**
   - Vào tab "Database"
   - Click "Connect" trên cluster của bạn
   - Chọn "Connect your application"
   - Copy connection string (sẽ có dạng):
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

---

## ⚙️ Cấu Hình Kết Nối

### Bước 1: Tạo File .env

Trong thư mục `server/`, tạo file `.env` (nếu chưa có):

```bash
cd server
touch .env
```

### Bước 2: Cấu Hình Connection String

Mở file `.env` và thêm các biến môi trường sau:

#### Cho MongoDB Local:
```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/swp391_moving_service

# Hoặc nếu có authentication:
MONGO_URI=mongodb://swp391_admin:your_secure_password@localhost:27017/swp391_moving_service?authSource=admin
```

#### Cho MongoDB Atlas:
```env
# MongoDB Connection (thay <username> và <password> bằng thông tin thực tế)
MONGO_URI=mongodb+srv://swp391_admin:your_secure_password@cluster0.xxxxx.mongodb.net/swp391_moving_service?retryWrites=true&w=majority
```

**Lưu ý:** 
- Thay `swp391_admin` bằng username bạn đã tạo
- Thay `your_secure_password` bằng password bạn đã tạo
- Thay `cluster0.xxxxx.mongodb.net` bằng cluster URL của bạn
- Thay `swp391_moving_service` bằng tên database bạn muốn (hoặc để mặc định)

### Bước 3: Các Biến Môi Trường Khác

Thêm các biến môi trường cần thiết khác vào file `.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (cho CORS)
FRONTEND_URL=http://localhost:3001

# JWT Secret (tạo một chuỗi ngẫu nhiên mạnh)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# VNPay Configuration (nếu sử dụng)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3001/payment/success

# Email Configuration (nếu sử dụng)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Bước 4: Cài Đặt Dependencies

Đảm bảo đã cài đặt các packages cần thiết:

```bash
cd server
npm install
```

---

## 📊 Cấu Trúc Database

Hệ thống sẽ tự động tạo các collections sau khi chạy lần đầu:

### Collections Chính:

1. **users** - Người dùng (customer, manager, staff, admin)
2. **requests** - Yêu cầu dịch vụ chuyển nhà
3. **contracts** - Hợp đồng dịch vụ
4. **tasks** - Nhiệm vụ được giao cho staff
5. **reviews** - Đánh giá từ khách hàng
6. **complaints** - Khiếu nại từ khách hàng
7. **services** - Loại dịch vụ và giá
8. **quotes** - Báo giá dịch vụ
9. **requesthistories** - Lịch sử thay đổi trạng thái request

### Schema Chi Tiết:

Xem file `database_schema.dbml` để biết chi tiết về cấu trúc của từng collection.

---

## ✅ Kiểm Tra Kết Nối

### Bước 1: Khởi Động Server

```bash
cd server
npm run dev
```

### Bước 2: Kiểm Tra Logs

Nếu kết nối thành công, bạn sẽ thấy:
```
🔍 Database: Attempting to connect to MongoDB
🔍 Database: MONGO_URI configured: Yes
✅ MongoDB connected successfully
🚀 Server listening on port 3000
```

Nếu có lỗi, xem phần [Troubleshooting](#troubleshooting) bên dưới.

### Bước 3: Kiểm Tra Database (Tùy chọn)

#### Với MongoDB Local:
```bash
mongosh
use swp391_moving_service
show collections
```

#### Với MongoDB Atlas:
- Vào tab "Collections" trong MongoDB Atlas
- Kiểm tra xem các collections đã được tạo chưa

---

## 🔍 Troubleshooting

### Lỗi 1: "MONGO_URI is not configured"

**Nguyên nhân:** File `.env` không tồn tại hoặc thiếu biến `MONGO_URI`

**Giải pháp:**
1. Kiểm tra file `.env` có tồn tại trong thư mục `server/`
2. Đảm bảo có dòng `MONGO_URI=...`
3. Khởi động lại server

### Lỗi 2: "MongoServerError: Authentication failed"

**Nguyên nhân:** Username/password sai hoặc user chưa được tạo

**Giải pháp:**
- **MongoDB Local:** Tạo user trong MongoDB shell:
  ```javascript
  use admin
  db.createUser({
    user: "swp391_admin",
    pwd: "your_password",
    roles: [{ role: "readWrite", db: "swp391_moving_service" }]
  })
  ```
- **MongoDB Atlas:** Kiểm tra lại username/password trong connection string

### Lỗi 3: "MongoNetworkError: connect ECONNREFUSED"

**Nguyên nhân:** MongoDB service chưa chạy hoặc connection string sai

**Giải pháp:**
- **MongoDB Local:** 
  ```bash
  # Kiểm tra service có chạy không
  # Windows:
  services.msc (tìm MongoDB)
  
  # macOS:
  brew services list
  
  # Linux:
  sudo systemctl status mongod
  ```

- **MongoDB Atlas:** Kiểm tra IP whitelist đã thêm chưa

### Lỗi 4: "MongoServerError: IP not whitelisted" (Atlas)

**Nguyên nhân:** IP address của bạn chưa được whitelist trong MongoDB Atlas

**Giải pháp:**
1. Vào MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Chọn "Allow Access from Anywhere" (0.0.0.0/0) cho development
4. Hoặc thêm IP cụ thể của bạn

### Lỗi 5: "MongooseError: Operation `users.insertOne()` buffering timed out"

**Nguyên nhân:** Kết nối quá chậm hoặc timeout

**Giải pháp:**
1. Kiểm tra kết nối internet (nếu dùng Atlas)
2. Tăng timeout trong connection:
   ```javascript
   // Trong server/config/db.js, thêm options:
   await mongoose.connect(process.env.MONGO_URI, {
     useNewUrlParser: true,
     useUnifiedTopology: true,
     serverSelectionTimeoutMS: 5000, // 5 seconds
     socketTimeoutMS: 45000, // 45 seconds
   });
   ```

---

## 📝 Lưu Ý Quan Trọng

1. **Bảo Mật:**
   - **KHÔNG** commit file `.env` lên Git
   - File `.env` đã được thêm vào `.gitignore`
   - Sử dụng mật khẩu mạnh cho database user
   - Trong production, chỉ whitelist IP cụ thể (không dùng 0.0.0.0/0)

2. **Backup:**
   - Thường xuyên backup database
   - MongoDB Atlas có tính năng backup tự động (trả phí)
   - Với MongoDB local, sử dụng `mongodump` để backup

3. **Performance:**
   - Indexes đã được định nghĩa trong models
   - Hệ thống sẽ tự động tạo indexes khi chạy lần đầu
   - Kiểm tra indexes trong MongoDB Compass hoặc Atlas

4. **Development vs Production:**
   - Development: Có thể dùng MongoDB local hoặc Atlas free tier
   - Production: Nên dùng MongoDB Atlas với cluster có backup
   - Sử dụng connection string khác nhau cho mỗi môi trường

---

## 🛠️ Công Cụ Hỗ Trợ

### MongoDB Compass (GUI Tool)

1. Tải về: https://www.mongodb.com/products/compass
2. Cài đặt và mở ứng dụng
3. Kết nối với connection string của bạn
4. Quản lý database trực quan

### MongoDB Shell (mongosh)

Đã được cài đặt cùng với MongoDB, dùng để:
- Kiểm tra database
- Chạy queries
- Quản lý users

---

## 📚 Tài Liệu Tham Khảo

- MongoDB Documentation: https://docs.mongodb.com/
- Mongoose Documentation: https://mongoosejs.com/docs/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- MongoDB Compass: https://www.mongodb.com/products/compass

---

## ✅ Checklist Setup

- [ ] MongoDB đã được cài đặt (local hoặc Atlas)
- [ ] Database đã được tạo
- [ ] Database user đã được tạo (nếu cần)
- [ ] IP đã được whitelist (nếu dùng Atlas)
- [ ] File `.env` đã được tạo trong `server/`
- [ ] `MONGO_URI` đã được cấu hình trong `.env`
- [ ] Các biến môi trường khác đã được cấu hình
- [ ] Dependencies đã được cài đặt (`npm install`)
- [ ] Server đã khởi động thành công
- [ ] Kết nối database thành công (kiểm tra logs)

---

**Chúc bạn setup thành công! 🎉**

Nếu gặp vấn đề, hãy kiểm tra phần Troubleshooting hoặc xem logs chi tiết trong console.

