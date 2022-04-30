const express = require("express");
const authenticateToken = require("./auth");
const router = express.Router();
const { Setting } = require("../../models");

router.get("/", authenticateToken, async (req, res) => {
  res.json(await Setting.findOne({}));
});

module.exports = router;
