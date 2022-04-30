require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const { describe, beforeAll, afterAll } = require("@jest/globals");
const { Setting } = require("../../models");

async function signIn(email, password) {
  return await axios.post(
    "http://localhost/api/admin/user/login",
    { email: email, password: password },
    { validateStatus: () => true }
  );
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

describe("/operating-hour", () => {
  async function reqPutOperatingHour(header, body) {
    return axios.put(
      "http://localhost/api/admin/setting/operating-hour",
      body,
      { validateStatus: () => true, headers: header }
    );
  }

  test("Update operating hour without token", async () => {
    const setting = await Setting.findOne({});
    const headers = {};
    const body = setting.operatingHours;
    const expected = { status: 401, reason: "token" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour without providing operatingHour", async () => {
    const setting = await Setting.findOne({});
    const headers = { Authorization: `Bearer ${token}` };
    const body = setting.operatingHours;
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with empty object", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = { operatingHour: {} };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with empty array", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = { operatingHour: {} };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with 8 days", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = { operatingHour: [{}, {}, {}, {}, {}, {}, {}, {}] };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with 7 empty object", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = { operatingHour: [{}, {}, {}, {}, {}, {}, {}] };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with no startTime", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          endTime: "10:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with no endTime", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "18:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with no open24Hour", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "18:00",
          endTime: "19:00",
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with no closed", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "18:00",
          endTime: "19:00",
          open24Hour: true,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with same startTime and endTime", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "19:00",
          endTime: "19:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour's startTime with hour that exceeds 23", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "30:00",
          endTime: "40:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour's startTime with negative hour", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "-1:00",
          endTime: "23:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour's endTime with hour that exceeds 23", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "23:00",
          endTime: "24:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour's endTime with negative hour", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "23:00",
          endTime: "24:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour's startTime with minute that exceeds 59", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "22:60",
          endTime: "23:10",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour's startTime with negative minute", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "22:-1",
          endTime: "23:10",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour's endTime with minute that exceeds 59", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "23:00",
          endTime: "23:60",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour's endTime with negative minute", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "23:00",
          endTime: "23:-1",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with start hour after end hour", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "23:00",
          endTime: "22:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });

  test("Update operating hour with start minute after end minute", async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      operatingHour: [
        {
          startTime: "22:50",
          endTime: "22:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "18:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
        {
          startTime: "10:00",
          endTime: "20:00",
          open24Hour: true,
          closed: false,
        },
      ],
    };
    const expected = { status: 400, reason: "operatingHour" };
    const res = await reqPutOperatingHour(headers, body);
    expect(res.status).toBe(expected.status);
    expect(expected.reason in res.data).toBe(true);
  });
});

describe("/", () => {
  async function reqGetSetting(header) {
    return axios.get("http://localhost/api/admin/setting/", {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Get setting without token", async () => {
    const res = await reqGetSetting({});
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Get setting with token", async () => {
    const res = await reqGetSetting({ Authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
  });
});

describe("/reservation", () => {
  async function reqUpdateReservation(header, body) {
    return axios.put("http://localhost/api/admin/setting/reservation", body, {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Update reservation without token", async () => {
    const res = await reqUpdateReservation({}, { isReservationEnable: true });
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Update reservation without providing isReservationEnable", async () => {
    const res = await reqUpdateReservation(
      { authorization: `Bearer ${token}` },
      {}
    );
    expect(res.status).toBe(400);
    expect("isReservationEnable" in res.data).toBe(true);
  });

  test("Update reservation with invalid type of isReservationEnable", async () => {
    const res = await reqUpdateReservation(
      { authorization: `Bearer ${token}` },
      { isReservationEnable: "abc" }
    );
    expect(res.status).toBe(400);
    expect("isReservationEnable" in res.data).toBe(true);
  });

  test("Update reservation with valid isReservationEnable", async () => {
    const res = await reqUpdateReservation(
      { authorization: `Bearer ${token}` },
      { isReservationEnable: true }
    );
    expect(res.status).toBe(200);
  });
});

describe("/reservation-fee", () => {
  async function reqUpdateReservationFee(header, body) {
    return axios.put(
      "http://localhost/api/admin/setting/reservation-fee",
      body,
      {
        validateStatus: () => true,
        headers: header,
      }
    );
  }

  test("Update reservation fee without token", async () => {
    const res = await reqUpdateReservationFee({}, { reservationFeePerHour: 1 });
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Update reservation fee with invalid type of value", async () => {
    const res = await reqUpdateReservationFee(
      {
        authorization: `Bearer ${token}`,
      },
      { reservationFeePerHour: "abc" }
    );
    expect(res.status).toBe(400);
    expect("reservationFeePerHour" in res.data).toBe(true);
  });

  test("Update reservation fee with negative value", async () => {
    const res = await reqUpdateReservationFee(
      {
        authorization: `Bearer ${token}`,
      },
      { reservationFeePerHour: -1 }
    );
    expect(res.status).toBe(400);
    expect("reservationFeePerHour" in res.data).toBe(true);
  });

  test("Update reservation fee with valid value", async () => {
    const res = await reqUpdateReservationFee(
      {
        authorization: `Bearer ${token}`,
      },
      { reservationFeePerHour: 1 }
    );
    expect(res.status).toBe(200);
  });
});

describe("/reservation-duration", () => {
  async function reqUpdateReservationDuration(header, body) {
    return axios.put(
      "http://localhost/api/admin/setting/reservation-duration",
      body,
      {
        validateStatus: () => true,
        headers: header,
      }
    );
  }

  test("Update reservation duration without token", async () => {
    const res = await reqUpdateReservationDuration(
      {},
      { maxReservationDuration: 1 }
    );
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Update reservation duration with negative value", async () => {
    const res = await reqUpdateReservationDuration(
      { authorization: `Bearer ${token}` },
      { maxReservationDuration: -1 }
    );

    expect(res.status).toBe(400);
    expect("maxReservationDuration" in res.data).toBe(true);
  });

  test("Update reservation duration with invalid type of value", async () => {
    const res = await reqUpdateReservationDuration(
      { authorization: `Bearer ${token}` },
      { maxReservationDuration: "abc" }
    );

    expect(res.status).toBe(400);
    expect("maxReservationDuration" in res.data).toBe(true);
  });

  test("Update reservation duration with valid value", async () => {
    const res = await reqUpdateReservationDuration(
      { authorization: `Bearer ${token}` },
      { maxReservationDuration: 1 }
    );

    expect(res.status).toBe(200);
  });
});
