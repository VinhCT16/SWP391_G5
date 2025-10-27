import express from "express";
import Quote from "../models/Quote.js";
import { calcQuote } from "../services/quotePrice.js";
import { calcDistanceFromORS, haversineDistance } from "../utils/distance.js";

const router = express.Router();

// 🔧 DEBUG nhanh (giữ lại tạm thời để test)
/* GET /api/quotes/_debug */
router.get("/_debug", (req, res) => res.json({ ok: true, where: "/api/quotes/_debug" }));

/* POST /api/quotes/estimate */
router.post("/estimate", async (req, res) => {
  try {
    const { pickupLocation, deliveryLocation, manualDistanceKm, ...input } = req.body;
    let dist = null;

    if (pickupLocation && deliveryLocation) {
      dist = await calcDistanceFromORS(pickupLocation, deliveryLocation);
    }
    if (!dist && manualDistanceKm) {
      dist = { distanceKm: manualDistanceKm, durationMin: manualDistanceKm * 2 };
    }
    if (!dist && pickupLocation && deliveryLocation) {
      const distanceKm = haversineDistance(pickupLocation, deliveryLocation);
      dist = { distanceKm, durationMin: distanceKm * 2 };
    }
    if (!dist) return res.status(400).json({ message: "Không tính được khoảng cách." });

    const breakdown = calcQuote({ ...input, ...dist });
    res.json({ ...breakdown, distanceKm: dist.distanceKm, durationMin: dist.durationMin });
  } catch (e) {
    console.error("Estimate error:", e);
    res.status(500).json({ message: "Estimate failed" });
  }
});

router.post("/", async (req, res) => {
  try {
    const quote = await Quote.create(req.body);
    res.json(quote);
  } catch (e) {
    console.error("Create quote error:", e);
    res.status(500).json({ message: "Create quote failed" });
  }
});

router.get("/request/:requestId", async (req, res) => {
  try {
    const quotes = await Quote.find({ requestId: req.params.requestId });
    res.json(quotes);
  } catch (e) {
    console.error("Get quotes error:", e);
    res.status(500).json({ message: "Get quotes failed" });
  }
});

router.post("/:id/negotiate", async (req, res) => {
  try {
    const { price, from } = req.body;
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: "Không tìm thấy báo giá" });

    if (!quote.negotiationHistory) quote.negotiationHistory = [];
    quote.negotiationHistory.push({ from, price });
    quote.status = "NEGOTIATING";
    await quote.save();
    res.json(quote);
  } catch (e) {
    console.error("Negotiation error:", e);
    res.status(500).json({ message: "Negotiation failed" });
  }
});

router.post("/:id/confirm", async (req, res) => {
  try {
    const { finalPrice } = req.body;
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: "Không tìm thấy báo giá" });

    quote.finalPrice = finalPrice;
    quote.status = "STAFF_CONFIRMED";
    await quote.save();
    res.json(quote);
  } catch (e) {
    console.error("Confirm error:", e);
    res.status(500).json({ message: "Confirm failed" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ message: "Không tìm thấy báo giá" });
    res.json(quote);
  } catch (e) {
    console.error("Get quote error:", e);
    res.status(500).json({ message: "Get quote failed" });
  }
});

export default router;
