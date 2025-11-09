// server/src/routes/quotes.js
import express from "express";
import Quote from "../models/Quote.js";
import { calcQuote } from "../services/quotePrice.js";
import { calcDistanceFromORS, haversineDistance } from "../utils/distance.js";

const router = express.Router();

/** Kiểm tra API  */
router.get("/_ping", (req, res) => res.json({ ok: true, message: "Quotes API ready" }));

/** Ước tính báo giá (POST /api/quotes/estimate) */
router.post("/estimate", async (req, res) => {
  try {
    const { pickupLocation, deliveryLocation, manualDistanceKm, ...input } = req.body;
    
    console.log("📥 [Quote Estimate] Nhận được request:", {
      hasPickupLocation: !!pickupLocation,
      hasDeliveryLocation: !!deliveryLocation,
      pickupLocation: pickupLocation ? (pickupLocation.lat ? `${pickupLocation.lat}, ${pickupLocation.lng}` : "GeoJSON") : "null",
      deliveryLocation: deliveryLocation ? (deliveryLocation.lat ? `${deliveryLocation.lat}, ${deliveryLocation.lng}` : "GeoJSON") : "null",
      vehicleType: input.vehicleType,
      helpers: input.helpers,
      extras: input.extras,
      items: input.items?.length || 0,
    });
    
    // Validate locations
    if (!pickupLocation || !deliveryLocation) {
      console.error("❌ [Quote Estimate] Thiếu locations:", { pickupLocation: !!pickupLocation, deliveryLocation: !!deliveryLocation });
      return res.status(400).json({ message: "Thiếu thông tin địa chỉ (pickupLocation hoặc deliveryLocation)." });
    }
    
    // Convert GeoJSON sang {lat, lng} nếu cần
    let pickup = pickupLocation;
    let delivery = deliveryLocation;
    
    if (pickupLocation.type === "Point" && Array.isArray(pickupLocation.coordinates)) {
      pickup = { lat: pickupLocation.coordinates[1], lng: pickupLocation.coordinates[0] };
    }
    if (deliveryLocation.type === "Point" && Array.isArray(deliveryLocation.coordinates)) {
      delivery = { lat: deliveryLocation.coordinates[1], lng: deliveryLocation.coordinates[0] };
    }
    
    // Validate format
    if (typeof pickup.lat !== "number" || typeof pickup.lng !== "number" ||
        typeof delivery.lat !== "number" || typeof delivery.lng !== "number") {
      console.error("❌ [Quote Estimate] Location format không đúng:", { pickup, delivery });
      return res.status(400).json({ message: "Định dạng địa chỉ không đúng. Cần {lat, lng} hoặc GeoJSON Point." });
    }
    
    let dist = null;

    // Ưu tiên gọi ORS để tính km và thời gian
    if (pickup && delivery) {
      dist = await calcDistanceFromORS(pickup, delivery);
    }

    // Fallback: tự tính bằng haversine
    if (!dist && pickup && delivery) {
      const distanceKm = haversineDistance(pickup, delivery);
      dist = { distanceKm, durationMin: distanceKm * 2 };
    }

    // Nếu không có kết quả nào → lỗi
    if (!dist) {
      console.error("❌ [Quote Estimate] Không tính được khoảng cách");
      return res.status(400).json({ message: "Không tính được khoảng cách." });
    }

    console.log("✅ [Quote Estimate] Đã tính khoảng cách:", {
      distanceKm: dist.distanceKm,
      durationMin: dist.durationMin,
    });

    const breakdown = calcQuote({ ...input, ...dist });
    
    console.log("✅ [Quote Estimate] Đã tính quote:", {
      total: breakdown.total,
      vehicleFee: breakdown.vehicleFee,
      laborFee: breakdown.laborFee,
      extrasFee: breakdown.extrasFee,
      itemFee: breakdown.itemFee,
    });
    
    res.json({
      ok: true,
      ...breakdown,
      distanceKm: dist.distanceKm,
      durationMin: dist.durationMin,
      routeGeojson: dist.geojson || null,
    });
  } catch (e) {
    console.error("❌ [Quote Estimate] Error:", e);
    res.status(500).json({ message: "Estimate failed: " + (e.message || "Unknown error") });
  }
});

/**  Lưu báo giá */
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
