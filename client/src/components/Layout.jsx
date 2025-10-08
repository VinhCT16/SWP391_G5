import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  Star, 
  Users, 
  Menu, 
  X,
  Truck,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { useState } from "react";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Trang chủ", href: "/", icon: Home },
    { name: "Đánh giá khách hàng", href: "/homepage", icon: Star },
    { name: "Quản lý đánh giá", href: "/manager-review", icon: Users },
    { name: "Đánh giá khách hàng", href: "/customer-review", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center ml-4 md:ml-0">
                <Truck className="h-8 w-8 text-blue-600" />
                <h1 className="ml-2 text-xl font-bold text-gray-900">
                  Moving Service
                </h1>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-1" />
                <span>1900-1234</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-1" />
                <span>support@movingservice.com</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 0 }}
          className={`bg-white shadow-xl border-r border-gray-200 overflow-hidden ${
            sidebarOpen ? "w-70" : "w-0"
          } md:w-70 transition-all duration-300`}
        >
          <div className="p-6">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-100 text-blue-700 border-r-4 border-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Truck className="h-8 w-8 text-blue-400" />
                <h3 className="ml-2 text-xl font-bold">Moving Service</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Dịch vụ chuyển nhà chuyên nghiệp, uy tín với đội ngũ nhân viên 
                giàu kinh nghiệm và trang thiết bị hiện đại.
              </p>
              <div className="flex items-center text-gray-400">
                <MapPin className="h-4 w-4 mr-2" />
                <span>123 Đường ABC, Quận XYZ, TP.HCM</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>1900-1234</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>support@movingservice.com</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Dịch vụ</h4>
              <div className="space-y-2 text-gray-400">
                <div>Chuyển nhà</div>
                <div>Chuyển văn phòng</div>
                <div>Vận chuyển đồ đạc</div>
                <div>Lắp đặt nội thất</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Moving Service. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
