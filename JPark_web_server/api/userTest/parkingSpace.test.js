require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const { describe, beforeAll, afterAll } = require("@jest/globals");
const { ParkingLot, User, Setting, Reservation } = require("../../models");
const jwtDecode = require("jwt-decode");

async function signIn(email, password) {
  return await axios.post(
    "http://localhost/api/user/login",
    { email: email, password: password },
    { validateStatus: () => true }
  );
}

let token = null;
let ps = null;

beforeAll(async () => {
  await mongoose.connect(process.env.DB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const res = await signIn("jeffrey@gmail.com", "12345abcde");
  ps = (await ParkingLot.findOne({})).floors[0].parkingSpaces[0];
  token = res.data.accessToken;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("/", () => {
  async function reqGetParkingSpace(header, params) {
    return axios.get("http://localhost/api/user/parking-space/", {
      validateStatus: () => true,
      headers: header,
      params: params,
    });
  }

  test("Get parking space without token", async () => {
    const res = await reqGetParkingSpace({});
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Get parking space without parkingSpaceId", async () => {
    const res = await reqGetParkingSpace({ authorization: `Bearer ${token}` });
    expect(res.status).toBe(400);
    expect("parkingSpaceId" in res.data).toBe(true);
  });

  test("Get parking space with parkingSpaceId that not exists", async () => {
    const res = await reqGetParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: 123 }
    );
    expect(res.status).toBe(400);
    expect("parkingSpaceId" in res.data).toBe(true);
  });

  test("Get parking space with parkingSpaceId that exists", async () => {
    const res = await reqGetParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: ps._id }
    );
    expect(res.status).toBe(200);
  });
});

describe("/reserve", () => {
  async function reqReserveParkingSpace(header, body) {
    return await axios.post(
      "http://localhost/api/user/parking-space/reserve",
      body,
      { validateStatus: () => true, headers: header }
    );
  }

  beforeAll(async () => {
    const parkingLot = await ParkingLot.findOne({});
    parkingLot.floors[0].parkingSpaces[0].state = "empty";
    await parkingLot.save();
  });

  test("Reserve parking space without token", async () => {
    const headers = {};
    const body = { parkingSpaceId: ps._id, duration: 1 };
    const expected = { status: 401, reason: "token" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space without parkingSpaceId", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { duration: 1 };
    const expected = { status: 400, reason: "parkingSpaceId" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space without parkingSpaceId", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { duration: 1 };
    const expected = { status: 400, reason: "parkingSpaceId" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space without duration", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id };
    const expected = { status: 400, reason: "duration" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space with string type of duration", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, duration: "abc" };
    const expected = { status: 400, reason: "duration" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space with negative duration", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, duration: -1 };
    const expected = { status: 400, reason: "duration" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space for duration that exceed maximum limit", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, duration: 999 };
    const expected = { status: 400, reason: "duration" };
    const parkingLot = await ParkingLot.findOne({});
    parkingLot.floors[0].parkingSpaces[0].state = "empty";
    await parkingLot.save();

    const res = await reqReserveParkingSpace(headers, body);
    console.log(res.data);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space that not exists", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: "abc", duration: -1 };
    const expected = { status: 400, reason: "parkingSpaceId" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space when reservation is disable", async () => {
    const setting = await Setting.findOne({});
    const isReservationEnable = setting.isReservationEnable;
    setting.isReservationEnable = false;
    await setting.save();

    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, duration: 1 };
    const expected = { status: 400, reason: "parkingSpaceId" };

    const res = await reqReserveParkingSpace(headers, body);

    setting.isReservationEnable = isReservationEnable;
    await setting.save();
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space when parking lot is closed", async () => {
    const setting = await Setting.findOne({});
    const day = new Date().getDay();
    const isClosed = setting.operatingHours[day].closed;
    setting.operatingHours[day].closed = true;
    await setting.save();

    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, duration: 1 };
    const expected = { status: 400, reason: "parkingSpaceId" };
    const res = await reqReserveParkingSpace(headers, body);

    setting.operatingHours[day].closed = isClosed;
    await setting.save();

    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space that haven't open", async () => {
    const setting = await Setting.findOne({});
    const dbUser = await User.findOne({ _id: jwtDecode(token).id });
    let parkingLot = await ParkingLot.findOne({});
    let parkingSpace = parkingLot.floors[0].parkingSpaces[0];

    const day = new Date().getDay();
    const dbStartTime = setting.operatingHours[day].startTime;
    parkingSpace.state = "empty";
    dbUser.credits = 10;
    setting.operatingHours[day].open24Hour = false;
    setting.operatingHours[day].startTime = "23:59";

    await setting.save();
    await dbUser.save();
    await parkingLot.save();

    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, userId: dbUser._id, duration: 1 };
    const expected = { status: 400, reason: "duration" };
    const res = await reqReserveParkingSpace(headers, body);

    parkingLot = await ParkingLot.findOne({});
    parkingSpace = parkingLot.floors[0].parkingSpaces[0];
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);

    setting.operatingHours[day].open24Hour = true;
    setting.operatingHours[day].startTime = dbStartTime;
    await setting.save();
  });

  test("Reserve parking space that closed", async () => {
    const setting = await Setting.findOne({});
    const dbUser = await User.findOne({ _id: jwtDecode(token).id });
    let parkingLot = await ParkingLot.findOne({});
    let parkingSpace = parkingLot.floors[0].parkingSpaces[0];

    const day = new Date().getDay();
    const dbEndTime = setting.operatingHours[day].endTime;
    parkingSpace.state = "empty";
    dbUser.credits = 10;
    setting.operatingHours[day].open24Hour = false;
    setting.operatingHours[day].endTime = "00:00";

    await setting.save();
    await dbUser.save();
    await parkingLot.save();

    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, userId: dbUser._id, duration: 1 };
    const expected = { status: 400, reason: "duration" };
    const res = await reqReserveParkingSpace(headers, body);

    parkingLot = await ParkingLot.findOne({});
    parkingSpace = parkingLot.floors[0].parkingSpaces[0];
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);

    setting.operatingHours[day].open24Hour = true;
    setting.operatingHours[day].endTime = dbEndTime;
    await setting.save();
  });

  test("Reserve parking space when the user has not enough balance", async () => {
    const setting = await Setting.findOne({});
    const dbUser = await User.findOne({ _id: jwtDecode(token).id });
    let parkingLot = await ParkingLot.findOne({});
    let parkingSpace = parkingLot.floors[0].parkingSpaces[0];

    const day = new Date().getDay();
    parkingSpace.state = "empty";
    dbUser.credits = 0;
    setting.operatingHours[day].open24Hour = true;

    await setting.save();
    await dbUser.save();
    await parkingLot.save();

    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, userId: dbUser._id, duration: 1 };
    const expected = { status: 400, reason: "duration" };
    const res = await reqReserveParkingSpace(headers, body);

    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space that opens 24 hour", async () => {
    const setting = await Setting.findOne({});
    const dbUser = await User.findOne({ _id: jwtDecode(token).id });
    let parkingLot = await ParkingLot.findOne({});
    let parkingSpace = parkingLot.floors[0].parkingSpaces[0];

    const day = new Date().getDay();
    parkingSpace.state = "empty";
    dbUser.credits = 10;
    setting.operatingHours[day].open24Hour = true;

    await setting.save();
    await dbUser.save();
    await parkingLot.save();

    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, duration: 1 };
    const expected = { status: 200 };
    const res = await reqReserveParkingSpace(headers, body);

    parkingLot = await ParkingLot.findOne({});
    parkingSpace = parkingLot.floors[0].parkingSpaces[0];
    const reservation = parkingSpace.reservation;
    const dbReservation = await Reservation.findOne(reservation.reservationId);

    expect(dbReservation).not.toBeNull();
    expect(res.status).toBe(expected.status);
    expect(parkingSpace.state).toBe("reserved");
  });
});

describe("/unlock", () => {
  async function reqUnlockParkingSpace(header, body) {
    return await axios.post(
      "http://localhost/api/user/parking-space/unlock",
      body,
      { validateStatus: () => true, headers: header }
    );
  }

  let parkingSpace = null;

  beforeAll(async () => {
    const parkingLot = await ParkingLot.findOne({});
    parkingSpace = parkingLot.floors[0].parkingSpaces[0];
    parkingSpace.state = "reserved";

    await parkingLot.save();
  });

  test("Unlock parking space without token", async () => {
    const res = await reqUnlockParkingSpace(
      {},
      { parkingSpaceId: parkingSpace._id }
    );
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Unlock parking space without parkingSpaceId", async () => {
    const res = await reqUnlockParkingSpace(
      { authorization: `Bearer ${token}` },
      {}
    );
    expect(res.status).toBe(400);
    expect("parkingSpaceId" in res.data).toBe(true);
  });

  test("Unlock parking space with parkingSpaceId that is not exists", async () => {
    const res = await reqUnlockParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: "abc" }
    );
    expect(res.status).toBe(400);
    expect("parkingSpaceId" in res.data).toBe(true);
  });

  test("Unlock parking space with valid parkingSpaceId", async () => {
    const res = await reqUnlockParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: parkingSpace._id }
    );
    expect(res.status).toBe(200);
  });
});

describe("/cancel", () => {
  async function reqCancelParkingSpace(header, body) {
    return await axios.post(
      "http://localhost/api/user/parking-space/cancel",
      body,
      { validateStatus: () => true, headers: header }
    );
  }

  let parkingSpace = null;

  beforeAll(async () => {
    const parkingLot = await ParkingLot.findOne({});
    parkingSpace = parkingLot.floors[0].parkingSpaces[0];
    parkingSpace.state = "reserved";

    await parkingLot.save();
  });

  test("Clear parking space without token", async () => {
    const res = await reqCancelParkingSpace(
      {},
      { parkingSpaceId: parkingSpace._id }
    );
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Clear parking space without parkingSpaceId", async () => {
    const res = await reqCancelParkingSpace(
      { authorization: `Bearer ${token}` },
      {}
    );
    expect(res.status).toBe(400);
    expect("parkingSpaceId" in res.data).toBe(true);
  });

  test("Clear parking space with parkingSpaceId that is not exists", async () => {
    const res = await reqCancelParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: "abc" }
    );
    expect(res.status).toBe(400);
    expect("parkingSpaceId" in res.data).toBe(true);
  });

  test("Clear parking space with valid parkingSpaceId", async () => {
    const res = await reqCancelParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: parkingSpace._id }
    );
    expect(res.status).toBe(200);
  });
});

describe("/nearest-to-entrance", () => {
  async function reqGetNearestParkingSpace(header, body) {
    return await axios.get(
      "http://localhost/api/user/parking-space/nearest-to-entrance",
      { validateStatus: () => true, headers: header }
    );
  }

  test("Get nearest parking space without token", async () => {
    const res = await reqGetNearestParkingSpace({});
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Get nearest parking space with token", async () => {
    const res = await reqGetNearestParkingSpace({
      authorization: `Bearer ${token}`,
    });
    expect(res.status).toBe(200);
  });
});

describe("/oku", () => {
  async function reqGetNearestParkingSpace(header, body) {
    return await axios.get("http://localhost/api/user/parking-space/oku", {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Get oku parking space without token", async () => {
    const res = await reqGetNearestParkingSpace({});
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Get oku parking space with token", async () => {
    const res = await reqGetNearestParkingSpace({
      authorization: `Bearer ${token}`,
    });
    expect(res.status).toBe(200);
  });
});
