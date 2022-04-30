const express = require("express");
const mongoose = require("mongoose");
const StatusCodes = require("http-status-codes").StatusCodes;
const authenticateToken = require("./auth");
const { ParkingLot, User, Reservation, Setting } = require("../../models");
const { body, validationResult } = require("express-validator");
const { notifyPSChanged, notifyPSStatistic } = require("./realTime");
const io = require("./socket");

const router = express.Router();

const reserveValidation = [
  body("parkingSpaceId", "Missing parkingSpaceId").exists(),
  body("userId", "Missing userId").exists(),
  body("duration", "Missing duration").exists(),
  body("parkingSpaceId", "Invalid parkingSpaceId").isNumeric(),
  body("userId", "Invalid userId").isMongoId(),
  body("duration", "Invalid duration").isInt({ min: 1 }),
];

const clearValidation = [
  body("parkingSpaceId", "Missing parkingSpaceId").exists(),
  body("parkingSpaceId", "Invalid parkingSpaceId").isNumeric(),
];

const parkValidation = [
  body("parkingSpaceId", "Missing parkingSpaceId").exists(),
  body("parkingSpaceId", "Invalid parkingSpaceId").isNumeric(),
];

const unlockValidation = [
  body("parkingSpaceId", "Missing parkingSpaceId").exists(),
  body("parkingSpaceId", "Invalid parkingSpaceId").isNumeric(),
];

const putReserveValidation = [
  body("parkingSpaceId", "Missing parkingSpaceId").exists(),
  body("parkingSpaceId", "Invalid parkingSpaceId").isNumeric(),
  body("duration", "Missing duration").exists(),
  body("duration", "Invalid duration").isNumeric(),
];

router.post("/clear", clearValidation, authenticateToken, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty())
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

  const parkingLot = await ParkingLot.findOne({
    "floors.parkingSpaces._id": req.body.parkingSpaceId,
  });

  if (!parkingLot)
    return res.status(StatusCodes.BAD_REQUEST).json({
      parkingSpaceId: {
        msg: "Parking space not found",
      },
    });

  let ps = null;
  for (const floor of parkingLot.floors) {
    if (ps !== null) break;
    for (const parkingSpace of floor.parkingSpaces) {
      if (parkingSpace._id === req.body.parkingSpaceId) {
        ps = parkingSpace;
        break;
      }
    }
  }

  if (ps.state === "empty") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      parkingSpaceId: {
        msg: "Already empty",
      },
    });
  }

  if (ps.state === "occupied" || ps.state === "unoccupied") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      parkingSpaceId: {
        msg: "A vehicle is detected at the parking space.",
      },
    });
  }

  ps.state = "empty";

  if (ps.reservation) {
    const reservationId = ps.reservation.reservationId;
    const reservation = await Reservation.findOne({ _id: reservationId });

    if (reservation) {
      reservation.status = "Cancelled";
      await reservation.save();
    }
  }

  notifyPSChanged(ps);
  await parkingLot.save();
  await notifyPSStatistic();
  io.emit("clear", ps._id);

  return res.sendStatus(StatusCodes.OK);
});

router.post(
  "/reserve",
  authenticateToken,
  reserveValidation,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty())
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

    const parkingLot = await ParkingLot.findOne({
      "floors.parkingSpaces._id": req.body.parkingSpaceId,
    });

    if (!parkingLot)
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Parking space not found",
      });

    let ps = null;
    for (const floor of parkingLot.floors) {
      if (ps === null)
        for (const parkingSpace of floor.parkingSpaces) {
          if (parkingSpace._id === req.body.parkingSpaceId) {
            ps = parkingSpace;
            break;
          }
        }
    }

    let user = await User.findById({ _id: req.body.userId });
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "User not found",
      });
    }

    if (ps.state === "reserved") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Already reserved",
      });
    }

    if (ps.state === "occupied" || ps.state === "unoccupied") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        error: "A vehicle is detected at the parking space.",
      });
    }

    const setting = await Setting.findOne({});
    const date = new Date(Math.floor(Date.now() / 60000) * 60000);

    if (setting.isReservationEnable === false) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        parkingSpaceId: {
          msg: "Reservation is disabled",
        },
      });
    }

    const operatingHour = setting.operatingHours[date.getDay()];
    if (operatingHour.closed === true) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        parkingSpaceId: {
          msg: `Parking lot is closed`,
        },
      });
    }

    if (operatingHour.open24Hour === false) {
      let [startH, startMin] = operatingHour.startTime[0]
        .split(":")
        .map(Number);
      let [endH, endMin] = operatingHour.endTime[0].split(":").map(Number);

      if (
        startH > date.getHours() ||
        (startH === date.getHours() && startMin > date.getMinutes())
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          duration: {
            msg: `Parking lot haven't open`,
          },
        });
      }

      if (
        endH < date.getHours() ||
        (endH === date.getHours() && endMin < date.getMinutes())
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          duration: {
            msg: `Parking lot closed`,
          },
        });
      }
    }

    if (req.body.duration > setting.maxReservationDuration) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        duration: {
          msg: `Maximum reservation duration is ${setting.maxReservationDuration} hour`,
        },
      });
    }

    const reservationFee =
      parseInt(req.body.duration) * parseInt(setting.reservationFeePerHour);
    if (user.credits < reservationFee) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        duration: {
          msg: `Insufficient credit balance`,
        },
      });
    }

    ps.state = "reserved";
    const reservation = new Reservation({
      _id: mongoose.Types.ObjectId(),
      dateTime: date,
      duration: req.body.duration,
      cost: reservationFee,
      status: "Active",
      parkingSpace: ps._id,
      parkingSpaceName: ps.name,
      user: user._id,
    });

    ps.reservation = {
      _id: user._id,
      username: user.username,
      email: user.email,
      contactNum: user.contactNum,
      duration: req.body.duration,
      dateTime: date,
      reservationId: reservation._id,
    };

    user.credits -= reservationFee;

    await user.save();
    await reservation.save();
    await parkingLot.save();
    await notifyPSStatistic();

    notifyPSChanged(ps);
    io.emit("reserve", ps._id);

    res.sendStatus(StatusCodes.OK);
  }
);

router.post(
  "/unlock",
  unlockValidation,
  authenticateToken,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty())
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

    const parkingLot = await ParkingLot.findOne({
      "floors.parkingSpaces._id": req.body.parkingSpaceId,
    });

    if (!parkingLot)
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Parking space not found",
      });

    let ps = null;
    for (const floor of parkingLot.floors) {
      if (ps === null)
        for (const parkingSpace of floor.parkingSpaces) {
          if (parkingSpace._id === req.body.parkingSpaceId) {
            ps = parkingSpace;
            break;
          }
        }
    }
    if (ps.state === "unoccupied") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Already unlocked.",
      });
    }

    if (ps.state === "empty") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Parking space is not reserved.",
      });
    }

    if (ps.state === "occupied") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        error: "A vehicle is detected at the parking space.",
      });
    }

    ps.state = "unoccupied";
    notifyPSChanged(ps);
    await parkingLot.save();
    await notifyPSStatistic();
    io.emit("unlock", ps._id);

    return res.sendStatus(StatusCodes.OK);
  }
);

router.post("/park", parkValidation, authenticateToken, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty())
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

  const parkingLot = await ParkingLot.findOne({
    "floors.parkingSpaces._id": req.body.parkingSpaceId,
  });

  if (!parkingLot)
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Parking space not found",
    });

  let ps = null;
  for (const floor of parkingLot.floors) {
    if (ps === null)
      for (const parkingSpace of floor.parkingSpaces) {
        if (parkingSpace._id === req.body.parkingSpaceId) {
          ps = parkingSpace;
          break;
        }
      }
  }

  if (ps.state !== "unoccupied")
    return res
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .json({ error: "Parking space not unlocked" });

  ps.state = "occupied";
  await parkingLot.save();
  await notifyPSStatistic();
  notifyPSChanged(ps);

  return res.sendStatus(StatusCodes.OK);
});

router.post("/leave", clearValidation, authenticateToken, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty())
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

  const parkingLot = await ParkingLot.findOne({
    "floors.parkingSpaces._id": req.body.parkingSpaceId,
  });

  if (!parkingLot)
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Parking space not found",
      parkingSpaceId: req.body.parkingSpaceId,
    });

  let ps = null;
  for (const floor of parkingLot.floors) {
    if (ps === null)
      for (const parkingSpace of floor.parkingSpaces) {
        if (parkingSpace._id === req.body.parkingSpaceId) {
          ps = parkingSpace;
          break;
        }
      }
  }

  if (ps.state !== "occupied") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      error: "No vehicle is detected at the parking space.",
    });
  }

  ps.state = "empty";
  await parkingLot.save();
  notifyPSChanged(ps);
  await notifyPSStatistic();

  return res.sendStatus(StatusCodes.OK);
});

router.put(
  "/reserve",
  putReserveValidation,
  authenticateToken,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(StatusCoeds.BAD_REQUEST).json(err.mapped());
    }

    const parkingLot = await ParkingLot.findOne({
      "floors.parkingSpaces._id": req.body.parkingSpaceId,
    });

    if (!parkingLot)
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Parking space not found",
      });

    let ps = null;
    for (const floor of parkingLot.floors) {
      if (ps === null)
        for (const parkingSpace of floor.parkingSpaces) {
          if (parkingSpace._id === req.body.parkingSpaceId) {
            ps = parkingSpace;
            break;
          }
        }
    }

    if (ps.state !== "reserved") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Operation not allowed",
      });
    }

    ps.reservation = { ...ps.reservation, duration: req.body.duration };

    await parkingLot.save();
    notifyPSChanged(ps);
    return res.sendStatus(StatusCodes.OK);
  }
);

module.exports = router;
