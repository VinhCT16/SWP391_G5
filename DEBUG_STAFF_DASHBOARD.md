# 🐛 DEBUG: Staff Dashboard Không Hiển Thị Requests

## ✅ Đã sửa

1. **Route POST `/api/requests`** - Bây giờ cho phép set `status` và `surveyFee` khi tạo request
2. **Model Request** - Đã thêm field `surveyFee`
3. **Thêm logging** - Cả client và server để debug dễ hơn

## 🔍 Cách kiểm tra

### Bước 1: Tạo request với status UNDER_SURVEY

**Cách 1: Từ Customer Flow (UI)**
1. Vào `http://localhost:3000/requests/new`
2. Điền form đầy đủ
3. Chọn "Gọi nhân viên khảo sát nhà"
4. Click "Tiếp tục"
5. **Kiểm tra console của browser** - Xem request có được tạo với status `UNDER_SURVEY` không

**Cách 2: Dùng file HTML**
1. Mở `create_test_requests.html` trong browser
2. Click "Tạo Request 1"
3. **Kiểm tra console** - Xem response

**Cách 3: Dùng API trực tiếp**
```bash
POST http://localhost:3001/api/requests
Content-Type: application/json

{
  "customerName": "Test Customer",
  "customerPhone": "0912345678",
  "pickupAddress": {
    "province": { "code": "01", "name": "Thành phố Hà Nội" },
    "district": { "code": "001", "name": "Quận Ba Đình" },
    "ward": { "code": "00001", "name": "Phường Phúc Xá" },
    "street": "Số 123 Đường ABC"
  },
  "pickupLocation": { "lat": 21.0285, "lng": 105.8542 },
  "deliveryAddress": {
    "province": { "code": "01", "name": "Thành phố Hà Nội" },
    "district": { "code": "002", "name": "Quận Hoàn Kiếm" },
    "ward": { "code": "00010", "name": "Phường Hàng Bông" },
    "street": "Số 456 Đường XYZ"
  },
  "deliveryLocation": { "lat": 21.0245, "lng": 105.8412 },
  "movingTime": "2025-12-25T10:00:00Z",
  "status": "UNDER_SURVEY",
  "surveyFee": 15000
}
```

### Bước 2: Kiểm tra API Staff Tasks

Mở trong browser hoặc Postman:
```
GET http://localhost:3001/api/requests/staff/tasks
```

**Kỳ vọng:** Trả về mảng requests có status `UNDER_SURVEY`, `WAITING_PAYMENT`, `IN_PROGRESS`, hoặc `DONE`

**Kiểm tra server console:**
- Xem log: `🔍 [Staff Tasks] Query: ...`
- Xem log: `📊 [Staff Tasks] Tìm thấy X requests`
- Xem log: `📋 [Staff Tasks] Status của requests: ...`

### Bước 3: Kiểm tra Staff Dashboard

1. Vào `http://localhost:3000/staff/dashboard`
2. **Mở Browser Console (F12)**
3. **Kiểm tra logs:**
   - `🔄 Đang load staff tasks...`
   - `✅ Nhận được data: ...`
   - `📊 Số lượng requests: X`
   - `📋 Status của requests: ...`

### Bước 4: Kiểm tra Request trong Database

Nếu vẫn không thấy, kiểm tra trực tiếp trong MongoDB:

```javascript
// Trong MongoDB shell hoặc Compass
db.request.find({ status: "UNDER_SURVEY" })
```

## 🐛 Các lỗi thường gặp

### Lỗi 1: Request không được tạo với status UNDER_SURVEY

**Nguyên nhân:** Route POST không nhận `status` từ body (đã sửa)

**Giải pháp:** Đảm bảo khi tạo request, gửi `status: "UNDER_SURVEY"` trong body

### Lỗi 2: API `/api/requests/staff/tasks` trả về mảng rỗng

**Nguyên nhân:** 
- Không có request nào với status phù hợp
- Query MongoDB sai

**Giải pháp:**
- Kiểm tra server console logs
- Kiểm tra database trực tiếp
- Đảm bảo request có status trong: `["UNDER_SURVEY", "WAITING_PAYMENT", "IN_PROGRESS", "DONE"]`

### Lỗi 3: CORS hoặc Network Error

**Nguyên nhân:** Frontend không gọi được API

**Giải pháp:**
- Kiểm tra `REACT_APP_API_URL` trong `.env`
- Kiểm tra server có chạy ở port 3001 không
- Kiểm tra CORS settings trong server

## 📝 Checklist Debug

- [ ] Server đang chạy ở port 3001
- [ ] Client đang chạy ở port 3000
- [ ] Request được tạo với status `UNDER_SURVEY` (kiểm tra response)
- [ ] API `/api/requests/staff/tasks` trả về requests (kiểm tra response)
- [ ] Browser console không có lỗi
- [ ] Server console có logs về query và kết quả

## 🔧 Nếu vẫn không hoạt động

1. **Restart server:**
   ```bash
   cd server
   npm start
   ```

2. **Restart client:**
   ```bash
   cd client
   npm start
   ```

3. **Clear browser cache và reload**

4. **Kiểm tra MongoDB connection:**
   - Đảm bảo MongoDB đang chạy
   - Kiểm tra connection string trong `.env`

5. **Kiểm tra logs chi tiết:**
   - Server console: Xem có lỗi gì không
   - Browser console: Xem có lỗi network hoặc CORS không

