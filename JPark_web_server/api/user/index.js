const express = require("express");
const router = express.Router();

const user = require("./user");
const parkingLot = require("./parkingLot");
const parkingSpace = require("./parkingSpace");
const wallet = require("./wallet");
const reservations = require("./reservations");
const navigation = require("./navigation");
const setting = require("./setting");

router.use("/", user);
router.use("/parking-lot", parkingLot);
router.use("/parking-space", parkingSpace);
router.use("/wallet", wallet);
router.use("/reservations", reservations);
router.use("/navigation", navigation);
router.use("/setting", setting);

module.exports = router;
