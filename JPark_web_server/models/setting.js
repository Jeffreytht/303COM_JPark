const mongoose = require("mongoose");

const SettingSchema = mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    operatingHours: [
      {
        startTime: { type: String },
        endTime: { type: String },
        open24Hour: { type: Boolean },
        closed: { type: Boolean },
      },
    ],
    reservationFeePerHour: { type: Number },
    maxReservationDuration: { type: Number },
    isReservationEnable: { type: Boolean },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", SettingSchema);
