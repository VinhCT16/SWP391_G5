import React, { useEffect, useState } from "react";
import { getReviews, deleteReview } from "../api/reviewApi";
import ReviewCard from "../components/ReviewCard";

export default function ManagerReview() {
  const [reviews, setReviews] = useState([]);

  const loadData = () => {
    getReviews().then(res => setReviews(res.data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    await deleteReview(id);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Thanh tác vụ */}
      <nav className="w-full bg-white shadow-md px-6 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold text-blue-600">MyReviewApp</div>
        <ul className="flex space-x-6">
          <li>
            <a href="/" className="text-gray-700 hover:text-blue-500 font-medium">Trang chủ</a>
          </li>
          <li>
            <a href="/reviews" className="text-gray-700 hover:text-blue-500 font-medium">Review</a>
          </li>
          <li>
            <a href="/about" className="text-gray-700 hover:text-blue-500 font-medium">Giới thiệu</a>
          </li>
        </ul>
      </nav>

      {/* Nội dung chính */}
      <main className="max-w-2xl mx-auto mt-10 bg-white rounded-lg shadow p-8">
        <h2 className="text-xl font-bold mb-6 text-center text-blue-700">🛠️ Quản lý Review (Manager)</h2>
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map(r => (
              <ReviewCard key={r._id} review={r} onDelete={handleDelete} />
            ))
          ) : (
            <p className="text-center text-gray-500">Chưa có review nào</p>
          )}
        </div>
      </main>
    </div>
  );
}
