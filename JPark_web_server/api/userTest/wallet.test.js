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

describe("/reload", () => {
  async function reqPostReload(header, body) {
    return await axios.post("http://localhost/api/user/wallet/reload", body, {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Reload without token", async () => {
    const res = await reqPostReload({}, { credit: 10 });
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Reload credit with invalid value", async () => {
    const res = await reqPostReload(
      {
        authorization: `Bearer ${token}`,
      },
      { credit: "abc" }
    );
    expect(res.status).toBe(400);
    expect("credit" in res.data).toBe(true);
  });

  test("Reload credit with value less than the minimum credit", async () => {
    const res = await reqPostReload(
      {
        authorization: `Bearer ${token}`,
      },
      { credit: 0 }
    );
    expect(res.status).toBe(400);
    expect("credit" in res.data).toBe(true);
  });

  test("Reload credit with value more than the maximum credit", async () => {
    const res = await reqPostReload(
      {
        authorization: `Bearer ${token}`,
      },
      { credit: 2000 }
    );
    expect(res.status).toBe(400);
    expect("credit" in res.data).toBe(true);
  });

  test("Reload credit with valid value", async () => {
    const res = await reqPostReload(
      {
        authorization: `Bearer ${token}`,
      },
      { credit: 10 }
    );
    expect(res.status).toBe(200);
  });
});

describe("/history", () => {
  async function reqGetReloadHistory(header) {
    return await axios.get("http://localhost/api/user/wallet/history", {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Get reload history without token", async () => {
    const res = await reqGetReloadHistory({});
    expect(res.status).toBe(401);
    expect("token" in res.data).toBe(true);
  });

  test("Get reload history with token", async () => {
    const res = await reqGetReloadHistory({
      authorization: `Bearer ${token}`,
    });
    expect(res.status).toBe(200);
  });
});
