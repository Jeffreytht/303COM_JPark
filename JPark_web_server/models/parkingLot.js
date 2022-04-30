const mongoose = require("mongoose");
const LocationSchema = require("./location").schema;
const CornerSchema = require("./corner").schema;
const FloorSchema = require("./floor").schema;

const ParkingLotSchema = mongoose.Schema(
  {
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    location: { type: LocationSchema, required: true },
    corners: { type: CornerSchema, required: true },
    rotation: { type: Number, required: true },
    pictureUrl: { type: String },
    pictureThumbUrl: { type: String },
    floors: [{ type: FloorSchema, required: true }],
    dimension: {
      type: {
        width: { type: Number },
        length: { type: Number },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ParkingLot", ParkingLotSchema);
