import React from "react";
import { motion } from "framer-motion";
import { 
  Star, 
  TrendingUp, 
  MessageCircle,
  Calendar,
  Award,
  Target
} from "lucide-react";
import { StatsCard, ProgressBar } from "./Common";

export default function Dashboard({ reviews = [] }) {
  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : 0,
    positiveReviews: reviews.filter(r => r.rating >= 4).length,
    negativeReviews: reviews.filter(r => r.rating <= 2).length,
    thisMonthReviews: reviews.filter(r => {
      const reviewDate = new Date(r.createdAt);
      const now = new Date();
      return reviewDate.getMonth() === now.getMonth() && 
             reviewDate.getFullYear() === now.getFullYear();
    }).length
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }));

  const satisfactionRate = reviews.length > 0 
    ? ((stats.positiveReviews / reviews.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📊 Bảng điều khiển
        </h1>
        <p className="text-xl text-gray-600">
          Tổng quan về đánh giá và phản hồi của khách hàng
        </p>
      </motion.div>

      {/* Main Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatsCard
          title="Tổng đánh giá"
          value={stats.totalReviews}
          icon={MessageCircle}
          color="blue"
        />
        <StatsCard
          title="Đánh giá trung bình"
          value={`${stats.averageRating}/5`}
          icon={Star}
          color="yellow"
        />
        <StatsCard
          title="Đánh giá tích cực"
          value={stats.positiveReviews}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Tỷ lệ hài lòng"
          value={`${satisfactionRate}%`}
          icon={Award}
          color="purple"
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rating Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Phân bố đánh giá</h3>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">{rating} sao</span>
                    <div className="flex">
                      {Array.from({ length: rating }, (_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
                <ProgressBar
                  value={percentage}
                  max={100}
                  color="yellow"
                  showLabel={false}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Monthly Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Thống kê tháng</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.thisMonthReviews}
              </div>
              <div className="text-sm text-gray-600">Đánh giá trong tháng này</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.positiveReviews}
                </div>
                <div className="text-xs text-green-700">Tích cực</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {stats.negativeReviews}
                </div>
                <div className="text-xs text-red-700">Tiêu cực</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động nhanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Xem tất cả đánh giá</div>
                <div className="text-sm text-gray-600">{stats.totalReviews} đánh giá</div>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Đánh giá tích cực</div>
                <div className="text-sm text-gray-600">{stats.positiveReviews} đánh giá</div>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Đánh giá trung bình</div>
                <div className="text-sm text-gray-600">{stats.averageRating}/5 sao</div>
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
