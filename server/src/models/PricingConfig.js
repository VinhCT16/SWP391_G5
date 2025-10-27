// server/src/models/PricingConfig.js (ESM)
import mongoose from "mongoose";

const PricingConfigSchema = new mongoose.Schema(
  {
    pricePerKmByVehicle: {
      truck_750kg: { type: Number, default: 12000 },
      truck_1t25: { type: Number, default: 14000 },
      truck_2t: { type: Number, default: 17000 },
    },
    minTripFeeByVehicle: {
      truck_750kg: { type: Number, default: 350000 },
      truck_1t25: { type: Number, default: 450000 },
      truck_2t: { type: Number, default: 600000 },
    },
    laborHourly: { type: Number, default: 90000 },
    loadingTimePerItemMin: { type: Number, default: 6 },
    packingFees: {
      customer_self_pack: { type: Number, default: 0 },
      standard_pack: { type: Number, default: 50000 },
      premium_pack: { type: Number, default: 90000 },
    },
    speedMultiplier: {
      standard: { type: Number, default: 1.0 },
      express: { type: Number, default: 1.3 },
    },
    stairsSurchargePerFloor: { type: Number, default: 10000 },
    nightSurchargeRate: { type: Number, default: 0.15 },
  },
  { collection: "pricing_config" }
);

const PricingConfig = mongoose.model("pricing_config", PricingConfigSchema);
export default PricingConfig;
