const express = require("express");
const authenticateToken = require("./auth");
const router = express.Router();
const { ParkingLot } = require("../../models");
const StatusCodes = require("http-status-codes").StatusCodes;

let psChangesClients = [];
let psStatisticClients = [];

function notifyPSChanged(ps) {
  psChangesClients.forEach((client) => {
    client.response.write(`event: message\n`);
    client.response.write(`data: ${JSON.stringify(ps)}\n\n`);
  });
}

async function notifyPSStatistic() {
  const parkingSpaces = await ParkingLot.aggregate([
    { $unwind: "$floors" },
    { $unwind: "$floors.parkingSpaces" },
    { $project: { "floors.parkingSpaces": 1 } },
  ]);

  let statistic = {
    empty: 0,
    reserved: 0,
    occupied: 0,
  };

  for (const parkingSpace of parkingSpaces) {
    const state = parkingSpace.floors.parkingSpaces.state;
    switch (state) {
      case "empty":
        statistic.empty += 1;
        break;
      case "reserved":
        statistic.reserved += 1;
        break;
      case "occupied":
      case "unoccupied":
        statistic.occupied += 1;
        break;
    }
  }

  psStatisticClients.forEach((client) => {
    client.response.write(`event: message\n`);
    client.response.write(`data: ${JSON.stringify(statistic)}\n\n`);
  });
}

router.get("/parking-spaces-changes", async (req, res) => {
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response: res,
  };

  psChangesClients.push(newClient);
  console.log(
    `New client with client id ${clientId} subscribed to parking space changes. There is currently ${psChangesClients.length} clients.`
  );

  req.on("close", () => {
    psChangesClients = psChangesClients.filter(
      (client) => client.id !== clientId
    );
  });

  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  res.writeHead(StatusCodes.OK, headers);
});

router.get("/parking-spaces-statistic", async (req, res) => {
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response: res,
  };

  psStatisticClients.push(newClient);
  console.log(
    `New client with client id ${clientId} subscribed to statistic. There is currently ${psStatisticClients.length} clients.`
  );

  req.on("close", () => {
    psStatisticClients = psChangesClients.filter(
      (client) => client.id !== clientId
    );
  });

  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };

  res.writeHead(StatusCodes.OK, headers);
  await notifyPSStatistic();
});

module.exports = {
  realTime: router,
  notifyPSChanged: notifyPSChanged,
  notifyPSStatistic: notifyPSStatistic,
};
