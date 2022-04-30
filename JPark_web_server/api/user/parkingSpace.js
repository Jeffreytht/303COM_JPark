const express = require("express");
const router = express.Router();
const StatusCodes = require("http-status-codes").StatusCodes;
const mongoose = require("mongoose");
const authenticateToken = require("./auth");
const {
  User,
  ParkingLot,
  Reservation,
  Setting,
  Reload,
} = require("../../models");
const io = require("../admin/socket");
const jwtDecode = require("jwt-decode");
const { body, validationResult } = require("express-validator");
const { notifyPSChanged, notifyPSStatistic } = require("../admin/realTime");

const reserveValidation = [
  body("parkingSpaceId", "Missing parkingSpaceId").exists(),
  body("duration", "Missing duration").exists(),
  body("parkingSpaceId", "Invalid parkingSpaceId").isNumeric(),
  body("duration", "Invalid duration").isInt({ min: 1 }),
];

const unlockValidation = [
  body("parkingSpaceId", "Missing parkingSpaceId").exists(),
  body("parkingSpaceId", "Invalid parkingSpaceId").isNumeric(),
];

const cancelValidation = [
  body("parkingSpaceId", "Missing parkingSpaceId").exists(),
  body("parkingSpaceId", "Invalid parkingSpaceId").isNumeric(),
];

async function getParkingSpace(id) {
  const parkingLot = await ParkingLot.findOne({});
  for (const floor of parkingLot.floors)
    for (const parkingSpace of floor.parkingSpaces)
      if (parkingSpace._id === id) return [parkingLot, parkingSpace];
  return null;
}

async function getUserFromToken(token) {
  const userId = jwtDecode(token).id;
  return await User.findById({ _id: userId });
}

router.get("/", authenticateToken, async (req, res) => {
  if (!req.query.parkingSpaceId)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ parkingSpaceId: { msg: "Missing parkingSpaceId" } });

  const parkingLot = await ParkingLot.findOne({});
  const targetId = parseInt(req.query.parkingSpaceId);

  for (const floor of parkingLot.floors) {
    for (const ps of floor.parkingSpaces) {
      if (ps._id === targetId) {
        let data = JSON.parse(JSON.stringify(ps));
        return res.json({
          ...data,
          floorId: floor._id,
          floorName: floor.name,
          floorMap: floor.map.url,
        });
      }
    }
  }

  res
    .status(StatusCodes.BAD_REQUEST)
    .json({ parkingSpaceId: { msg: "Parking space not found" } });
});

router.post(
  "/reserve",
  authenticateToken,
  reserveValidation,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty())
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

    let parkingSpace = await getParkingSpace(req.body.parkingSpaceId);
    if (parkingSpace === null)
      return res.status(StatusCodes.BAD_REQUEST).json({
        parkingSpaceId: {
          msg: "Parking space not found",
        },
      });
    const [parkingLot, ps] = parkingSpace;

    const token = req.header("authorization").split(" ")[1];
    const user = await getUserFromToken(token);
    if (user === null)
      return res.status(StatusCodes.BAD_REQUEST).json({
        userId: {
          msg: "User not found",
        },
      });

    if (ps.state !== "empty")
      return res.status(StatusCodes.BAD_REQUEST).json({
        parkingSpaceId: {
          msg: "Reservation failed.",
        },
      });

    const setting = await Setting.findOne({});
    const date = new Date(Math.floor(Date.now() / 60000) * 60000);

    if (setting.isReservationEnable === false) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        parkingSpaceId: {
          msg: `Parking lot is closed`,
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
      let [startH, startMin] = operatingHour.startTime.split(":").map(Number);
      let [endH, endMin] = operatingHour.endTime.split(":").map(Number);

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

    const duration = parseInt(req.body.duration);
    if (duration > setting.maxReservationDuration)
      return res.status(StatusCodes.BAD_REQUEST).json({
        duration: {
          msg: `Maximum reservation duration is ${setting.maxReservationDuration} hour`,
        },
      });

    let reservationFee = parseInt(setting.reservationFeePerHour);
    reservationFee *= duration;

    if (user.credits < reservationFee)
      return res.status(StatusCodes.BAD_REQUEST).json({
        duration: {
          msg: `Insufficient credit balance`,
        },
      });

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

    const reload = new Reload({
      _id: new mongoose.Types.ObjectId(),
      credit: -reservationFee,
      description: `Reserve parking space: ${ps.name}`,
      status: "Completed",
      user: user._id,
    });

    user.credits -= reservationFee;

    await user.save();
    await reload.save();
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

    const token = req.header("authorization");
    const user = await getUserFromToken(token);

    let parkingSpace = await getParkingSpace(req.body.parkingSpaceId);
    if (parkingSpace === null)
      return res.status(StatusCodes.BAD_REQUEST).json({
        parkingSpaceId: {
          msg: "Parking space not found",
        },
      });
    const [parkingLot, ps] = parkingSpace;

    if (ps.reservation._id != user._id.toString())
      return res.status(StatusCodes.BAD_REQUEST).json({
        userId: {
          msg: "Parking space is not belong to the user",
        },
      });

    if (ps.state !== "reserved") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Unlock failed",
      });
    }

    const reservationId = ps.reservation.reservationId.toString();
    const reservation = await Reservation.findOne({ _id: reservationId });

    if (!reservation)
      return res.status(StatusCodes.BAD_REQUEST).json({
        parkingSpaceId: {
          msg: "Reservation not found",
        },
      });

    ps.state = "unoccupied";
    reservation.status = "Completed";

    await parkingLot.save();
    await reservation.save();
    await notifyPSStatistic();
    notifyPSChanged(ps);
    io.emit("unlock", ps._id);

    return res.sendStatus(StatusCodes.OK);
  }
);

router.post(
  "/cancel",
  cancelValidation,
  authenticateToken,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty())
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

    let parkingSpace = await getParkingSpace(req.body.parkingSpaceId);
    if (parkingSpace === null)
      return res.status(StatusCodes.BAD_REQUEST).json({
        parkingSpaceId: {
          msg: "Parking space not found",
        },
      });
    const [parkingLot, ps] = parkingSpace;

    if (ps.state !== "reserved") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        error: "Cancellation failed",
      });
    }

    ps.state = "empty";

    const reservationId = ps.reservation.reservationId;
    const reservation = await Reservation.findOne({ _id: reservationId });
    reservation.status = "Cancelled";

    notifyPSChanged(ps);
    await reservation.save();
    await parkingLot.save();
    await notifyPSStatistic();
    io.emit("clear", ps._id);

    return res.sendStatus(StatusCodes.OK);
  }
);

function getDistance(pos1, pos2) {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
}

router.get("/nearest-to-entrance", authenticateToken, async (req, res) => {
  const parkingLot = await ParkingLot.findOne({});
  const entrances = [];
  const parkingSpaces = [];

  for (const floor of parkingLot.floors) {
    for (const entrance of floor.entrances) entrances.push(entrance);
    for (const parkingSpace of floor.parkingSpaces) {
      if (parkingSpace.state !== "empty") continue;
      parkingSpaces.push(parkingSpace);
    }
  }

  if (parkingSpaces.length === 0) return res.json({});

  let distance = Number.MAX_VALUE;
  let ps = null;

  for (const entrance of entrances) {
    for (const parkingSpace of parkingSpaces) {
      if (entrance.floorId !== parkingSpace.floorId) continue;
      const dist = getDistance(parkingSpace.pos, entrance.pos);
      if (dist >= distance) continue;
      distance = dist;
      ps = parkingSpace;
    }
  }

  if (ps === null) {
    return res.json(parkingSpaces[0]);
  }

  res.json(ps);
});

router.get("/oku", authenticateToken, async (req, res) => {
  const parkingLot = await ParkingLot.findOne({});

  for (const floor of parkingLot.floors) {
    for (const parkingSpace of floor.parkingSpaces) {
      if (parkingSpace.state !== "empty" || parkingSpace.isOKU === false)
        continue;
      return res.json(parkingSpace);
    }
  }

  return res.json({});
});

module.exports = router;
