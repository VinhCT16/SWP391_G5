import { Router } from "express";
import Request from "../models/Request.js";

const router = Router();

/* ========= Helpers ========= */
const normalizeVNPhone = (s = "") => {
  const x = String(s).trim().replace(/\s+/g, "");
  if (x.startsWith("+84")) return "0" + x.slice(3);
  return x;
};
const isVNMobile = (s = "") => /^0(3|5|7|8|9)\d{8}$/.test(normalizeVNPhone(s));

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

/* ========= CREATE (màn Tạo) ========= */
router.post("/requests", async (req, res, next) => {
  try {
    // luôn clone body và xoá _id để không bao giờ ghi đè document cũ
    const body = { ...(req.body || {}) };
    if ("_id" in body) delete body._id;

    // phone
    if (!isVNMobile(body.customerPhone)) {
      return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
    }
    body.customerPhone = normalizeVNPhone(body.customerPhone);

    // moving time
    const vt = validateMovingTime(body.movingTime);
    if (!vt.ok) return res.status(400).json({ error: vt.msg });

    // images
    const imgs = Array.isArray(body.images) ? body.images : [];
    if (imgs.length > 4) return res.status(400).json({ error: "Tối đa 4 ảnh" });
    // chặn base64 quá nặng (>~1.5MB/ảnh ~ 2,000,000 chars base64)
    const MAX_B64 = 2_000_000;
    for (const b64 of imgs) {
      if (typeof b64 !== "string" || b64.length > MAX_B64) {
        return res.status(400).json({ error: "Ảnh quá lớn (tối đa ~1.5MB/ảnh)" });
      }
    }

    // ✅ luôn tạo document mới
    const doc = await new Request({
      ...body,
      status: "PENDING_REVIEW",
    }).save();

    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
});

/* ========= LIST theo phone (màn Manage) ========= */
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

/* ========= GET ONE (màn Edit) ========= */
router.get("/requests/:id", async (req, res, next) => {
  try {
    const doc = await Request.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

/* ========= UPDATE (chỉ khi đang chờ duyệt; cấm đổi name/phone) ========= */
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

    // Validate movingTime nếu có
    if ("movingTime" in req.body) {
      const vt = validateMovingTime(req.body.movingTime);
      if (!vt.ok) return res.status(400).json({ error: vt.msg });
    }

    // Validate images nếu có
    if ("images" in req.body) {
      const imgs = Array.isArray(req.body.images) ? req.body.images : [];
      if (imgs.length > 4) return res.status(400).json({ error: "Tối đa 4 ảnh" });
      const MAX_B64 = 2_000_000;
      for (const b64 of imgs) {
        if (typeof b64 !== "string" || b64.length > MAX_B64) {
          return res.status(400).json({ error: "Ảnh quá lớn (tối đa ~1.5MB/ảnh)" });
        }
      }
    }

    // Chỉ cho sửa các trường này
    const allowed = ["address", "movingTime", "serviceType", "images", "notes"];
    for (const k of allowed) if (k in req.body) r[k] = req.body[k];

    await r.save();
    res.json(r);
  } catch (e) {
    next(e);
  }
});

/* ========= CANCEL ========= */
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
