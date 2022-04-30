const express = require("express");
const router = express.Router();
const authenticateToken = require("./auth");
const StatusCodes = require("http-status-codes").StatusCodes;
const jwtDecode = require("jwt-decode");
const { Reservation } = require("../../models");

router.get("/", authenticateToken, async (req, res) => {
  const accessToken = req.header("authorization");
  const userId = jwtDecode(accessToken).id;

  res.json(await Reservation.find({ user: userId }));
});

router.get("/info", authenticateToken, async (req, res) => {
  if (!req.query.reservationId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      reservationId: {
        msg: "Missing reservation ID",
      },
    });
  }

  const reservation = await Reservation.findOne({
    _id: req.query.reservationId,
  });

  if (!reservation) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      reservationId: {
        msg: "Reservation not found",
      },
    });
  }
  return res.json(reservation);
});

module.exports = router;
