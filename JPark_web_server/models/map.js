const mongoose = require("mongoose");

const MapSchema = mongoose.Schema(
  {
    _id: { type: String, required: true },
    url: { type: String, required: true },
    scale: { type: Number, required: true },
  },
  { _id: false }
);

module.exports = mongoose.model("Map", MapSchema);
