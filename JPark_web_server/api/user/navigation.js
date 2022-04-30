const express = require("express");
const router = express.Router();

router.post("/entry", (req, res) => {
  const fs = require("fs");
  if (!fs.existsSync("navigation.txt")) {
    fs.writeFileSync("navigation.txt", "");
  }

  fs.appendFileSync("navigation.txt", JSON.stringify(req.body.msg) + "\n");
  res.sendStatus(200);
});

module.exports = router;
