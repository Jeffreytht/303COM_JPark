const express = require("express");
const StatusCodes = require("http-status-codes").StatusCodes;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const authenticateToken = require("./auth");
const { User, Admin, Reservation } = require("../../models");
const { body, validationResult } = require("express-validator");
const router = express.Router();

const registerValidation = [
  body("username", "Missing username").exists(),
  body("email", "Missing email").exists(),
  body("username", "Username should not be empty").isLength({ min: 1 }),
  body("password", "Missing password").exists(),
  body("email", "Invalid email").isEmail(),
];

const loginValidation = [
  body("email", "Missing email").exists(),
  body("password", "Missing password").exists(),
  body("email", "Invalid email").isEmail(),
];

const logoutValidation = [body("refreshToken", "Missing token").exists()];

const tokenValidation = [body("token", "").exists()];

router.get("/users", authenticateToken, async (req, res) => {
  const users = await User.find({}, "email username contactNum");
  res.json(users);
});

router.post("/register", registerValidation, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty())
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

  const admin = await Admin.findOne({ email: req.body.email });

  if (admin !== null)
    return res
      .status(StatusCodes.CONFLICT)
      .json({ error: "Email already in use." });

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const admin = new Admin({
      _id: new mongoose.Types.ObjectId(),
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    await admin.save();
    return res.sendStatus(StatusCodes.CREATED);
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }
});

router.post("/login", loginValidation, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty())
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

  const target = await Admin.findOne({ email: req.body.email });
  if (target == null)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ email: { msg: "User not found" } });

  try {
    if (!(await bcrypt.compare(req.body.password, target.password))) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ password: { msg: "Invalid password" } });
    }
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }

  const admin = {
    username: target.username,
    email: target.email,
    admin: true,
  };

  const accessToken = jwt.sign(admin, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15d",
  });
  const refreshToken = jwt.sign(admin, process.env.REFRESH_TOKEN_SECRET);

  Admin.findOneAndUpdate(
    { _id: target._id },
    { refreshToken: refreshToken },
    { useFindAndModify: false }
  ).catch((_) => {
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  });

  res.json({
    accessToken: accessToken,
    refreshToken: refreshToken,
  });
});

router.delete("/logout", logoutValidation, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
  }

  await Admin.findOneAndUpdate(
    { refreshToken: req.body.refreshToken },
    { refreshToken: "" },
    { useFindAndModify: false }
  );

  return res.sendStatus(StatusCodes.OK);
});

router.post("/token", tokenValidation, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty())
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

  const target = await Admin.findOne({ refreshToken: req.body.token });
  if (target == null) return res.sendStatus(StatusCodes.UNAUTHORIZED);

  jwt.verify(req.body.token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(StatusCodes.UNAUTHORIZED);

    const accessToken = jwt.sign(
      {
        username: user.username,
        email: user.email,
        admin: user.admin,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15d",
      }
    );

    res.json({ accessToken: accessToken });
  });
});

router.get("/listUsers", authenticateToken, async (req, res) => {
  const users = await User.find({}, { email: 1, username: 1, contactNum: 1 });

  const mappedUsers = await Promise.all(
    users.map(async (user) => {
      const reservations = await Reservation.find({ user });
      return { ...user.toObject(), reservations };
    })
  );

  res.json(mappedUsers);
});

module.exports = router;
