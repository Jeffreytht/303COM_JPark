const axios = require("axios");

describe("Import building", () => {
  test("Import building", async () => {
    const signInRes = await axios.post(
      "/api/admin/user/login",
      {
        email: "tanhoetheng@gmail.com",
        password: "123456",
      },
      {
        validateStatus: () => true,
      }
    );

    const token = signInRes.data.accessToken;
    const importBuildingRes = await axios.post(
      "/api/admin/building/import",
      {},
      {
        validateStatus: () => true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(importBuildingRes.status).toBe(200);
  });
});
