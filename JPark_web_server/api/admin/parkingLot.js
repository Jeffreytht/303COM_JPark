const express = require("express");
const router = express.Router();
const authenticateToken = require("./auth");
const { ParkingLot, Reservation } = require("../../models");
const StatusCodes = require("http-status-codes").StatusCodes;

router.get("/parking-spaces", authenticateToken, async (req, res) => {
  const result = await ParkingLot.aggregate([
    { $unwind: "$floors" },
    { $unwind: "$floors.parkingSpaces" },
    {
      $project: {
        "floors.parkingSpaces": 1,
        "floors.name": 1,
      },
    },
  ]);

  res.json(result);
});

router.get("/", authenticateToken, async (req, res) => {
  const parkingLot = await ParkingLot.findOne().exec();

  if (!parkingLot)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("You are required to import data from setting");

  return res.status(StatusCodes.OK).json(parkingLot);
});

router.get("/reservations-count", authenticateToken, async (req, res) => {
  const endDate = new Date();
  const date = new Date();
  date.setDate(endDate.getDate() - 7);

  const dayTime = 24 * 60 * 60 * 1000;
  const startDate = new Date(Math.floor(date.getTime() / dayTime) * dayTime);
  const reservation = await Reservation.find({
    dateTime: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  res.json(reservation);
});

module.exports = router;
