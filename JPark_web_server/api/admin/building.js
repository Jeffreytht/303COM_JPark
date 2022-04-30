require("dotenv").config();
const express = require("express");
const https = require("https");
const StatusCodes = require("http-status-codes").StatusCodes;
const router = express.Router();
const {
  ParkingLot,
  Location,
  Corner,
  Floor,
  Map,
  ParkingSpace,
  Position,
} = require("../../models");
const authenticateToken = require("./auth");

const baseURL = "dashboard.situm.com";

/**
 * Send HTTP Request to situm
 * @param {Object} headers HTTP header
 * @param {String} path Url Path
 * @param {String} method Request method
 * @returns
 */
function sendHTTPRequest(headers, path, method) {
  const options = {
    hostname: baseURL,
    path: path,
    port: 443,
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  options.headers = { ...options.headers, ...headers };

  return new Promise((resolve, reject) => {
    const httpReq = https.request(options, (res) => {
      let chunks = "";

      res.on("data", (data) => {
        chunks += data;
      });

      res.on("error", (error) => {
        const jsonRes = JSON.parse(error.toString("utf-8"));
        reject({
          ...{
            status: res.statusCode,
          },
          ...{ data: jsonRes },
        });
      });

      res.on("end", () => {
        const jsonRes = JSON.parse(chunks.toString("utf-8"));
        resolve({
          ...{
            status: res.statusCode,
          },
          ...{ data: jsonRes },
        });
      });
    });

    httpReq.write("");
    httpReq.end();
  });
}

/**
 * Get JWT Token from SITUM
 * @param {Response} res Express response
 * @returns JWT Token if atuthenticated successfully else empty string
 */
async function getJWTToken(res) {
  const headers = {
    "X-API-EMAIL": `${process.env.SITUM_API_EMAIL}`,
    "X-API-KEY": `${process.env.SITUM_API_KEY}`,
  };

  try {
    const jwtRes = await sendHTTPRequest(
      headers,
      "/api/v1/auth/access_tokens",
      "POST"
    );

    if (!(jwtRes.status >= 200 && jwtRes.status < 300)) {
      res.status(jwtRes.status).send(jwtRes.message);
      return "";
    }

    if (!jwtRes.data.access_token) {
      res.sendStatus(StatusCodes.UNAUTHORIZED);
      return "";
    }

    return jwtRes.data.access_token;
  } catch {
    res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get all buildings from SITUM
 * @param {Response} res Express Response
 * @param {String} token SITUM JWT Token
 * @returns buildings if valid otherwise empty string
 */
async function getBuildings(res, token) {
  const headers = {
    "Content-Type": "applicaiton/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const buildingRes = await sendHTTPRequest(
      headers,
      "/api/v1/buildings",
      "GET"
    );

    if (!(buildingRes.status >= 200 && buildingRes.status < 300)) {
      res.status(jwtRes.status).send(jwtRes.message);
      return "";
    }

    return buildingRes.data[0];
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
}

/**
 * Get all floors from SITUM
 * @param {Response} res Express response
 * @param {String} token JWT Token
 * @param {int} buildingID Floors's building id
 * @returns floors if valid otherwise empty string
 */
async function getFloors(res, token, buildingID) {
  const headers = {
    "Content-Type": "applicaiton/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const floorsRes = await sendHTTPRequest(
      headers,
      `/api/v1/buildings/${buildingID}/floors`,
      "GET"
    );

    if (!(floorsRes.status >= 200 && floorsRes.status < 300)) {
      res.status(floorsRes.status).send(floorsRes.message);
      return "";
    }

    return floorsRes.data;
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
}

/**
 * Get all pois from SITUM
 * @param {Response} res  Express response
 * @param {String} token JWT Token
 * @param {int} buildingID POI's building id
 * @returns pois if valid otherwise empty string
 */
async function getPOIs(res, token, buildingID) {
  const headers = {
    "Content-Type": "applicaiton/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const poisRes = await sendHTTPRequest(
      headers,
      `/api/v1/buildings/${buildingID}/pois`,
      "GET"
    );

    if (!(poisRes.status >= 200 && poisRes.status < 300)) {
      res.status(poisRes.status).send(poisRes.message);
      return "";
    }

    return poisRes.data;
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
}

/**
 * Export data to the local database (MongoDB)
 * @param {Object} building Building object
 * @param {Array} floors Array of floors
 * @param {Array} pois  Array of pois
 */
async function exportDataToLocalDB(building, floors, pois) {
  //* Create mongoose model
  parkingSpacesModel = [];
  entrancesModel = [];
  for (let poi of pois) {
    if (poi.category_id === 5)
      parkingSpacesModel.push(
        new ParkingSpace({
          _id: poi.id,
          name: poi.name,
          floorId: poi.position.floor_id,
          category: poi.category_name,
          coordinate: poi.position.georeferences,
          isOKU:
            poi.custom_fields.length !== 0 &&
            poi.custom_fields[0].key === "OKU" &&
            poi.custom_fields[0].value === "true",
          pos: new Position({
            x: poi.position.x,
            y: poi.position.y,
          }),
          cost: 0,
          state: "empty",
        })
      );
    else if (poi.category_id === 3) {
      entrancesModel.push({
        _id: poi.id,
        name: poi.name,
        floorId: poi.position.floor_id,
        category: poi.category_name,
        coordinate: poi.position.georeferences,
        pos: new Position({
          x: poi.position.x,
          y: poi.position.y,
        }),
      });
    }
  }

  floorModel = [];
  for (let floor of floors) {
    floorModel.push(
      new Floor({
        _id: floor.id,
        name: floor.name,
        level: floor.level,
        levelHeight: floor.level_height,
        map: new Map({
          _id: floor.maps.map_id,
          url: floor.maps.map_url,
          scale: floor.maps.scale,
        }),
        parkingSpaces: parkingSpacesModel.filter(
          (parkingSpace) => parkingSpace.floorId == floor.id
        ),
        entrances: entrancesModel.filter(
          (entrance) => entrance.floorId == floor.id
        ),
      })
    );
  }

  const parkingLot = new ParkingLot({
    _id: building.id,
    name: building.name,
    location: new Location({
      lat: building.location.lat,
      lng: building.location.lng,
    }),
    corners: new Corner({
      topLeft: new Location({
        lat: building.corners[0].lat,
        lng: building.corners[0].lng,
      }),
      topRight: new Location({
        lat: building.corners[1].lat,
        lng: building.corners[1].lng,
      }),
      bottomRight: new Location({
        lat: building.corners[2].lat,
        lng: building.corners[2].lng,
      }),
      bottomLeft: new Location({
        lat: building.corners[3].lat,
        lng: building.corners[3].lng,
      }),
    }),
    rotation: building.rotation,
    pictureUrl: building.picture_url,
    pictureThumbUrl: building.picture_thumb_url,
    floors: floorModel,
    dimension: building.dimensions,
  });

  //* Update or insert if not exists
  const filter = { _id: building.id };
  const update = { ...parkingLot };
  const options = { upsert: true, useFindAndModify: false };
  await ParkingLot.findOneAndUpdate(filter, update, options);
}

//* Import all the data from SITUM to local db
router.post("/import", authenticateToken, async (req, res) => {
  let token = await getJWTToken(res);
  if (!token) return;

  let building = await getBuildings(res, token);
  if (!building) return;
  if (!building.id) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send("No id in building");
  }

  let floors = await getFloors(res, token, building.id);
  if (!floors) return;

  let pois = await getPOIs(res, token, building.id);
  if (!pois) return;

  await exportDataToLocalDB(building, floors, pois);
  return res.status(StatusCodes.OK).send("Data imported successfully");
});

module.exports = router;
