// server/src/routes/contracts.js
import { Router } from "express";
import Contract from "../models/Contract.js";
import Request from "../models/Request.js";

const router = Router();

// Helpers
const calcTotal = (pricing = {}) => {
  const base = Number(pricing.basePrice || 0);
  const sur = Array.isArray(pricing.surcharges) ? pricing.surcharges.reduce((s, x) => s + Number(x.amount || 0), 0) : 0;
  const discount = Number(pricing.discount || 0);
  return Math.max(0, base + sur - discount);
};

// POST /api/contracts/from-request/:requestId
// Create a draft contract by copying fields from a request
router.post("/contracts/from-request/:requestId", async (req, res, next) => {
  try {
    const r = await Request.findById(req.params.requestId);
    if (!r) return res.status(404).json({ error: "Request not found" });

    const body = req.body || {};
    const pricing = body.pricing || {};
    const total = calcTotal(pricing);

    const c = await new Contract({
      requestId: r._id,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      address: r.address,
      location: r.location,
      movingTime: r.movingTime,
      serviceType: r.serviceType,
      images: r.images,
      pricing: { ...pricing, total },
      terms: body.terms,
      notes: body.notes,
      status: "DRAFT",
    }).save();

    res.status(201).json(c);
  } catch (e) {
    next(e);
  }
});

// GET /api/contracts
router.get("/contracts", async (req, res, next) => {
  try {
    const { requestId, status } = req.query;
    const q = {};
    if (requestId) q.requestId = requestId;
    if (status) q.status = status;
    const list = await Contract.find(q).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// GET /api/contracts/:id
router.get("/contracts/:id", async (req, res, next) => {
  try {
    const c = await Contract.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "Not found" });
    res.json(c);
  } catch (e) {
    next(e);
  }
});

// PATCH /api/contracts/:id (update editable fields while DRAFT)
router.patch("/contracts/:id", async (req, res, next) => {
  try {
    const c = await Contract.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "Not found" });
    if (c.status !== "DRAFT") {
      return res.status(409).json({ error: "Only DRAFT contracts can be edited" });
    }

    const { pricing, terms, notes } = req.body || {};
    if (pricing) {
      c.pricing = { ...c.pricing.toObject?.() ?? c.pricing, ...pricing };
      c.pricing.total = calcTotal(c.pricing);
    }
    if (typeof terms === "string") c.terms = terms;
    if (typeof notes === "string") c.notes = notes;

    await c.save();
    res.json(c);
  } catch (e) {
    next(e);
  }
});

// POST /api/contracts/:id/issue -> ISSUED
router.post("/contracts/:id/issue", async (req, res, next) => {
  try {
    const c = await Contract.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "Not found" });
    if (c.status !== "DRAFT") return res.status(409).json({ error: "Only DRAFT can be issued" });
    c.status = "ISSUED";
    await c.save();
    res.json(c);
  } catch (e) {
    next(e);
  }
});

// POST /api/contracts/:id/accept -> ACCEPTED
router.post("/contracts/:id/accept", async (req, res, next) => {
  try {
    const c = await Contract.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "Not found" });
    if (!["ISSUED", "DRAFT"].includes(c.status)) {
      return res.status(409).json({ error: "Only DRAFT/ISSUED can be accepted" });
    }
    c.status = "ACCEPTED";
    await c.save();
    res.json(c);
  } catch (e) {
    next(e);
  }
});

// POST /api/contracts/:id/reject -> REJECTED
router.post("/contracts/:id/reject", async (req, res, next) => {
  try {
    const c = await Contract.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "Not found" });
    if (!["ISSUED", "DRAFT"].includes(c.status)) {
      return res.status(409).json({ error: "Only DRAFT/ISSUED can be rejected" });
    }
    c.status = "REJECTED";
    await c.save();
    res.json(c);
  } catch (e) {
    next(e);
  }
});

// POST /api/contracts/:id/cancel -> CANCELLED
router.post("/contracts/:id/cancel", async (req, res, next) => {
  try {
    const c = await Contract.findById(req.params.id);
    if (!c) return res.status(404).json({ error: "Not found" });
    if (c.status === "CANCELLED") return res.json(c);
    if (c.status === "ACCEPTED") {
      return res.status(409).json({ error: "Cannot cancel an accepted contract" });
    }
    c.status = "CANCELLED";
    await c.save();
    res.json(c);
  } catch (e) {
    next(e);
  }
});

export default router;


