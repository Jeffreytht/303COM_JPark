const mongoose = require("mongoose");
const ParkingSpace = require("./parkingSpace");
const User = require("./user");

const ReservationSchema = mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    dateTime: { type: Date, default: Date.now() },
    duration: { type: Number, required: true },
    cost: { type: Number, required: true },
    status: { type: String, required: true },
    parkingSpace: { type: Number, ref: "ParkingSpace" },
    parkingSpaceName: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", ReservationSchema);
