const { User } = require("../models/User");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res, next) => {
  const { password, email, phone, name, isProjectOwner } = req.body;

  if (!email || !phone || !password || !name) {
    return res.status(400).json({
      message: "Please fill all fields",
    });
  }

  const user = await User.find({ $or: [{ email: email }, { phone: phone }] });
  if (user.length > 0) {
    return res.status(409).json({
      message: "User already exists!",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      phone,
      isProjectOwner,
      password: hashedPassword,
    });
    await user.save();
    res.json({ message: "User Added Successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while registering user",
      error: error.message,
    });
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Invalid input",
      });
    }

    const user = await User.findOne({
      $or: [{ email: username }, { phone: username }],
    });
    if (!user) {
      return res.status(400).json({
        message: "No user found!",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Failed to login! Check credentials",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    delete user.password;
    return res.status(200).json({
      message: "Successfully connected",
      token,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while logging in",
      error: error.message,
    });
  }
};

module.exports = { register, login };
