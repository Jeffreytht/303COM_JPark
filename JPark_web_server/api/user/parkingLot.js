const express = require("express");
const router = express.Router();
const authenticateToken = require("./auth");
const { ParkingLot } = require("../../models");

router.get("/", authenticateToken, async (req, res) => {
  const parkingLot = await ParkingLot.findOne({});
  res.json(parkingLot);
});

router.get("/location", authenticateToken, async (req, res) => {
  const parkingLot = await ParkingLot.findOne(
    {},
    "corners location dimension rotation"
  );
  res.json(parkingLot);
});

module.exports = router;
