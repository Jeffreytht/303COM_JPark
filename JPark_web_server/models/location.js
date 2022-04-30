const mongoose = require("mongoose");

const LocationSchema = mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

module.exports = mongoose.model("Location", LocationSchema);
