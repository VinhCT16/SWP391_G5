// server/src/routes/requests.js
import { Router } from "express";
import Request from "../models/Request.js";

const router = Router();

/* ================= Helpers ================= */

// Chuẩn hóa số VN: +84xxx -> 0xxx, loại bỏ khoảng trắng
const normalizeVNPhone = (s = "") => {
  const x = String(s).trim().replace(/\s+/g, "");
  if (x.startsWith("+84")) return "0" + x.slice(3);
  return x;
};

// Check số di động VN (đầu 03/05/07/08/09 + 8 số)
const isVNMobile = (s = "") => /^0(3|5|7|8|9)\d{8}$/.test(normalizeVNPhone(s));

/**
 * movingTime phải ở tương lai.
 * Nếu hẹn ngay hôm nay:
 *  - Trước 12:00: chỉ được đặt từ 12:00 trở đi
 *  - Sau 12:00: bắt buộc chọn ngày mai
 */
const validateMovingTime = (movingTimeISO) => {
  if (!movingTimeISO) return { ok: false, msg: "Vui lòng chọn thời gian chuyển nhà." };
  const now = new Date();
  const sel = new Date(movingTimeISO);
  if (isNaN(sel.getTime())) return { ok: false, msg: "Thời gian không hợp lệ." };
  if (sel.getTime() <= now.getTime()) return { ok: false, msg: "Thời gian phải ở tương lai." };

  const sameDay =
    now.getFullYear() === sel.getFullYear() &&
    now.getMonth() === sel.getMonth() &&
    now.getDate() === sel.getDate();

  if (sameDay) {
    const noon = new Date(now);
    noon.setHours(12, 0, 0, 0);
    if (now < noon) {
      if (sel.getHours() < 12) {
        return { ok: false, msg: "Trước 12h trưa chỉ được đặt từ 12:00 trở đi." };
      }
    } else {
      return { ok: false, msg: "Sau 12h trưa hôm nay, hãy đặt từ ngày mai." };
    }
  }
  return { ok: true };
};

// Địa chỉ phải đủ 4 phần
const isAddressComplete = (a) =>
  !!(
    a &&
    a.province?.code && a.province?.name &&
    a.district?.code && a.district?.name &&
    a.ward?.code     && a.ward?.name &&
    String(a.street || "").trim()
  );

/**
 * Chuẩn hóa location:
 * - Nếu client gửi { lat, lng } -> đổi sang GeoJSON {type:"Point", coordinates:[lng,lat]}
 * - Nếu đã là GeoJSON hợp lệ -> giữ nguyên
 * - Nếu không gửi -> undefined
 * - Sai định dạng -> null (để trả 400)
 */
const normalizeLocation = (loc) => {
  if (!loc) return undefined;
  // { lat, lng } (React/Google Maps hay trả dạng này)
  if (typeof loc.lat === "number" && typeof loc.lng === "number") {
    return { type: "Point", coordinates: [loc.lng, loc.lat] };
  }
  // GeoJSON
  if (
    loc.type === "Point" &&
    Array.isArray(loc.coordinates) &&
    loc.coordinates.length === 2 &&
    typeof loc.coordinates[0] === "number" &&
    typeof loc.coordinates[1] === "number"
  ) {
    return loc;
  }
  return null;
};

// Ảnh base64 – tối đa 4 ảnh, cỡ ~ 1.5MB/ảnh (≈ 2,000,000 ký tự base64)
const validateImages = (imgsRaw) => {
  const imgs = Array.isArray(imgsRaw) ? imgsRaw : [];
  if (imgs.length > 4) return { ok: false, msg: "Tối đa 4 ảnh" };
  const MAX_B64 = 2_000_000;
  for (const b64 of imgs) {
    if (typeof b64 !== "string" || b64.length > MAX_B64) {
      return { ok: false, msg: "Ảnh quá lớn (tối đa ~1.5MB/ảnh)" };
    }
  }
  return { ok: true, imgs };
};

/* ================= CREATE ================= */
router.post("/requests", async (req, res, next) => {
  try {
    const body = { ...(req.body || {}) };
    if ("_id" in body) delete body._id; // không bao giờ ghi đè doc cũ

    // phone
    if (!isVNMobile(body.customerPhone)) {
      return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
    }
    body.customerPhone = normalizeVNPhone(body.customerPhone);

    // address
    if (!isAddressComplete(body.address)) {
      return res.status(400).json({
        error: "Địa chỉ chưa đầy đủ (tỉnh/thành, quận/huyện, phường/xã, số nhà/đường).",
      });
    }

    // location (optional)
    if ("location" in body) {
      const loc = normalizeLocation(body.location);
      if (loc === null) return res.status(400).json({ error: "Tọa độ không hợp lệ." });
      body.location = loc; // có thể undefined nếu client không gửi
    }

    // moving time
    const vt = validateMovingTime(body.movingTime);
    if (!vt.ok) return res.status(400).json({ error: vt.msg });

    // images
    const iv = validateImages(body.images);
    if (!iv.ok) return res.status(400).json({ error: iv.msg });
    body.images = iv.imgs;

    // luôn tạo document mới
    const doc = await new Request({
      ...body,
      status: "PENDING_REVIEW",
    }).save();

    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
});

/* ================= LIST (Manage) ================= */
router.get("/requests", async (req, res, next) => {
  try {
    const { phone, status } = req.query;
    const q = {};
    if (phone) q.customerPhone = normalizeVNPhone(phone);
    if (status) q.status = status;
    const list = await Request.find(q).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/* ================= GET ONE (Edit) ================= */
router.get("/requests/:id", async (req, res, next) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

/* = UPDATE (chỉ khi PENDING_REVIEW; cấm đổi họ tên & sđt) = */
router.patch("/requests/:id", async (req, res, next) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "Not found" });
    if (r.status !== "PENDING_REVIEW") {
      return res.status(409).json({ error: "Không thể sửa sau khi đã duyệt" });
    }

    // Cấm đổi các trường định danh
    if ("customerName" in req.body || "customerPhone" in req.body) {
      return res.status(400).json({ error: "Không được phép đổi họ tên / số điện thoại" });
    }

    // address (nếu có)
    if ("address" in req.body) {
      if (!isAddressComplete(req.body.address)) {
        return res.status(400).json({
          error: "Địa chỉ chưa đầy đủ (tỉnh/thành, quận/huyện, phường/xã, số nhà/đường).",
        });
      }
      r.address = req.body.address;
    }

    // location (nếu có)
    if ("location" in req.body) {
      const loc = normalizeLocation(req.body.location);
      if (loc === null) return res.status(400).json({ error: "Tọa độ không hợp lệ." });
      r.location = loc;
    }

    // movingTime (nếu có)
    if ("movingTime" in req.body) {
      const vt = validateMovingTime(req.body.movingTime);
      if (!vt.ok) return res.status(400).json({ error: vt.msg });
      r.movingTime = req.body.movingTime;
    }

    // serviceType (nếu có)
    if ("serviceType" in req.body) {
      r.serviceType = req.body.serviceType;
    }

    // images (nếu có)
    if ("images" in req.body) {
      const iv = validateImages(req.body.images);
      if (!iv.ok) return res.status(400).json({ error: iv.msg });
      r.images = iv.imgs;
    }

    // notes (nếu có)
    if ("notes" in req.body) {
      r.notes = req.body.notes;
    }

    await r.save();
    res.json(r);
  } catch (e) {
    next(e);
  }
});

/* ================= CANCEL ================= */
router.post("/requests/:id/cancel", async (req, res, next) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "Not found" });

    if (r.status === "CANCELLED") return res.json(r);
    if (!["PENDING_REVIEW", "APPROVED"].includes(r.status)) {
      return res.status(409).json({ error: "Không thể hủy ở giai đoạn này" });
    }

    r.status = "CANCELLED";
    await r.save();
    res.json(r);
  } catch (e) {
    next(e);
  }
});

export default router;
