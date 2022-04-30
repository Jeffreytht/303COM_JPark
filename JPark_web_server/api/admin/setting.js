const express = require("express");
const authenticateToken = require("./auth");
const router = express.Router();
const { Setting } = require("../../models");
const { body, validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");

const operatingHourValidation = [
  body("operatingHour", "Missing operatingHour").exists(),
];

const reservationEnableValidation = [
  body("isReservationEnable", "Missing isReservationEnable").exists(),
];

const reservationFeeValidation = [
  body("reservationFeePerHour", "Missing reservationFeePerHour").exists(),
  body("reservationFeePerHour", "Invalid reservation fee per hour").isFloat({
    min: 0,
  }),
];

const reservationDurationValidation = [
  body("maxReservationDuration", "Missing maxReservationDuration").exists(),
  body("maxReservationDuration", "Invalid value").isInt({
    min: 1,
    max: 24,
  }),
];

router.put(
  "/operating-hour",
  authenticateToken,
  operatingHourValidation,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
    }

    try {
      const operatingHour = req.body.operatingHour;
      if (!Array.isArray(operatingHour) || operatingHour.length !== 7) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          operatingHour: {
            msg: "Invalid operatingHour",
            value: req.body.operatingHour,
          },
        });
      }

      for (const obj of operatingHour) {
        if (
          !(
            "startTime" in obj &&
            "endTime" in obj &&
            "open24Hour" in obj &&
            "closed" in obj &&
            typeof obj.open24Hour === "boolean" &&
            typeof obj.closed === "boolean"
          )
        ) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            operatingHour: {
              msg: "Invalid operating hour",
              value: req.body.operatingHour,
            },
          });
        }

        if (!obj.startTime.match(/^\d{1,2}:\d\d$/))
          return res.status(StatusCodes.BAD_REQUEST).json({
            operatingHour: {
              msg: "Invalid start time",
              value: req.body.operatingHour,
            },
          });

        if (!obj.endTime.match(/^\d{1,2}:\d\d$/))
          return res.status(StatusCodes.BAD_REQUEST).json({
            operatingHour: {
              msg: "Invalid end time",
              value: req.body.operatingHour,
            },
          });

        const [endHour, endMinute] = obj.endTime.split(":").map(Number);
        const [startHour, startMinute] = obj.startTime.split(":").map(Number);

        if (
          startHour < 0 ||
          startHour > 23 ||
          startMinute < 0 ||
          startMinute > 59
        ) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            operatingHour: {
              msg: "Invalid start time",
              value: req.body.operatingHour,
            },
          });
        }

        if (endHour < 0 || endHour > 23 || endMinute < 0 || endMinute > 59) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            operatingHour: {
              msg: "Invalid end time",
              value: req.body.operatingHour,
            },
          });
        }

        if (
          startHour > endHour ||
          (startHour === endHour && startMinute >= endMinute)
        ) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            operatingHour: {
              msg: "End time must be after start time",
              value: req.body.operatingHour,
            },
          });
        }
      }

      await Setting.findOneAndUpdate(
        {},
        { operatingHours: req.body.operatingHour },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
      return res.sendStatus(StatusCodes.OK);
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        operatingHour: {
          msg: "Invalid value " + err,
          value: req.body.operatingHour,
        },
      });
    }
  }
);

router.get("/", authenticateToken, async (req, res) => {
  res.json(await Setting.findOne({}));
});

router.put(
  "/reservation",
  authenticateToken,
  reservationEnableValidation,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
    }

    if (typeof req.body.isReservationEnable !== "boolean") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        isReservationEnable: {
          msg: "Invalid value ",
          value: req.body.isReservationEnable,
        },
      });
    }

    await Setting.findOneAndUpdate(
      {},
      { isReservationEnable: req.body.isReservationEnable },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.sendStatus(StatusCodes.OK);
  }
);

router.put(
  "/reservation-fee",
  authenticateToken,
  reservationFeeValidation,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
    }

    await Setting.findOneAndUpdate(
      {},
      {
        reservationFeePerHour: parseFloat(
          req.body.reservationFeePerHour
        ).toFixed(2),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.sendStatus(StatusCodes.OK);
  }
);

router.put(
  "/reservation-duration",
  authenticateToken,
  reservationDurationValidation,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
    }

    await Setting.findOneAndUpdate(
      {},
      {
        maxReservationDuration: parseInt(req.body.maxReservationDuration),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.sendStatus(StatusCodes.OK);
  }
);

module.exports = router;
