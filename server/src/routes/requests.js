// server/src/routes/requests.js
import express from "express";
import mongoose from "mongoose";
import Request from "../models/Request.js";

const router = express.Router();

/* ===================== Helpers ===================== */

function normalizeVNPhone(raw = "") {
  const s = String(raw).replace(/\s|-/g, "");
  if (s.startsWith("+84")) return "0" + s.slice(3);
  return s;
}

function isVNMobile(phone = "") {
  return /^0(3|5|7|8|9)\d{8}$/.test(phone);
}

function isAddressComplete(a) {
  return !!(a?.province?.code && a?.district?.code && a?.ward?.code && a?.street);
}

function normalizeLocation(loc) {
  if (!loc) return undefined;
  if (typeof loc.lat === "number" && typeof loc.lng === "number") {
    return { type: "Point", coordinates: [loc.lng, loc.lat] };
  }
  if (loc?.type === "Point" && Array.isArray(loc.coordinates)) {
    return loc;
  }
  return null;
}

function validateImages(imgs) {
  if (!imgs) return { ok: true };
  if (!Array.isArray(imgs)) return { ok: false, msg: "images phải là mảng" };
  if (imgs.length > 4) return { ok: false, msg: "Tối đa 4 ảnh" };

  const MAX = 1.5 * 1024 * 1024; // ~1.5MB
  for (const s of imgs) {
    if (typeof s !== "string") return { ok: false, msg: "Mỗi ảnh phải là chuỗi base64" };
    const pure = s.includes(",") ? s.split(",")[1] : s;
    const sizeEstimate = (pure.length * 3) / 4;
    if (sizeEstimate > MAX) return { ok: false, msg: "Ảnh quá nặng (>1.5MB)" };
  }
  return { ok: true };
}

function validateMovingTime(isoString) {
  const t = new Date(isoString);
  if (Number.isNaN(t.getTime())) return { ok: false, msg: "movingTime không hợp lệ" };

  const now = new Date();
  if (t <= now) return { ok: false, msg: "Thời gian phải ở tương lai" };

  const sameDay =
    t.getFullYear() === now.getFullYear() &&
    t.getMonth() === now.getMonth() &&
    t.getDate() === now.getDate();

  if (sameDay) {
    if (now.getHours() < 12) {
      if (t.getHours() < 12) return { ok: false, msg: "Trong ngày chỉ nhận từ 12:00" };
    } else {
      return { ok: false, msg: "Sau 12:00 hôm nay chỉ nhận từ ngày mai" };
    }
  }
  return { ok: true };
}

/* ===================== Routes ===================== */

// Create
router.post("/requests", async (req, res) => {
  try {
    const body = { ...req.body };
    delete body._id;

    // Phone
    const phone = normalizeVNPhone(body.customerPhone);
    if (!isVNMobile(phone)) {
      return res.status(400).json({ error: "Số điện thoại VN không hợp lệ" });
    }

    // Address
    if (!isAddressComplete(body.pickupAddress)) {
      return res.status(400).json({ error: "Thiếu địa chỉ LẤY HÀNG" });
    }
    if (!isAddressComplete(body.deliveryAddress)) {
      return res.status(400).json({ error: "Thiếu địa chỉ GIAO HÀNG" });
    }

    // Location
    const pickupLoc = normalizeLocation(body.pickupLocation);
    const deliveryLoc = normalizeLocation(body.deliveryLocation);
    if (pickupLoc === null || deliveryLoc === null) {
      return res.status(400).json({ error: "Tọa độ không hợp lệ" });
    }
    body.pickupLocation = pickupLoc;
    body.deliveryLocation = deliveryLoc;

    // Time
    const vTime = validateMovingTime(body.movingTime);
    if (!vTime.ok) return res.status(400).json({ error: vTime.msg });

    // Images
    const vImgs = validateImages(body.images);
    if (!vImgs.ok) return res.status(400).json({ error: vImgs.msg });

    body.customerPhone = phone;
    body.status = "PENDING_REVIEW";

    const doc = await Request.create(body);
    return res.status(201).json(doc);
  } catch (err) {
    console.error("Create request error:", err);
    return res.status(500).json({ error: "Lỗi server khi tạo request" });
  }
});

// List by phone (and optional status)
router.get("/requests", async (req, res) => {
  try {
    const q = {};
    if (req.query.phone) q.customerPhone = normalizeVNPhone(req.query.phone);
    if (req.query.status) q.status = req.query.status;

    const list = await Request.find(q).sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    console.error("List requests error:", err);
    return res.status(500).json({ error: "Lỗi server khi lấy danh sách" });
  }
});

// Get one
router.get("/requests/:id", async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Không tìm thấy request" });
    return res.json(doc);
  } catch (err) {
    console.error("Get request error:", err);
    return res.status(500).json({ error: "Lỗi server khi lấy chi tiết" });
  }
});

// Update (PENDING_REVIEW only)
router.patch("/requests/:id", async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Không tìm thấy request" });

    if (doc.status !== "PENDING_REVIEW") {
      return res.status(409).json({ error: "Chỉ cho sửa khi đang chờ duyệt" });
    }

    const patch = { ...req.body };
    delete patch.customerName;
    delete patch.customerPhone;

    if (patch.pickupAddress && !isAddressComplete(patch.pickupAddress)) {
      return res.status(400).json({ error: "Thiếu địa chỉ LẤY HÀNG" });
    }
    if (patch.deliveryAddress && !isAddressComplete(patch.deliveryAddress)) {
      return res.status(400).json({ error: "Thiếu địa chỉ GIAO HÀNG" });
    }

    if ("pickupLocation" in patch) {
      const l = normalizeLocation(patch.pickupLocation);
      if (l === null) return res.status(400).json({ error: "pickupLocation không hợp lệ" });
      patch.pickupLocation = l;
    }
    if ("deliveryLocation" in patch) {
      const l = normalizeLocation(patch.deliveryLocation);
      if (l === null) return res.status(400).json({ error: "deliveryLocation không hợp lệ" });
      patch.deliveryLocation = l;
    }

    if (patch.movingTime) {
      const vTime = validateMovingTime(patch.movingTime);
      if (!vTime.ok) return res.status(400).json({ error: vTime.msg });
    }

    if ("images" in patch) {
      const vImgs = validateImages(patch.images);
      if (!vImgs.ok) return res.status(400).json({ error: vImgs.msg });
    }

    Object.assign(doc, patch);
    await doc.save();
    return res.json(doc);
  } catch (err) {
    console.error("Update request error:", err);
    return res.status(500).json({ error: "Lỗi server khi cập nhật" });
  }
});

// Cancel (idempotent)
router.post("/requests/:id/cancel", async (req, res) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Không tìm thấy request" });

    if (doc.status === "CANCELLED") return res.json(doc);
    if (!["PENDING_REVIEW", "APPROVED"].includes(doc.status)) {
      return res.status(409).json({ error: "Chỉ hủy được từ chờ duyệt/đã duyệt" });
    }

    doc.status = "CANCELLED";
    await doc.save();
    return res.json(doc);
  } catch (err) {
    console.error("Cancel request error:", err);
    return res.status(500).json({ error: "Lỗi server khi hủy" });
  }
});

export default router;
