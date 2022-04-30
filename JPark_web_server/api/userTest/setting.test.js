require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const { describe, beforeAll, afterAll } = require("@jest/globals");

async function signIn(email, password) {
  return await axios.post(
    "http://localhost/api/user/login",
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
  const res = await signIn("jeffrey@gmail.com", "12345abcde");
  token = res.data.accessToken;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("/", () => {
  async function reqGetReservations(header, body) {
    return await axios.get("http://localhost/api/user/setting/", {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Get setting without token", async () => {
    const res = await reqGetReservations({});
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Get setting with token", async () => {
    const res = await reqGetReservations({
      authorization: `Bearer ${token}`,
    });
    expect(res.status).toBe(200);
  });
});
