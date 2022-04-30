const mongoose = require("mongoose");
const User = require("./user");

const ReloadSchema = mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    credit: { type: Number, required: true },
    status: { type: String, required: true },
    description: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reload", ReloadSchema);
