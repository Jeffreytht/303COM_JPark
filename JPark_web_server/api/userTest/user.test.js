require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const { describe, beforeAll, afterAll } = require("@jest/globals");
const { User } = require("../../models");

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

describe("/email", () => {
  async function reqPostCheckEmail(header, body) {
    return await axios.post("http://localhost/api/user/email", body, {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Validate invalid email", async () => {
    const res = await reqPostCheckEmail(
      {},
      { email: "tanhoetheng@@gmail.com" }
    );
    expect(res.status).toBe(400);
    expect("email" in res.data).toBe(true);
  });

  test("Validate existing email", async () => {
    const res = await reqPostCheckEmail({}, { email: "tanhoetheng@gmail.com" });
    expect(res.status).toBe(400);
    expect("email" in res.data).toBe(true);
  });

  test("Validate new email", async () => {
    const res = await reqPostCheckEmail({}, { email: "zzz@zzz.com" });
    expect(res.status).toBe(200);
  });
});

describe("/register", () => {
  async function reqPostRegister(header, body) {
    return await axios.post("http://localhost/api/user/register", body, {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Register without email", async () => {
    const res = await reqPostRegister(
      {},
      {
        password: "12345abcde",
        username: "Jeffrey Tan",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("email" in res.data).toBe(true);
  });

  test("Register without password", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "zzz@zzzz.com",
        username: "Jeffrey Tan",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("password" in res.data).toBe(true);
  });

  test("Register without username", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "zzz@zzzz.com",
        password: "12345abcde",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("username" in res.data).toBe(true);
  });

  test("Register without contact number", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "zzz@zzzz.com",
        username: "Jeffrey Tan",
        password: "12345abcde",
      }
    );

    expect(res.status).toBe(400);
    expect("contactNum" in res.data).toBe(true);
  });

  test("Register with existing email", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "tanhoetheng@gmail.com",
        password: "12345abcde",
        username: "Jeffrey Tan",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("email" in res.data).toBe(true);
  });

  test("Register with invalid email", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "tanhoetheng@@gmail.com",
        password: "12345abcde",
        username: "Jeffrey Tan",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("email" in res.data).toBe(true);
  });

  test("Register with password shorter than minimum length", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "xxxxxx@xxxxx.com",
        password: "12345",
        username: "Jeffrey Tan",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("password" in res.data).toBe(true);
  });

  test("Register with password longer than maximum length", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "xxxx@xxxxx.com",
        password: "1234567890abcdefghijklmnopqrst",
        username: "Jeffrey Tan",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("password" in res.data).toBe(true);
  });

  test("Register with password consisting of only number", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "xxxxx@xxxxx.com",
        password: "1234567890",
        username: "Jeffrey Tan",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("password" in res.data).toBe(true);
  });

  test("Register with password consisting of only alphabet", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "xxxxx@xxxxx.com",
        password: "abcdefghijklm",
        username: "Jeffrey Tan",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("password" in res.data).toBe(true);
  });

  test("Register with invalid contact number", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "xxxxx@xxxxx.com",
        password: "12345abcde",
        username: "Jeffrey Tan",
        contactNum: "0124727438",
      }
    );

    expect(res.status).toBe(400);
    expect("contactNum" in res.data).toBe(true);
  });

  test("Register with username longer than maximum length", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "xxxxx@xxxxx.com",
        password: "12345abcde",
        username: "Jeffrey Tan Hoe Theng Heng Ong Huat",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("username" in res.data).toBe(true);
  });

  test("Register with username shorter than minimum length", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "xxxxx@xxxxx.com",
        password: "12345abcde",
        username: "Mr J",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(400);
    expect("username" in res.data).toBe(true);
  });

  test("Register with valid user info", async () => {
    const res = await reqPostRegister(
      {},
      {
        email: "xxxxx@xxxxx.com",
        password: "12345abcde",
        username: "Mr Jeffrey",
        contactNum: "012-4727438",
      }
    );

    expect(res.status).toBe(201);
    await User.deleteOne({ email: "xxxxx@xxxxx.com" });
  });
});

describe("login", () => {
  async function reqPostLogin(header, body) {
    return await axios.post("http://localhost/api/user/login", body, {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Login with invalid credential", async () => {
    const res = await reqPostLogin(
      {},
      { email: "tanhoetheng@gmail.com", password: "12345abcde12345abcde" }
    );

    expect(res.status).toBe(401);
  });

  test("Login with valid credential", async () => {
    const res = await reqPostLogin(
      {},
      { email: "tanhoetheng@gmail.com", password: "12345abcde" }
    );

    expect(res.status).toBe(200);
  });
});

describe("/accountInfo", () => {
  async function reqGetAccountInfo(header) {
    return await axios.get("http://localhost/api/user/accountInfo", {
      validateStatus: () => true,
      headers: header,
    });
  }

  test("Get account info without token", async () => {
    const res = await reqGetAccountInfo({});
    expect(res.status).toBe(401);
  });

  test("Get account info with token", async () => {
    const res = await reqGetAccountInfo({ authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
  });
});
