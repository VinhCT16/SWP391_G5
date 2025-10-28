// server/src/services/quotePrice.js

export function calcQuote(input, config = {}) {
  const distanceKm = input.distanceKm;
  const durationMin = input.durationMin;
  const workers = input.workers || 2;
  const vehicle = input.vehicleType;
  const packOption = input.packOption;
  const speed = input.speed;

  // Base đơn giản (sau có thể lấy từ PricingConfig)
  const basePricePerKm = config.pricePerKm || 10000;
  const baseLabor = config.laborPerWorker || 100000;
  const basePack = { customer_self_pack: 0, standard_pack: 200000, premium_pack: 400000 };
  const speedMultiplier = speed === "express" ? 1.5 : 1;

  const distanceFee = distanceKm * basePricePerKm;
  const laborFee = workers * baseLabor;
  const packingFee = basePack[packOption] || 0;

  // tính phí tầng từ items
  const stairsFee = (input.items || []).reduce(
    (acc, item) => acc + (item.floorsFrom + item.floorsTo) * 10000 * (item.qty || 1),
    0
  );

  const nightFee = 0; // có thể mở rộng theo giờ

  const total = (distanceFee + laborFee + packingFee + stairsFee + nightFee) * speedMultiplier;

  return {
    distanceFee,
    laborFee,
    packingFee,
    stairsFee,
    nightFee,
    speedMultiplier,
    total: Math.round(total),
  };
}
