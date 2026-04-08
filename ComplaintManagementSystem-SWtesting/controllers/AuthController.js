const { User } = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Register a new user.
 * Validates required fields, checks for duplicates,
 * hashes the password, and saves the user to the database.
 */
const register = async (req, res, next) => {
  const { password, email, phone, name, isProjectOwner } = req.body;

  // Ensure all required fields are provided
  if (!email || !phone || !password || !name) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  // Check if a user with the same email or phone already exists
  const user = await User.find({ $or: [{ email }, { phone }] });
  if (user.length > 0) {
    return res.status(409).json({ message: "User already exists!" });
  }

  try {
    // Hash password with bcrypt before saving (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, phone, isProjectOwner, password: hashedPassword });
    await newUser.save();
    res.json({ message: "User Added Successfully" });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while registering user", error: error.message });
  }
};

/**
 * Login with email or phone number + password.
 * Returns a signed JWT token valid for 1 hour on success.
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate that both fields are present
    if (!username || !password) {
      return res.status(400).json({ message: "Invalid input" });
    }

    // Allow login with either email or phone number
    const user = await User.findOne({ $or: [{ email: username }, { phone: username }] });
    if (!user) {
      return res.status(400).json({ message: "No user found!" });
    }

    // Compare the provided password against the hashed one in the database
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Failed to login! Check credentials" });
    }

    // Sign a JWT with the user's ID — expires in 1 hour
    const token = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });

    delete user.password; // Never send the password back in the response
    return res.status(200).json({ message: "Successfully connected", token, user });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred while logging in", error: error.message });
  }
};

module.exports = { register, login };