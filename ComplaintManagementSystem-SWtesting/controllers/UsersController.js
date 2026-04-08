const { User } = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const searchUser = async (req, res) => {
  const searchQuery = req.query.searchQuery?.trim();
  if (!searchQuery) {
    return res.status(400).json({ error: "Search query is required" });
  }

  try {
    const users = await User.find(
      {
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ],
      },
      "_id name email phone profileImage"
    ).lean();

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getUserById = async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).send({ error: "Invalid user ID format" });
  }

  try {
    const user = await User.findById(userId)
      .select("-password -updatedAt")
      .lean();
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Internal server error" });
  }
};

const getMebyId = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -updatedAt")
      .lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to get user" });
  }
};

const updateMeById = async (req, res) => {
  const { name, email, phone, profileImage } = req.body.data || {};

  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (phone) updates.phone = phone;
  if (profileImage) updates.profileImage = profileImage;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    )
      .select("-password")
      .lean();

    return res.json({
      message: "Successfully updated user",
      updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update user" });
  }
};

const resetPassword = async (req, res) => {
  const { newPassword, currentPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current and new passwords are required" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update password" });
  }
};

module.exports = {
  searchUser,
  getMebyId,
  updateMeById,
  resetPassword,
  getUserById,
};
