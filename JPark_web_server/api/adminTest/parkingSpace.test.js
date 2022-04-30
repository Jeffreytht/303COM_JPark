require("dotenv").config();
const axios = require("axios");
const { describe, beforeAll, afterAll } = require("@jest/globals");
const { Reservation, ParkingLot, User, Setting } = require("../../models");
const mongoose = require("mongoose");

async function signIn(email, password) {
  return await axios.post(
    "http://localhost/api/admin/user/login",
    { email: email, password: password },
    { validateStatus: () => true }
  );
}

async function getPSIdAfterSetState(state) {
  const parkingLot = await ParkingLot.findOne({});
  const ps = parkingLot.floors[0].parkingSpaces[0];
  ps.state = state;

  await parkingLot.save();
  return ps._id;
}

let token = null;

beforeAll(async () => {
  await mongoose.connect(process.env.DB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  token = (await signIn("tanhoetheng@gmail.com", "123456")).data.accessToken;
});

afterAll(async () => {
  await mongoose.connection.close();
});

// *Clear
describe("/clear", () => {
  async function reqClearParkingSpace(header, body) {
    return await axios.post(
      "http://localhost/api/admin/parking-space/clear",
      body,
      { validateStatus: () => true, headers: header }
    );
  }

  test("Clear parking space without token", async () => {
    const res = await reqClearParkingSpace({}, {});
    expect(res.status).toBe(401);
  });

  test("Clear parking space without providing parkingSpaceId", async () => {
    const res = await reqClearParkingSpace(
      { authorization: `Bearer ${token}` },
      {}
    );
    expect(res.status).toBe(400);
    expect("parkingSpaceId" in res.data).toBe(true);
  });

  test("Clear parking space that is already empty", async () => {
    const psId = await getPSIdAfterSetState("empty");

    const res = await reqClearParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: psId }
    );

    expect(res.status).toBe(400);
    expect("parkingSpaceId" in res.data).toBe(true);
  });

  test("Clear parking space that is occupied", async () => {
    const psId = await getPSIdAfterSetState("occupied");
    const res = await reqClearParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: psId }
    );

    expect(res.status).toBe(400);
    expect("parkingSpaceId" in res.data).toBe(true);
  });

  test("Clear parking space that is unoccupied", async () => {
    const psId = await getPSIdAfterSetState("unoccupied");
    const res = await reqClearParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: psId }
    );

    expect(res.status).toBe(400);
    expect("parkingSpaceId" in res.data).toBe(true);
  });

  test("Clear parking space that is reserved", async () => {
    const psId = await getPSIdAfterSetState("reserved");
    const res = await reqClearParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: psId }
    );

    expect(res.status).toBe(200);
  });

  test("Clear parking space that is not exist", async () => {
    const res = await reqClearParkingSpace(
      { authorization: `Bearer ${token}` },
      { parkingSpaceId: "0000" }
    );

    expect(res.status).toBe(400);
  });
});

describe("/Reserve", () => {
  let ps = null;
  let user = null;

  beforeAll(async () => {
    ps = (await ParkingLot.findOne({})).floors[0].parkingSpaces[0];
    user = await User.findOne({});
  });

  async function reqReserveParkingSpace(header, body) {
    return await axios.post(
      "http://localhost/api/admin/parking-space/reserve",
      body,
      { validateStatus: () => true, headers: header }
    );
  }

  test("Reserve parking space without token", async () => {
    const headers = {};
    const body = { parkingSpaceId: ps._id, userId: user._id, duration: 1 };
    const expected = { status: 401, reason: "token" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space without parkingSpaceId", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { userId: user._id, duration: 1 };
    const expected = { status: 400, reason: "parkingSpaceId" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space without parkingSpaceId", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { userId: user._id, duration: 1 };
    const expected = { status: 400, reason: "parkingSpaceId" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space without userId", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, duration: 1 };
    const expected = { status: 400, reason: "userId" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space without duration", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, userId: user._id };
    const expected = { status: 400, reason: "duration" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space with string type of duration", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, userId: user._id, duration: "abc" };
    const expected = { status: 400, reason: "duration" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space with negative duration", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, userId: user._id, duration: -1 };
    const expected = { status: 400, reason: "duration" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space for duration that exceed maximum limit", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, userId: user._id, duration: 999 };
    const expected = { status: 400, reason: "duration" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space that not exists", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: "abc", userId: user._id, duration: -1 };
    const expected = { status: 400, reason: "parkingSpaceId" };
    const res = await reqReserveParkingSpace(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space with user that not exists", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const body = { parkingSpaceId: ps._id, userId: "abc", duration: 1 };
    const expected = { status: 400, reason: "userId" };
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
    const body = { parkingSpaceId: ps._id, userId: user._id, duration: 1 };
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
    const body = { parkingSpaceId: ps._id, userId: user._id, duration: 1 };
    const expected = { status: 400, reason: "parkingSpaceId" };
    const res = await reqReserveParkingSpace(headers, body);

    setting.operatingHours[day].closed = isClosed;
    await setting.save();

    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Reserve parking space that opens 24 hour", async () => {
    const setting = await Setting.findOne({});
    const dbUser = await User.findOne({ _id: user._id });
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
    const body = { parkingSpaceId: ps._id, userId: dbUser._id, duration: 1 };
    const expected = { status: 200 };
    const res = await reqReserveParkingSpace(headers, body);

    parkingLot = await ParkingLot.findOne({});
    parkingSpace = parkingLot.floors[0].parkingSpaces[0];
    const reservation = parkingSpace.reservation;
    const dbReservation = await Reservation.findOne(reservation.reservationId);

    expect(dbReservation).not.toBeNull();
    expect(res.status).toBe(expected.status);
    expect(parkingSpace.state).toBe("reserved");

    parkingSpace.state = "empty";
    await parkingLot.save();
    await Reservation.deleteOne({
      _id: parkingSpace.reservation.reservationId,
    });
  });

  test("Reserve parking space that haven't open", async () => {
    const setting = await Setting.findOne({});
    const dbUser = await User.findOne({ _id: user._id });
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
    const dbUser = await User.findOne({ _id: user._id });
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
    const dbUser = await User.findOne({ _id: user._id });
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
});
