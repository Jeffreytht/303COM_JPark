const mongoose = require("mongoose");

const PositionSchema = mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  {
    _id: false,
  }
);

module.exports = mongoose.model("Position", PositionSchema);
