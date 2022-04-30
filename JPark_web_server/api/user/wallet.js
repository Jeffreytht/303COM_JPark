const StatusCodes = require("http-status-codes").StatusCodes;
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const { User, Reload } = require("../../models");
const { body, validationResult } = require("express-validator");
const authenticateToken = require("./auth");
const jwtDecode = require("jwt-decode");

const reloadValidation = [
  body("credit", "Missing credit").exists(),
  body("credit", "Credit must be in between 10 - 1000").isInt({
    min: 10,
    max: 1000,
  }),
];

router.post(
  "/reload",
  authenticateToken,
  reloadValidation,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
    }

    const accessToken = req.header("authorization");
    const userId = jwtDecode(accessToken).id;

    const user = await User.findOne({ _id: userId });
    user.credits = user.credits + parseInt(req.body.credit);

    const reload = new Reload({
      _id: new mongoose.Types.ObjectId(),
      credit: parseInt(req.body.credit),
      status: "Completed",
      description: "Reload credits",
      user: userId,
    });

    await reload.save();
    await user.save();
    return res.sendStatus(StatusCodes.OK);
  }
);

router.get("/history", authenticateToken, async (req, res) => {
  const accessToken = req.header("authorization");
  const userId = jwtDecode(accessToken).id;

  return res.json(await Reload.find({ user: userId }));
});

module.exports = router;
