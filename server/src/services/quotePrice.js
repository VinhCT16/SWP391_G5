// server/src/services/quotePrice.js

export function calcQuote(input) {
  const { distanceKm = 5, workers = 2, vehicleType = "1_ton", serviceType = "STANDARD", addons = [], items = [] } = input;

  const vehicleRates = {
    "500kg": 8000,
    "1_ton": 10000,
    "1.5_ton": 12000,
    "2_ton": 14000,
  };
  const workerRate = 150000;
  const expressMultiplier = serviceType === "EXPRESS" ? 1.5 : 1;

  const addonFees = {
    pack: 100000,
    disassemble: 80000,
    lift: 120000,
    clean: 100000,
    storage: 200000,
  };

  const vehicleFee = distanceKm * (vehicleRates[vehicleType] || 10000);
  const laborFee = workers * workerRate;
  const addonFee = addons.reduce((sum, k) => sum + (addonFees[k] || 0), 0);

  const itemFee = items.reduce((sum, it) => {
    const vol = (it.width * it.height * it.length) / 1000000;
    return sum + vol * 50000;
  }, 0);

  const subtotal = vehicleFee + laborFee + addonFee + itemFee;
  const total = Math.round(subtotal * expressMultiplier);

  return { distanceKm, vehicleFee, laborFee, addonFee, itemFee, total };
}
