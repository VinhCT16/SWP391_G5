# MoveEase - Professional House Moving Service

A modern, full-stack web application for house moving services with user authentication and booking management.

## 🚚 Features

### Frontend (React)
- **Modern UI/UX**: Professional design with moving service branding
- **Landing Page**: Attractive homepage showcasing services and features
- **User Authentication**: Secure login and registration system
- **Customer Dashboard**: Manage moving requests and bookings
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Protected Routes**: Secure access to authenticated areas

### Backend (Node.js/Express)
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Integration**: User data storage with Mongoose ODM
- **Password Security**: bcrypt hashing for secure password storage
- **Cookie-based Sessions**: HttpOnly cookies for enhanced security
- **CORS Support**: Cross-origin resource sharing enabled
- **RESTful API**: Clean API endpoints for authentication

## 🎨 Design Features

- **Professional Branding**: MoveEase brand identity with gradient colors
- **Modern Color Scheme**: Purple/blue gradients (#667eea to #764ba2)
- **Smooth Animations**: Hover effects, transitions, and loading states
- **Mobile-First**: Responsive design that works on all devices
- **Accessibility**: Focus states, semantic HTML, and screen reader support

## 🛠️ Technology Stack

### Frontend
- React 19.1.1
- React Router DOM 6.27.0
- Axios 1.7.9
- Modern CSS with Flexbox/Grid
- Responsive design principles

### Backend
- Node.js with Express 5.1.0
- MongoDB with Mongoose 8.18.2
- JWT (jsonwebtoken 9.0.2)
- bcrypt 6.0.0 for password hashing
- CORS 2.8.5 for cross-origin requests
- cookie-parser 1.4.7 for secure cookies

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SWP391_G5
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   
   Create a `.env` file in the server directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key
   MONGODB_URI=mongodb://localhost:27017/moveease
   CLIENT_URL=http://localhost:3000
   PORT=5000
   NODE_ENV=development
   ```

5. **Start the application**
   
   In separate terminals:
   ```bash
   # Start the server
   cd server
   npm run dev
   
   # Start the client
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Application Structure

### Pages
- **Landing Page** (`/`): Public homepage with service information
- **Login** (`/login`): User authentication
- **Register** (`/register`): New user registration
- **Dashboard** (`/home`): Protected customer dashboard

### Dashboard Features
- **Overview**: Statistics and quick actions
- **Book a Move**: Moving request form
- **My Moves**: View and manage bookings
- **Profile**: Account information and settings

## 🔐 Security Features

- JWT tokens with 15-minute expiry
- HttpOnly cookies for token storage
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Secure cookie settings for production

## 🎯 User Experience

### Authentication Flow
1. User visits landing page
2. Clicks "Get Started" to register or "Sign In" to login
3. After authentication, redirected to dashboard
4. Can book moves, view history, and manage profile

### Dashboard Features
- **Statistics Cards**: Shows completed moves, upcoming moves, total spent
- **Quick Actions**: Easy access to book new moves or view existing ones
- **Booking Form**: Comprehensive form for move details
- **Profile Management**: Update personal information

## 🚧 Future Enhancements

- Real-time move tracking
- Payment integration
- Email notifications
- Mobile app development
- Advanced booking calendar
- Customer reviews and ratings
- Admin dashboard for move management

## 📄 License

This project is part of SWP391 course work.

## 👥 Team

Developed as part of SWP391 Group 5 project.

---

**MoveEase** - Making your next move simple, secure, and stress-free! 🚚✨

