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
      status, // ✅ Nhận status từ body
      surveyFee, // ✅ Nhận surveyFee từ body
    } = req.body || {};

    console.log("📥 [Create Request] Nhận được body:", {
      customerName,
      customerPhone,
      status: status || "PENDING_CONFIRMATION (default)",
      surveyFee: surveyFee || "undefined",
    });

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

    // ✅ Cho phép set status khi tạo (cho staff survey flow)
    // Validate status nếu có
    const validStatuses = [
      "PENDING_CONFIRMATION", "UNDER_SURVEY", "WAITING_PAYMENT",
      "IN_PROGRESS", "DONE", "CANCELLED", "REJECTED",
      "PENDING_REVIEW", "APPROVED"
    ];
    const finalStatus = status && validStatuses.includes(status) ? status : "PENDING_CONFIRMATION";
    const finalSurveyFee = surveyFee && typeof surveyFee === "number" ? surveyFee : undefined;

    console.log(`🔧 [Create Request] Sử dụng status: ${finalStatus}, surveyFee: ${finalSurveyFee || "undefined"}`);

    const doc = await Request.create({
      customerName: customerName.trim(),
      customerPhone: normalizeVNPhone(customerPhone),
      pickupAddress,
      pickupLocation: pickLoc,
      deliveryAddress,
      deliveryLocation: delivLoc,
      movingTime: mt,
      serviceType: serviceType || "STANDARD",
      status: finalStatus, // ✅ Set status
      surveyFee: finalSurveyFee, // ✅ Set surveyFee
      notes,
      images: Array.isArray(images) ? images.slice(0, 4) : []
    });

    console.log(`✅ [Create Request] Đã tạo request với status: ${doc.status}, ID: ${doc._id.toString().slice(-8)}`);

    return res.status(201).json(doc);
  } catch (e) {
    console.error("❌ [Create Request] Error:", e);
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

/* ================= LIST STAFF TASKS ================= */
// GET /api/requests/staff/tasks
// Lấy tất cả requests mà staff cần xử lý (UNDER_SURVEY, WAITING_PAYMENT, IN_PROGRESS, DONE)
router.get("/requests/staff/tasks", async (req, res, next) => {
  try {
    const statusFilter = req.query.status; // Optional: filter theo status cụ thể
    
    const query = {
      status: {
        $in: ["UNDER_SURVEY", "WAITING_PAYMENT", "IN_PROGRESS", "DONE"]
      }
    };
    
    if (statusFilter) {
      query.status = statusFilter; // Override nếu có filter
    }
    
    console.log("🔍 [Staff Tasks] Query:", JSON.stringify(query, null, 2));
    
    const docs = await Request.find(query)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 [Staff Tasks] Tìm thấy ${docs.length} requests`);
    if (docs.length > 0) {
      console.log("📋 [Staff Tasks] Status của requests:", docs.map(d => ({ id: d._id?.toString().slice(-8), status: d.status })));
    }

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
    console.error("❌ [Staff Tasks] Error:", e);
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
// Cho phép sửa thông tin và cập nhật status
router.patch("/requests/:id", async (req, res, next) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ error: "Not found" });
    
    // ✅ Cho phép cập nhật status (cho staff)
    if ("status" in req.body) {
      const newStatus = req.body.status;
      const validStatuses = [
        "PENDING_CONFIRMATION", "UNDER_SURVEY", "WAITING_PAYMENT",
        "IN_PROGRESS", "DONE", "CANCELLED", "REJECTED",
        "PENDING_REVIEW", "APPROVED" // backward compat
      ];
      if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ error: "Status không hợp lệ" });
      }
      
      // Cho phép staff cập nhật status trong các trường hợp:
      // - UNDER_SURVEY -> WAITING_PAYMENT (sau khi khảo sát xong)
      // - WAITING_PAYMENT -> IN_PROGRESS (khi bắt đầu vận chuyển)
      // - IN_PROGRESS -> DONE (khi hoàn thành)
      const allowedStatusTransitions = {
        "UNDER_SURVEY": ["WAITING_PAYMENT"],
        "WAITING_PAYMENT": ["IN_PROGRESS"],
        "IN_PROGRESS": ["DONE"],
        "PENDING_CONFIRMATION": ["PENDING_CONFIRMATION", "UNDER_SURVEY", "CANCELLED"], // Customer có thể sửa
        "PENDING_REVIEW": ["PENDING_CONFIRMATION", "UNDER_SURVEY", "CANCELLED"], // Backward compat
      };
      
      const allowed = allowedStatusTransitions[r.status] || [];
      if (!allowed.includes(newStatus) && r.status !== newStatus) {
        return res.status(409).json({ 
          error: `Không thể chuyển từ ${r.status} sang ${newStatus}. Chỉ cho phép: ${allowed.join(", ")}` 
        });
      }
      
      r.status = newStatus;
    }
    
    // Cho phép sửa thông tin khi PENDING_CONFIRMATION hoặc PENDING_REVIEW (backward compat)
    const canEditInfo = ["PENDING_CONFIRMATION", "PENDING_REVIEW"].includes(r.status);
    if (!canEditInfo && Object.keys(req.body).some(k => 
      ["customerName", "customerPhone", "pickupAddress", "deliveryAddress", "movingTime"].includes(k)
    )) {
      // Nếu chỉ cập nhật status hoặc notes thì OK, không cần check
      if (!("status" in req.body) && !("notes" in req.body) && !("actualDelivery" in req.body)) {
        return res.status(409).json({ error: "Chỉ được sửa thông tin khi đang chờ xác nhận" });
      }
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
    
    // ✅ Cho phép cập nhật actualDelivery khi hoàn thành (cho staff)
    if ("actualDelivery" in req.body) {
      const ad = new Date(req.body.actualDelivery);
      if (ad instanceof Date && !isNaN(ad.getTime())) {
        r.actualDelivery = ad;
      }
    }

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
    if (!r) {
      return res.status(404).json({ error: "Không tìm thấy request" });
    }

    // Cho phép hủy khi chưa thanh toán hoặc chưa vận chuyển
    const canCancelStatuses = [
      "PENDING_CONFIRMATION",
      "UNDER_SURVEY",
      "WAITING_PAYMENT",
      // Backward compat
      "PENDING_REVIEW",
      "APPROVED",
    ];
    if (!canCancelStatuses.includes(r.status)) {
      return res.status(409).json({ 
        error: `Không thể hủy ở giai đoạn này. Trạng thái hiện tại: ${r.status}` 
      });
    }

    r.status = "CANCELLED";
    await r.save();
    return res.json(r);
  } catch (e) {
    console.error("Cancel request error:", e);
    return res.status(500).json({ error: e.message || "Lỗi khi hủy request" });
  }
});

export default router;
