import React from "react";
import { motion } from "framer-motion";
import { Star, Edit3, Trash2, User, Calendar, MessageCircle } from "lucide-react";

export default function ReviewCard({ review, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return "text-green-600 bg-green-100";
    if (rating >= 3) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {review.customerEmail || review.user || "Khách hàng"}
              </h3>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(review.createdAt || new Date())}</span>
              </div>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getRatingColor(review.rating)}`}>
            {review.rating}/5
          </div>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center mb-4">
          <div className="flex items-center space-x-1">
            {renderStars(review.rating)}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            ({review.rating} sao)
          </span>
        </div>

        {/* Review Content */}
        <div className="mb-4">
          <div className="flex items-start space-x-2">
            <MessageCircle className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
            <p className="text-gray-700 leading-relaxed text-base">
              {review.comment || review.content || "Khách hàng chưa để lại bình luận."}
            </p>
          </div>
        </div>

        {/* Service Info */}
        {review.serviceId && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Dịch vụ:</span> ID {review.serviceId}
            </div>
            {review.customerPhone && (
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">SĐT:</span> {review.customerPhone}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
            {onEdit && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 font-medium"
                onClick={() => onEdit(review)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </motion.button>
            )}
            {onDelete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 font-medium"
                onClick={() => onDelete(review._id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
