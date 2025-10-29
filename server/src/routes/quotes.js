// server/src/routes/quotes.js
import express from "express";
import Quote from "../models/Quote.js";
import { calcQuote } from "../services/quotePrice.js";
import { calcDistanceFromORS, haversineDistance } from "../utils/distance.js";

const router = express.Router();

/** 🔧 Kiểm tra API sống */
router.get("/_ping", (req, res) => res.json({ ok: true, message: "Quotes API ready" }));

/** 📦 Ước tính báo giá (POST /api/quotes/estimate) */
router.post("/estimate", async (req, res) => {
  try {
    const { pickupLocation, deliveryLocation, manualDistanceKm, ...input } = req.body;
    let dist = null;

    // Ưu tiên gọi ORS để tính km và thời gian
    if (pickupLocation && deliveryLocation) {
      dist = await calcDistanceFromORS(pickupLocation, deliveryLocation);
    }

    // Fallback: tự tính bằng haversine
    if (!dist && pickupLocation && deliveryLocation) {
      const distanceKm = haversineDistance(pickupLocation, deliveryLocation);
      dist = { distanceKm, durationMin: distanceKm * 2 };
    }

    // Nếu không có kết quả nào → lỗi
    if (!dist) return res.status(400).json({ message: "Không tính được khoảng cách." });

    const breakdown = calcQuote({ ...input, ...dist });
    res.json({
      ok: true,
      ...breakdown,
      distanceKm: dist.distanceKm,
      durationMin: dist.durationMin,
      routeGeojson: dist.geojson || null,
    });
  } catch (e) {
    console.error("Estimate error:", e);
    res.status(500).json({ message: "Estimate failed" });
  }
});

/** 📥 Lưu báo giá */
router.post("/", async (req, res) => {
  try {
    const quote = await Quote.create(req.body);
    res.json(quote);
  } catch (e) {
    console.error("Create quote error:", e);
    res.status(500).json({ message: "Create quote failed" });
  }
});

export default router;
