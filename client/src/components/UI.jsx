import React from "react";

export function LoadingSpinner({ message = "Đang tải..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
}

export function ErrorMessage({ error, onRetry, message = "Đã xảy ra lỗi" }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
      <div className="p-4 bg-red-100 rounded-full">
        <span className="text-red-600 text-4xl">⚠️</span>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">🔄</span>
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ 
  title = "Không có dữ liệu", 
  description = "Chưa có thông tin để hiển thị",
  icon: Icon = null,
  action 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
      <div className="p-4 bg-gray-100 rounded-full">
        {Icon ? <Icon className="h-12 w-12 text-gray-400" /> : <span className="text-gray-400 text-4xl">📄</span>}
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        {action}
      </div>
    </div>
  );
}
