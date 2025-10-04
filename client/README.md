# 🚚 Moving Service Review System

Hệ thống đánh giá dịch vụ chuyển nhà với giao diện đẹp và chuyên nghiệp.

## ✨ Tính năng chính

### 🎨 Giao diện hiện đại
- **Design System**: Sử dụng Tailwind CSS với custom components
- **Animations**: Framer Motion cho hiệu ứng mượt mà
- **Icons**: Lucide React icons đẹp và nhất quán
- **Responsive**: Tối ưu cho mọi thiết bị

### 📊 Dashboard thống kê
- Tổng quan đánh giá khách hàng
- Phân bố rating theo sao
- Thống kê theo tháng
- Tỷ lệ hài lòng

### 🔍 Tìm kiếm và lọc
- Tìm kiếm theo email khách hàng
- Tìm kiếm theo nội dung đánh giá
- Lọc theo rating (1-5 sao)
- Giao diện tìm kiếm thân thiện

### 📱 Layout chuyên nghiệp
- **Header**: Logo, navigation, thông tin liên hệ
- **Sidebar**: Menu điều hướng với icons
- **Footer**: Thông tin công ty, dịch vụ
- **Mobile**: Responsive design cho mobile

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 16+
- npm hoặc yarn
- MongoDB

### Cài đặt dependencies
```bash
# Frontend
cd client
npm install --legacy-peer-deps

# Backend
cd server
npm install
```

### Chạy ứng dụng
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm start
```

Truy cập: `http://localhost:3000`

## 📁 Cấu trúc dự án

```
client/src/
├── components/
│   ├── Layout.jsx          # Layout chính với header, sidebar, footer
│   ├── ReviewCard.jsx     # Card hiển thị đánh giá
│   ├── Dashboard.jsx      # Dashboard thống kê
│   ├── UI.jsx            # Components UI cơ bản
│   └── Common.jsx         # Components tái sử dụng
├── pages/
│   ├── Homepage.js        # Trang chủ hiển thị tất cả đánh giá
│   ├── CustomerReview.js  # Trang đánh giá khách hàng
│   └── ManagerReview.js   # Trang quản lý đánh giá
├── api/
│   └── reviewApi.js       # API calls
└── index.css              # Custom CSS và Tailwind
```

## 🎯 Các trang chính

### 1. **Trang chủ** (`/`)
- Hiển thị tất cả đánh giá
- Thống kê tổng quan
- Tìm kiếm và lọc
- Phân bố rating

### 2. **Đánh giá khách hàng** (`/customer-review`)
- Form tạo đánh giá mới
- Chỉnh sửa đánh giá
- Xóa đánh giá

### 3. **Quản lý đánh giá** (`/manager-review`)
- Quản lý tất cả đánh giá
- Thống kê chi tiết
- Xuất báo cáo

## 🎨 Design System

### Colors
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)
- **Purple**: Purple (#8B5CF6)

### Components
- **Cards**: Rounded corners, shadows, hover effects
- **Buttons**: Multiple variants với animations
- **Inputs**: Focus states, validation styles
- **Loading**: Skeleton loaders, spinners

### Animations
- **Fade In**: Opacity transitions
- **Slide**: Transform animations
- **Hover**: Scale và color transitions
- **Loading**: Rotating spinners

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Collapsible sidebar
- Touch-friendly buttons
- Optimized layouts
- Fast loading

## 🔧 Customization

### Thay đổi màu sắc
Chỉnh sửa trong `src/index.css`:
```css
:root {
  --primary-color: #3B82F6;
  --secondary-color: #10B981;
}
```

### Thêm animations
Sử dụng Framer Motion:
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

### Custom components
Tạo components mới trong `src/components/`:
```jsx
export function MyComponent() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      {/* Content */}
    </div>
  );
}
```

## 🚀 Deployment

### Build production
```bash
npm run build
```

### Deploy với Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy với Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

## 📈 Performance

### Optimizations
- **Code Splitting**: Lazy loading components
- **Image Optimization**: WebP format
- **Bundle Size**: Tree shaking, minification
- **Caching**: Service worker

### Metrics
- **Lighthouse Score**: 90+
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 📞 Support

- **Email**: support@movingservice.com
- **Phone**: 1900-1234
- **Website**: https://movingservice.com

---

**Made with ❤️ by Moving Service Team**