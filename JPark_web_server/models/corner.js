const mongoose = require("mongoose");
const LocationSchema = require("./location").schema;

const CornerSchema = mongoose.Schema(
  {
    topLeft: { type: LocationSchema, required: true },
    topRight: { type: LocationSchema, required: true },
    bottomLeft: { type: LocationSchema, required: true },
    bottomRight: { type: LocationSchema, required: true },
  },
  { _id: false }
);

module.exports = mongoose.model("Corner", CornerSchema);
