const mongoose = require("mongoose");
const PositionSchema = require("./position").schema;

const ParkingSpaceSchema = mongoose.Schema(
  {
    _id: { type: Number, required: true },
    floorId: { type: Number, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    pos: { type: PositionSchema, required: true },
    coordinate: { type: { lat: { type: Number }, lng: { type: Number } } },
    cost: { type: Number, required: true },
    state: { type: String, required: true },
    isOKU: { type: Boolean, required: true },
    reservation: {
      type: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: { type: String, required: true },
        email: { type: String, required: true },
        contactNum: { type: String, required: true },
        duration: { type: Number, required: true },
        dateTime: { type: Date, default: new Date() },
        reservationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Reservation",
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ParkingSpace", ParkingSpaceSchema);
