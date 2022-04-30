const express = require("express");
const router = express.Router();

const building = require("./building");
const parkingSpace = require("./parkingSpace");
const user = require("./user");
const { realTime } = require("./realTime");
const parkingLot = require("./parkingLot");
const setting = require("./setting");

router.use("/building", building);
router.use("/parking-space", parkingSpace);
router.use("/user", user);
router.use("/real-time", realTime);
router.use("/parking-lot", parkingLot);
router.use("/setting", setting);

module.exports = router;
