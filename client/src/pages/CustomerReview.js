import React, { useEffect, useState } from "react";
import { getReviews, createReview, updateReview, deleteReview } from "../api/reviewApi";
import ReviewCard from "../components/ReviewCard";

export default function CustomerReview() {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ user: "", rating: 5, comment: "" });
  const [editId, setEditId] = useState(null);

  const loadData = () => {
    getReviews().then(res => setReviews(res.data));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await updateReview(editId, form);
      setEditId(null);
    } else {
      await createReview(form);
    }
    setForm({ user: "", rating: 5, comment: "" });
    loadData();
  };

  const handleEdit = (review) => {
    setForm({ user: review.user, rating: review.rating, comment: review.comment });
    setEditId(review._id);
  };

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
        <h2 className="text-xl font-bold mb-6 text-center text-blue-700">✍️ Viết Review</h2>
        <form onSubmit={handleSubmit} className="mb-8 flex flex-col md:flex-row items-center justify-center gap-2">
          <input
            type="text"
            placeholder="Tên"
            value={form.user}
            onChange={e => setForm({ ...form, user: e.target.value })}
            className="border p-2 rounded w-full md:w-auto"
            required
          />
          <input
            type="number"
            min="1"
            max="5"
            value={form.rating}
            onChange={e => setForm({ ...form, rating: e.target.value })}
            className="border p-2 rounded w-20"
            required
          />
          <input
            type="text"
            placeholder="Nội dung"
            value={form.comment}
            onChange={e => setForm({ ...form, comment: e.target.value })}
            className="border p-2 rounded w-full md:w-auto"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            {editId ? "Cập nhật" : "Thêm"}
          </button>
        </form>

        <h3 className="font-bold mb-4 text-blue-700 text-center">📌 Danh sách review của khách hàng</h3>
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map(r => (
              <ReviewCard key={r._id} review={r} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          ) : (
            <p className="text-center text-gray-500">Chưa có review nào</p>
          )}
        </div>
      </main>
    </div>
  );
}
