// server/src/services/quotePrice.js

export function calcQuote(input) {
  const { 
    distanceKm = 5, 
    helpers = 2, 
    workers = helpers, // Alias
    vehicleType = "1T", 
    serviceType = "STANDARD", 
    extras = [], 
    addons = extras, // Alias
    items = [],
    climbFloors = 0,
    storageMonths = 0, // Số tháng lưu kho
  } = input;

  // Map vehicleType từ frontend format (0.5T, 1T, 1.25T, 2T, 3.5T) sang internal format
  const vehicleTypeMap = {
    "0.5T": "500kg",
    "1T": "1_ton",
    "1.25T": "1.5_ton",
    "2T": "2_ton",
    "3.5T": "2_ton", // 3.5T dùng giá 2T
  };
  const mappedVehicleType = vehicleTypeMap[vehicleType] || "1_ton";

  const vehicleRates = {
    "500kg": 8000,
    "1_ton": 10000,
    "1.5_ton": 12000,
    "2_ton": 14000,
  };

  // Giá tối thiểu theo loại xe
  const minTripFees = {
    "500kg": 350000,
    "1_ton": 450000,
    "1.5_ton": 500000,
    "2_ton": 600000,
  };

  const workerRate = 150000; // 150k/người
  const expressMultiplier = serviceType === "EXPRESS" ? 1.5 : 1;

  // Map extras từ frontend (wrap, disassemble, climb, clean, storage) sang internal
  const extraFees = {
    wrap: 50000,           // Gói đồ kỹ
    disassemble: 80000,    // Tháo/lắp nội thất
    climb: 10000,          // Vận chuyển tầng cao (per floor, xử lý riêng)
    clean: 100000,         // Vệ sinh
    storage: 300000,       // Lưu kho (per month, xử lý riêng)
  };

  // Tính phí vận chuyển theo km
  const perKm = vehicleRates[mappedVehicleType] || 10000;
  const vehicleFee = distanceKm * perKm;
  const minTripFee = minTripFees[mappedVehicleType] || 350000;
  const finalVehicleFee = Math.max(vehicleFee, minTripFee); // Lấy max(km × giá/km, giá tối thiểu)

  // Tính nhân công
  const laborFee = workers * workerRate;

  // Tính dịch vụ thêm
  let extrasFee = 0;
  for (const extra of extras) {
    if (extra === "climb" && climbFloors > 0) {
      extrasFee += extraFees.climb * climbFloors; // 10k × số tầng
    } else if (extra === "storage" && storageMonths > 0) {
      extrasFee += extraFees.storage * storageMonths; // 300k × số tháng
    } else if (extra !== "storage" && extraFees[extra]) {
      extrasFee += extraFees[extra];
    }
  }

  // Tính phí theo thể tích đồ dùng (nếu có)
  let itemFee = 0;
  if (items && items.length > 0) {
    itemFee = items.reduce((sum, it) => {
      if (it.length && it.width && it.height) {
        const vol = (parseFloat(it.length) * parseFloat(it.width) * parseFloat(it.height)) / 1000000; // m³
        return sum + vol * 50000; // 50k VND/m³
      }
      return sum;
    }, 0);
  }

  // Tổng phụ
  const subtotal = finalVehicleFee + laborFee + extrasFee + itemFee;
  const total = Math.round(subtotal * expressMultiplier);

  return {
    distanceKm,
    durationMin: input.durationMin || distanceKm * 2, // Ước tính 2 phút/km
    perKm,
    vehicleFee: finalVehicleFee,
    minTripFee,
    laborFee,
    extrasFee,
    itemFee,
    subtotal,
    total,
    breakdown: {
      vehicleFee: finalVehicleFee,
      laborFee,
      extrasFee,
      itemFee,
      subtotal,
      total,
    },
  };
}
