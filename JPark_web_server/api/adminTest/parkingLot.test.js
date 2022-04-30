const axios = require("axios");
const { describe } = require("jest-circus");

async function signIn(email, password) {
  return await axios.post(
    "http://localhost/api/admin/user/login",
    {
      email: email,
      password: password,
    },
    {
      validateStatus: () => true,
    }
  );
}

describe("/parking-spaces", () => {
  test("Get parking spaces without token", async () => {
    const res = await axios.get(
      "http://localhost/api/admin/parking-lot/parking-spaces",
      { validateStatus: () => true }
    );
    expect(res.status).toBe(401);
  });

  test("Get parking spaces With token", async () => {
    const token = (await signIn("tanhoetheng@gmail.com", "123456")).data
      .accessToken;
    const res = await axios.get(
      "http://localhost/api/admin/parking-lot/parking-spaces",
      {
        validateStatus: () => true,
        headers: { authorization: `Bearer ${token}` },
      }
    );
    expect(res.status).toBe(200);
    expect(res.data.length).toBe(92);
  });
});

describe("/", () => {
  test("Get parking lot without token", async () => {
    const res = await axios.get("http://localhost/api/admin/parking-lot/", {
      validateStatus: () => true,
    });
    expect(res.status).toBe(401);
  });

  test("Get parking lot with token", async () => {
    const token = (await signIn("tanhoetheng@gmail.com", "123456")).data
      .accessToken;
    const res = await axios.get("http://localhost/api/admin/parking-lot/", {
      validateStatus: () => true,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });
});

describe("reservation-count", () => {
  test("Get reservation count without token", async () => {
    const res = await axios.get(
      "http://localhost/api/admin/parking-lot/reservations-count",
      { validateStatus: () => true }
    );
    expect(res.status).toBe(401);
  });

  test("Get reservation count with token", async () => {
    const token = (await signIn("tanhoetheng@gmail.com", "123456")).data
      .accessToken;
    const res = await axios.get(
      "http://localhost/api/admin/parking-lot/reservations-count",
      {
        validateStatus: () => true,
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    expect(res.status).toBe(200);
  });
});
