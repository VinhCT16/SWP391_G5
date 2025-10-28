// server/src/routes/requests.js
import { Router } from "express";
import Request from "../models/Request.js";

const router = Router();

/* ================= Helpers ================= */

// Chuẩn hoá số VN: +84xxx -> 0xxx
const normalizeVNPhone = (s = "") => {
  const x = String(s).trim().replace(/\s+/g, "");
  if (x.startsWith("+84")) return "0" + x.slice(3);
  return x;
};
const isVNMobile = (s = "") =>
  /^0(3[2-9]|5[2689]|7[06-9]|8[1-689]|9[0-46-9])\d{7}$/.test(s);

const isAddressComplete = (a) =>
  !!(
    a &&
    a.province?.code && a.province?.name &&
    a.district?.code && a.district?.name &&
    a.ward?.code && a.ward?.name &&
    String(a.street || "").trim()
  );

// Chuẩn hoá location về GeoJSON Point
const normalizeLocation = (loc) => {
  if (!loc) return undefined; // optional
  // client gửi { lat, lng }
  if (typeof loc.lat === "number" && typeof loc.lng === "number") {
    return { type: "Point", coordinates: [loc.lng, loc.lat] };
  }
  // đã là GeoJSON
  if (
    loc.type === "Point" &&
    Array.isArray(loc.coordinates) &&
    loc.coordinates.length === 2 &&
    typeof loc.coordinates[0] === "number" &&
    typeof loc.coordinates[1] === "number"
  ) {
    return loc;
  }
  return null; // sai định dạng
};

/* ================= CREATE ================= */
// POST /api/requests
router.post("/requests", async (req, res, next) => {
  try {
    const {
      customerName,
      customerPhone,
      pickupAddress,
      pickupLocation,
      deliveryAddress,
      deliveryLocation,
      movingTime,
      serviceType,
      notes,
      images,
    } = req.body || {};

    if (!customerName?.trim())
      return res.status(400).json({ error: "Thiếu họ tên" });
    if (!isVNMobile(normalizeVNPhone(customerPhone || "")))
      return res.status(400).json({ error: "Số điện thoại không hợp lệ" });

    if (!isAddressComplete(pickupAddress))
      return res.status(400).json({ error: "Thiếu hoặc sai địa chỉ LẤY HÀNG" });
    if (!isAddressComplete(deliveryAddress))
      return res.status(400).json({ error: "Thiếu hoặc sai địa chỉ GIAO HÀNG" });

    const pickLoc = normalizeLocation(pickupLocation);
    const delivLoc = normalizeLocation(deliveryLocation);
    if (pickLoc === null) return res.status(400).json({ error: "pickupLocation sai định dạng" });
    if (delivLoc === null) return res.status(400).json({ error: "deliveryLocation sai định dạng" });

    const mt = new Date(movingTime);
    if (!(mt instanceof Date) || isNaN(mt.getTime()) || mt.getTime() <= Date.now()) {
      return res.status(400).json({ error: "Thời gian chuyển phải ở tương lai" });
    }

    const doc = await Request.create({
      customerName: customerName.trim(),
      customerPhone: normalizeVNPhone(customerPhone),
      pickupAddress,
      pickupLocation: pickLoc,
      deliveryAddress,
      deliveryLocation: delivLoc,
      movingTime: mt,
      serviceType: serviceType || "STANDARD",
      notes,
      images: Array.isArray(images) ? images.slice(0, 4) : []
    });

    return res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
});

/* ================= LIST (My Requests) ================= */
// GET /api/requests?phone=0xxxxxxxxx
router.get("/requests", async (req, res, next) => {
  try {
    const phone = normalizeVNPhone(req.query.phone || "");
    if (!isVNMobile(phone)) {
      return res.status(400).json({ error: "Thiếu/ sai số điện thoại để lọc" });
    }
    const docs = await Request.find({ customerPhone: phone })
      .sort({ createdAt: -1 })
      .lean();

    // Compat cho doc cũ
    const mapped = docs.map((d) => ({
      ...d,
      pickupAddress: d.pickupAddress || d.address || null,
      deliveryAddress: d.deliveryAddress || d.address || null,
      pickupLocation: d.pickupLocation || d.location || null,
      deliveryLocation: d.deliveryLocation || d.location || null,
    }));

    res.json(mapped);
  } catch (e) {
    next(e);
  }
});

/* ================= GET ONE (Edit) ================= */
// GET /api/requests/:id
router.get("/requests/:id", async (req, res, next) => {
  try {
    const doc = await Request.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });

    // compat map
    doc.pickupAddress = doc.pickupAddress || doc.address || null;
    doc.deliveryAddress = doc.deliveryAddress || doc.address || null;
    doc.pickupLocation = doc.pickupLocation || doc.location || null;
    doc.deliveryLocation = doc.deliveryLocation || doc.location || null;

    res.json(doc);
  } catch (e) {
    next(e);
  }
});

/* ================= UPDATE (Edit) ================= */
// Chỉ cho sửa khi đang chờ duyệt
router.patch("/requests/:id", async (req, res, next) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "Not found" });
    if (r.status !== "PENDING_REVIEW") {
      return res.status(409).json({ error: "Chỉ được sửa khi đang chờ duyệt" });
    }

    // ✅ Cho phép đổi họ tên / SĐT (kèm validate)
    if ("customerName" in req.body) {
      if (!String(req.body.customerName || "").trim()) {
        return res.status(400).json({ error: "Thiếu họ tên" });
      }
      r.customerName = String(req.body.customerName).trim();
    }
    if ("customerPhone" in req.body) {
      const np = normalizeVNPhone(req.body.customerPhone || "");
      if (!isVNMobile(np)) {
        return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
      }
      r.customerPhone = np;
    }

    // pickup/delivery address (nếu có)
    if (req.body.pickupAddress) {
      if (!isAddressComplete(req.body.pickupAddress)) {
        return res.status(400).json({ error: "pickupAddress thiếu hoặc sai" });
      }
      r.pickupAddress = req.body.pickupAddress;
    }
    if (req.body.deliveryAddress) {
      if (!isAddressComplete(req.body.deliveryAddress)) {
        return res.status(400).json({ error: "deliveryAddress thiếu hoặc sai" });
      }
      r.deliveryAddress = req.body.deliveryAddress;
    }

    // locations (optional)
    if ("pickupLocation" in req.body) {
      const loc = normalizeLocation(req.body.pickupLocation);
      if (loc === null) return res.status(400).json({ error: "pickupLocation sai định dạng" });
      r.pickupLocation = loc;
    }
    if ("deliveryLocation" in req.body) {
      const loc = normalizeLocation(req.body.deliveryLocation);
      if (loc === null) return res.status(400).json({ error: "deliveryLocation sai định dạng" });
      r.deliveryLocation = loc;
    }

    if ("movingTime" in req.body) {
      const mt = new Date(req.body.movingTime);
      if (!(mt instanceof Date) || isNaN(mt.getTime()) || mt.getTime() <= Date.now()) {
        return res.status(400).json({ error: "Thời gian chuyển phải ở tương lai" });
      }
      r.movingTime = mt;
    }

    if ("serviceType" in req.body) r.serviceType = req.body.serviceType;
    if ("notes" in req.body)       r.notes = req.body.notes;
    if ("images" in req.body)      r.images = Array.isArray(req.body.images) ? req.body.images.slice(0,4) : [];

    await r.save();
    return res.json(r);
  } catch (e) {
    next(e);
  }
});

/* ================= CANCEL ================= */
router.post("/requests/:id/cancel", async (req, res, next) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "Not found" });

    if (!["PENDING_REVIEW", "APPROVED"].includes(r.status)) {
      return res.status(409).json({ error: "Không thể hủy ở giai đoạn này" });
    }

    r.status = "CANCELLED";
    await r.save();
    return res.json(r);
  } catch (e) {
    next(e);
  }
});

export default router;
