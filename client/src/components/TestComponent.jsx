import React from "react";

export default function TestComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            🎉 Tailwind CSS đã hoạt động!
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Giao diện đã được tối ưu hóa với Tailwind CSS và các animations đẹp mắt.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-800 mb-2">Responsive Design</h3>
              <p className="text-blue-600">Tối ưu cho mọi thiết bị</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-xl font-semibold text-green-800 mb-2">Modern UI</h3>
              <p className="text-green-600">Giao diện hiện đại và đẹp mắt</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-xl font-semibold text-purple-800 mb-2">Animations</h3>
              <p className="text-purple-600">Hiệu ứng mượt mà với Framer Motion</p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Khám phá ngay
            </button>
            <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
