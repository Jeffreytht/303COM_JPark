require("dotenv").config();
const axios = require("axios");
const { describe, beforeAll } = require("@jest/globals");

async function signIn(email, password) {
  return await axios.post(
    "http://localhost/api/user/login",
    { email: email, password: password },
    { validateStatus: () => true }
  );
}

let token = null;
beforeAll(async () => {
  const res = await signIn("jeffrey@gmail.com", "12345abcde");
  token = res.data.accessToken;
});

describe("/", () => {
  async function reqGetParkingLot(header) {
    return axios.get("http://localhost/api/user/parking-lot/", {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Get parking lot without token", async () => {
    const res = await reqGetParkingLot({});
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Get parking lot with token", async () => {
    const res = await reqGetParkingLot({ authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
  });
});

describe("/location", () => {
  async function reqGetParkingLotLocation(header) {
    return axios.get("http://localhost/api/user/parking-lot/location", {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Get parking lot's location without token", async () => {
    const res = await reqGetParkingLotLocation({});
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Get parking lot's location with token", async () => {
    const res = await reqGetParkingLotLocation({
      authorization: `Bearer ${token}`,
    });
    expect(res.status).toBe(200);
  });
});
