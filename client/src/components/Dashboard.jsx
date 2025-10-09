import React from "react";
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
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📊 Bảng điều khiển
        </h1>
        <p className="text-xl text-gray-600">
          Tổng quan về đánh giá và phản hồi của khách hàng
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tổng đánh giá"
          value={stats.totalReviews}
          icon="💬"
          color="blue"
        />
        <StatsCard
          title="Đánh giá trung bình"
          value={`${stats.averageRating}/5`}
          icon="⭐"
          color="yellow"
        />
        <StatsCard
          title="Đánh giá tích cực"
          value={stats.positiveReviews}
          icon="📈"
          color="green"
        />
        <StatsCard
          title="Tỷ lệ hài lòng"
          value={`${satisfactionRate}%`}
          icon="🏆"
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rating Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Phân bố đánh giá</h3>
            <span className="text-gray-400">🎯</span>
          </div>
          <div className="space-y-4">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">{rating} sao</span>
                    <div className="flex">
                      {Array.from({ length: rating }, (_, i) => (
                        <span key={i} className="text-yellow-400 text-sm">⭐</span>
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
        </div>

        {/* Monthly Stats */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Thống kê tháng</h3>
            <span className="text-gray-400">📅</span>
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
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động nhanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-lg">💬</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Xem tất cả đánh giá</div>
                <div className="text-sm text-gray-600">{stats.totalReviews} đánh giá</div>
              </div>
            </div>
          </button>

          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-lg">📈</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Đánh giá tích cực</div>
                <div className="text-sm text-gray-600">{stats.positiveReviews} đánh giá</div>
              </div>
            </div>
          </button>

          <button className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-left">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-lg">⭐</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Đánh giá trung bình</div>
                <div className="text-sm text-gray-600">{stats.averageRating}/5 sao</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
