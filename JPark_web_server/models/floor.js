const mongoose = require("mongoose");
const ParkingSpaceSchema = require("./parkingSpace").schema;
const MapSchema = require("./map").schema;
const PositionSchema = require("./position").schema;

const FloorSchema = mongoose.Schema({
  _id: { type: Number, required: true },
  name: { type: String, required: true },
  level: { type: Number, required: true },
  levelHeight: { type: Number, required: true },
  map: { type: MapSchema, required: true },
  parkingSpaces: [{ type: ParkingSpaceSchema, required: true }],
  entrances: [
    {
      _id: { type: Number, required: true },
      floorId: { type: Number, required: true },
      name: { type: String, required: true },
      category: { type: String, required: true },
      pos: { type: PositionSchema, required: true },
      coordinate: { type: { lat: { type: Number }, lng: { type: Number } } },
    },
  ],
});

module.exports = mongoose.model("Floor", FloorSchema);
