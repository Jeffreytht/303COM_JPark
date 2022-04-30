require("dotenv").config();

// Express
const express = require("express");
const app = express();
const apiPort = 3001;
const admin = require("./admin");
const user = require("./user");
const cors = require("cors");
const io = require("./admin/socket");
var cron = require("node-cron");
const Reservation = require("../models/reservation");
const ParkingLot = require("../models/parkingLot");

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);
app.use("/api/admin", admin);
app.use("/api/user", user);

// MongoDB
const mongoose = require("mongoose");
const mongoDB = process.env.DB_CONNECTION_STRING;

mongoose
  .connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(apiPort, () =>
      console.log(`Server is listening at http://localhost:${apiPort}`)
    );
  })
  .catch((error) => console.log(error));

var task = cron.schedule("* * * * *", async () => {
  const reservations = await Reservation.find({});

  reservations.forEach(async (reservation) => {
    if (reservation.status !== "Active") return;

    if (
      Date.now() >
      new Date(reservation.dateTime).getTime() +
        reservation.duration * 60 * 60 * 1000
    ) {
      reservation.status = "Expired";
      await reservation.save();

      const parkingLot = await ParkingLot.findOne({});
      for (const floor of parkingLot.floors) {
        for (const parkingSpace of floor.parkingSpaces) {
          if (parkingSpace._id === reservation.parkingSpace) {
            parkingSpace.state = "empty";
          }
        }
      }

      await parkingLot.save();
      console.log(`Reservation at ${reservation.parkingSpaceName} was expired`);
    }
  });
});

task.start();
