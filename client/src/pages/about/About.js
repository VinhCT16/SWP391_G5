import React, { useEffect, useState } from "react";
import ReviewCard from "../../components/review/ReviewCard";
import { getReviews } from "../../api/reviewApi";
import BackButton from "../../components/layout/BackButton";

export default function About() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    getReviews()
      .then((res) => setReviews(res.data.slice(0, 4)))
      .catch(() => setReviews([]));
  }, []);

  return (
    <div className="space-y-10">
      <BackButton fallbackPath="/" />
      <section className="bg-white rounded-xl p-8 shadow border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Dịch vụ chuyển nhà chuyên nghiệp
        </h1>
        <p className="text-gray-700 leading-7">
          Chúng tôi cung cấp dịch vụ chuyển nhà trọn gói, an toàn và đúng hẹn. Đội ngũ nhân viên
          giàu kinh nghiệm, quy trình chuẩn hoá và cam kết bảo quản tài sản của bạn một cách tốt nhất.
        </p>
        <ul className="list-disc pl-6 mt-4 text-gray-700 space-y-1">
          <li>Khảo sát và tư vấn miễn phí</li>
          <li>Đóng gói chuyên nghiệp, vật tư chất lượng</li>
          <li>Vận chuyển an toàn, đúng thời gian</li>
          <li>Hỗ trợ lắp đặt, sắp xếp theo yêu cầu</li>
          <li>Bảo hiểm hàng hoá theo hợp đồng</li>
        </ul>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Khách hàng nói gì?</h2>
          <span className="text-sm text-gray-500">Top 4 đánh giá mới nhất</span>
        </div>
        {reviews.length === 0 ? (
          <div className="text-gray-500">Chưa có đánh giá nào.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


