import React, { useEffect, useState } from "react";
import ReviewCard from "../components/ReviewCard";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  // Mock data để test giao diện
  const mockReviews = [
    {
      _id: "1",
      customerEmail: "customer1@example.com",
      customerPhone: "0123456789",
      rating: 5,
      content: "Dịch vụ chuyển nhà rất tốt, nhân viên chuyên nghiệp và nhiệt tình!",
      comment: "Dịch vụ chuyển nhà rất tốt, nhân viên chuyên nghiệp và nhiệt tình!",
      createdAt: new Date().toISOString(),
      serviceId: "service123"
    },
    {
      _id: "2", 
      customerEmail: "customer2@example.com",
      customerPhone: "0987654321",
      rating: 4,
      content: "Thời gian chuyển nhà đúng hẹn, đồ đạc được bảo quản cẩn thận.",
      comment: "Thời gian chuyển nhà đúng hẹn, đồ đạc được bảo quản cẩn thận.",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      serviceId: "service456"
    },
    {
      _id: "3",
      customerEmail: "customer3@example.com", 
      customerPhone: "0555666777",
      rating: 5,
      content: "Cảm ơn đội ngũ Moving Service đã giúp tôi chuyển nhà một cách suôn sẻ!",
      comment: "Cảm ơn đội ngũ Moving Service đã giúp tôi chuyển nhà một cách suôn sẻ!",
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      serviceId: "service789"
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReviews(mockReviews);
      setLoading(false);
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !searchTerm || 
      (review.customerEmail && review.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (review.content && review.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRating = ratingFilter === "all" || review.rating.toString() === ratingFilter;
    
    return matchesSearch && matchesRating;
  });

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="ml-3 text-gray-600">Đang tải đánh giá...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackButton fallbackPath="/" />
      
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📌 Đánh giá của khách hàng
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Khám phá những trải nghiệm thực tế từ khách hàng về dịch vụ chuyển nhà của chúng tôi
        </p>
        <div className="mt-6">
          <Link to="/customer-review" className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
            Viết review / Xem review
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Đánh giá trung bình</p>
              <p className="text-2xl font-bold text-gray-900">{averageRating}/5</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng số đánh giá</p>
              <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Đánh giá tích cực</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.filter(r => r.rating >= 4).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố đánh giá</h3>
        <div className="space-y-3">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center">
              <div className="flex items-center w-16">
                <span className="text-sm font-medium text-gray-600">{rating} sao</span>
              </div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600 w-20 text-right">
                {count} ({percentage.toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm theo email hoặc nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">🔽</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả đánh giá</option>
              <option value="5">5 sao</option>
              <option value="4">4 sao</option>
              <option value="3">3 sao</option>
              <option value="2">2 sao</option>
              <option value="1">1 sao</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {searchTerm || ratingFilter !== "all" 
                ? "Không tìm thấy đánh giá phù hợp với bộ lọc" 
                : "Chưa có đánh giá nào"
              }
            </div>
            <p className="text-gray-400">
              {searchTerm || ratingFilter !== "all" 
                ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc" 
                : "Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReviews.map((review, index) => (
              <div key={review._id || index}>
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
