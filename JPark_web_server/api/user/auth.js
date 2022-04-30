require("dotenv").config();
const jwt = require("jsonwebtoken");
const StatusCodes = require("http-status-codes").StatusCodes;

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.header("authorization");
    if (!authHeader) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ token: { msg: "Unauthorized" } });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.USER_ACCESS_TOKEN_SECRET, (err, user) => {
      if (err)
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ token: { msg: "Unauthorized" } });
      req.user = user;
      next();
    });
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ token: { msg: "Unauthorized" } });
  }
};

module.exports = authenticateToken;
