import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";

export function LoadingSpinner({ message = "Đang tải..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
      />
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
}

export function ErrorMessage({ error, onRetry, message = "Đã xảy ra lỗi" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
      <div className="p-4 bg-red-100 rounded-full">
        <AlertCircle className="h-12 w-12 text-red-600" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </motion.button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ 
  title = "Không có dữ liệu", 
  description = "Chưa có thông tin để hiển thị",
  icon: Icon = AlertCircle,
  action 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
      <div className="p-4 bg-gray-100 rounded-full">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {action}
      </div>
    </div>
  );
}
