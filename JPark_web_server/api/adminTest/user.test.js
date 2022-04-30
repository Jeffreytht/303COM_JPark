const axios = require("axios");
const { describe } = require("jest-circus");

async function signIn(email, password) {
  return await axios.post(
    "http://localhost/api/admin/user/login",
    { email: email, password: password },
    { validateStatus: () => true }
  );
}

describe("/login", () => {
  test("Login without email", async () => {
    const res = await axios.post(
      "http://localhost/api/admin/user/login",
      { password: "12345" },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
  });

  test("Login without password", async () => {
    const res = await axios.post(
      "http://localhost/api/admin/user/login",
      { email: "tanhoetheng@gmail.com" },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
  });

  test("Login with valid credential ", async () => {
    const res = await signIn("tanhoetheng@gmail.com", "123456");
    expect(res.status).toBe(200);
  });

  test("Login with invalid email", async () => {
    const res = await signIn("@@", "123456");
    expect(res.status).toBe(400);
    expect("email" in res.data).toBe(true);
  });

  test("Login with email that is not exists", async () => {
    const res = await signIn("abc@abc.abc", "123456");
    expect(res.status).toBe(400);
    expect("email" in res.data).toBe(true);
  });

  test("Login with wrong password", async () => {
    const res = await signIn("tanhoetheng@gmail.com", "@@");
    expect(res.status).toBe(401);
    expect("password" in res.data).toBe(true);
  });
});

describe("/register", () => {
  async function register(email, password, username) {
    return await axios.post(
      "http://localhost/api/admin/user/register",
      {
        email: email,
        password: password,
        username: username,
      },
      {
        validateStatus: () => true,
      }
    );
  }

  test("Register without email", async () => {
    const res = await axios.post(
      "http://localhost/api/admin/user/register",
      { username: "", password: "" },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
    expect("email" in res.data).toBe(true);
  });

  test("Register without username", async () => {
    const res = await axios.post(
      "http://localhost/api/admin/user/register",
      { email: "tanhoetheng@gmail.com", password: "123456" },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
    expect("username" in res.data).toBe(true);
  });

  test("Register without password", async () => {
    const res = await axios.post(
      "http://localhost/api/admin/user/register",
      { email: "tanhoetheng@gmail.com", username: "TanHoeTheng" },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
    expect("password" in res.data).toBe(true);
  });

  test("Register with invalid username", async () => {
    const res = await axios.post(
      "http://localhost/api/admin/user/register",
      { email: "aa@aa.com", username: "", password: "123456" },
      { validateStatus: () => true }
    );
    expect(res.status).toBe(400);
    expect("username" in res.data).toBe(true);
  });
});

describe("/users", () => {
  test("Get users without token", async () => {
    const res = await axios.get("http://localhost/api/admin/user/users", {
      validateStatus: () => true,
    });
    expect(res.status).toBe(401);
  });

  test("Get users with token", async () => {
    const token = (await signIn("tanhoetheng@gmail.com", "123456")).data
      .accessToken;
    const res = await axios.get("http://localhost/api/admin/user/users", {
      validateStatus: () => true,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(res.status).toBe(200);
  });
});

describe("/listUsers", () => {
  test("List users without token", async () => {
    const res = await axios.get("http://localhost/api/admin/user/listUsers", {
      validateStatus: () => true,
    });
    expect(res.status).toBe(401);
  });

  test("List users with token", async () => {
    const token = (await signIn("tanhoetheng@gmail.com", "123456")).data
      .accessToken;
    const res = await axios.get("http://localhost/api/admin/user/listUsers", {
      validateStatus: () => true,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(res.status).toBe(200);
  });
});
