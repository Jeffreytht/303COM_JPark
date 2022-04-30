const mongoose = require("mongoose");
const ReservationSchema = require("./reservation");
const ReloadSchema = require("./reload");

const UserSchema = mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    email: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    refreshToken: { type: String },
    contactNum: { type: String, required: true },
    credits: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
