const io = require("socket.io")(3002, {
  cors: { origin: "*" },
});
const { notifyPSChanged, notifyPSStatistic } = require("./realTime");
const { ParkingLot } = require("../../models");

io.on("connection", (socket) => {
  console.log("Parking lot connected");
  socket.on("park", async (id) => {
    const parkingLot = await ParkingLot.findOne({
      "floors.parkingSpaces._id": id,
    });

    if (!parkingLot) return console.log("Parking space not found");

    let ps = null;
    for (const floor of parkingLot.floors) {
      if (ps === null)
        for (const parkingSpace of floor.parkingSpaces) {
          if (parkingSpace._id === id) {
            ps = parkingSpace;
            break;
          }
        }
    }

    if (ps.state !== "unoccupied")
      return console.log("Parking space not unlocked");

    ps.state = "occupied";
    await parkingLot.save();
    notifyPSChanged(ps);
    await notifyPSStatistic();
  });

  socket.on("leave", async (id) => {
    const parkingLot = await ParkingLot.findOne({
      "floors.parkingSpaces._id": id,
    });

    if (!parkingLot) return console.log("Parking space not found");

    let ps = null;
    for (const floor of parkingLot.floors) {
      if (ps === null)
        for (const parkingSpace of floor.parkingSpaces) {
          if (parkingSpace._id === id) {
            ps = parkingSpace;
            break;
          }
        }
    }

    if (ps.state !== "occupied") {
      return console.log("No vehicle is detected at the parking space.");
    }

    ps.state = "empty";
    await parkingLot.save();
    notifyPSChanged(ps);
    await notifyPSStatistic();
  });
});

module.exports = io;
