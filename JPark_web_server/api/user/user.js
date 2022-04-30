require("dotenv").config();

const StatusCodes = require("http-status-codes").StatusCodes;
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtDecode = require("jwt-decode");
const authenticateToken = require("./auth");
const { User } = require("../../models");
const { body, validationResult } = require("express-validator");

const emailValidation = [
  body("email", "Missing email").exists(),
  body("email", "Invalid email").isEmail(),
];

const contactNumValidation = [
  body("contactNum", "Missing contactNum").exists(),
  body("contactNum", "Invalid contactNum").matches(/^[0-9]{3}-[0-9]{7,8}$/),
];

const usernameValidation = [
  body("username", "Missing username").exists(),
  body("username", "Username's length must be in between 6-20").isLength({
    min: 6,
    max: 20,
  }),
];

const passwordValidation = [
  body("password", "Missing password").exists(),
  body("password", "Password's length must be in between 8-20").isLength({
    min: 8,
    max: 20,
  }),
];

const registerValidation = [
  ...emailValidation,
  ...passwordValidation,
  ...usernameValidation,
  ...contactNumValidation,
];

const loginValidation = [
  ...emailValidation,
  body("password", "Missing password").exists(),
];

const tokenValidation = [body("token", "Missing token").exists()];

const updatePasswordValidation = [
  ...passwordValidation,
  body("oldPassword", "Missing oldPassword").exists(),
];

router.post("/email", emailValidation, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
  }

  const response = await User.findOne({ email: req.body.email });
  if (response)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ email: { msg: "Email already exists" } });

  return res.sendStatus(StatusCodes.OK);
});

router.post("/register", registerValidation, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
  }

  const isEmailExists = await User.findOne({ email: req.body.email });
  if (isEmailExists)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ email: { msg: "Email already exists" } });

  if (
    req.body.password.search(/[A-Za-z]+/) === -1 ||
    req.body.password.search(/[0-9]/) === -1
  )
    return res.status(StatusCodes.BAD_REQUEST).json({
      password: { msg: "Password must contain both letter and number" },
    });

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    email: req.body.email,
    username: req.body.username,
    password: hashedPassword,
    contactNum: req.body.contactNum,
  });

  user
    .save()
    .then((_) => {
      return res
        .status(StatusCodes.CREATED)
        .json({ msg: "Sign up successfully" });
    })
    .catch((err) => {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err });
    });
});

router.post("/login", loginValidation, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty())
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

  const target = await User.findOne({ email: req.body.email });

  if (!target)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ email: { msg: "User not found" } });

  if (!(await bcrypt.compare(req.body.password, target.password)))
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ password: { msg: "Invalid password" } });

  const user = {
    id: target._id,
    username: target.username,
    email: target.email,
    role: "user",
  };

  const accessToken = jwt.sign(user, process.env.USER_ACCESS_TOKEN_SECRET, {
    expiresIn: "15d",
  });

  const refreshToken = jwt.sign(user, process.env.USER_REFRESH_TOKEN_SECRET);
  User.findOneAndUpdate(
    { _id: target._id },
    { refreshToken: refreshToken },
    { useFindAndModify: false }
  )
    .then((_) => {
      return res.json({
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    })
    .catch((err) => {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err });
    });
});

router.post("/token", tokenValidation, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty())
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());

  const target = await User.findOne({ refreshToken: req.body.token });
  if (!target)
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ token: { msg: "Invalid token" } });

  jwt.verify(
    req.body.token,
    process.env.USER_REFRESH_TOKEN_SECRET,
    (err, user) => {
      if (err) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ token: { error: err } });
      }

      const accessToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: "user",
        },
        process.env.USER_ACCESS_TOKEN_SECRET,
        { expiresIn: "15d" }
      );

      res.json({ accessToken: accessToken });
    }
  );
});

router.get("/accountInfo", authenticateToken, async (req, res) => {
  const token = req.header("authorization").split(" ")[1];
  const userId = jwt.decode(token).id;

  const user = await User.findOne({ _id: userId });
  res.json(user);
});

router.put(
  "/username",
  usernameValidation,
  authenticateToken,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
    }

    const token = req.header("authorization");
    const userId = jwtDecode(token).id;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }

    try {
      user.username = req.body.username;
      await user.save();
    } catch (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }

    res.sendStatus(StatusCodes.OK);
  }
);

router.put("/email", emailValidation, authenticateToken, async (req, res) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
  }

  const token = req.header("authorization");
  const userId = jwtDecode(token).id;

  const isEmailExists = await User.findOne({ email: req.body.email });
  if (isEmailExists) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      email: {
        msg: "Email already exists",
      },
    });
  }

  const user = await User.findOne({ _id: userId });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
  }

  try {
    user.email = req.body.email;
    await user.save();
  } catch (err) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }

  res.sendStatus(StatusCodes.OK);
});

router.put(
  "/contactNum",
  contactNumValidation,
  authenticateToken,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
    }

    const token = req.header("authorization");
    const userId = jwtDecode(token).id;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }

    try {
      user.contactNum = req.body.contactNum;
      await user.save();
    } catch (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }

    res.sendStatus(StatusCodes.OK);
  }
);

router.put(
  "/password",
  updatePasswordValidation,
  authenticateToken,
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json(err.mapped());
    }

    const token = req.header("authorization");
    const userId = jwtDecode(token).id;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }

    if (!(await bcrypt.compare(req.body.oldPassword, user.password)))
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Invalid password" });

    try {
      user.password = await bcrypt.hash(req.body.password, 10);
      await user.save();
    } catch (err) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: err.message });
    }

    res.sendStatus(StatusCodes.OK);
  }
);

module.exports = router;
