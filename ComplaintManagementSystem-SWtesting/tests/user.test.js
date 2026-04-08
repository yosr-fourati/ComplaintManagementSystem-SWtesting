const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const {
  searchUser,
  getUserById,
  getMebyId,
  updateMeById,
  resetPassword,
} = require("../controllers/UsersController");
const { User } = require("../models/User");

jest.mock("../models/User");
jest.mock("bcryptjs");

describe("User Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ----------------- searchUser -----------------
  describe("searchUser", () => {
    it("should return 400 if searchQuery is not provided", async () => {
      req.query = {};
      await searchUser(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Search query is required",
      });
    });

    it("should return 404 if no users found", async () => {
      req.query = { searchQuery: "test" };
      User.find.mockReturnValue({
        lean: () => Promise.resolve([]),
      });
      await searchUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No users found" });
    });

    it("should return users if found", async () => {
      req.query = { searchQuery: "John" };
      const mockUsers = [{ _id: "1", name: "John", email: "john@test.com" }];
      User.find.mockReturnValue({
        lean: () => Promise.resolve(mockUsers),
      });
      await searchUser(req, res);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should handle server error", async () => {
      req.query = { searchQuery: "error" };
      User.find.mockImplementation(() => {
        throw new Error("DB Error");
      });
      searchUser(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  // ----------------- getUserById -----------------
  describe("getUserById", () => {
    it("should return 400 for invalid userId", async () => {
      req.params = { userId: "invalid" };
      await getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: "Invalid user ID format",
      });
    });

    it("should return 404 if user not found", async () => {
      req.params = { userId: new mongoose.Types.ObjectId().toHexString() };
      User.findById.mockReturnValue({
        select: () => ({
          lean: () => Promise.resolve(null),
        }),
      });
      await getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should return user if found", async () => {
      const mockUser = { _id: "1", name: "John" };
      req.params = { userId: new mongoose.Types.ObjectId().toHexString() };
      User.findById.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValueOnce({ lean: () => Promise.resolve(mockUser) }),
      });
      await getUserById(req, res);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should handle server error", async () => {
      req.params = { userId: new mongoose.Types.ObjectId().toHexString() };
      User.findById.mockImplementation(() => {
        throw new Error("Error");
      });
      await getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Internal server error" });
    });
  });

  // ----------------- getMebyId -----------------
  describe("getMebyId", () => {
    it("should return user if found", async () => {
      req.user = { id: "123" };
      const mockUser = { _id: "123", name: "John" };
      User.findById.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValueOnce({ lean: () => Promise.resolve(mockUser) }),
      });
      await getMebyId(req, res);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 if user not found", async () => {
      req.user = { id: "123" };
      User.findById.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValueOnce({ lean: () => Promise.resolve(null) }),
      });
      await getMebyId(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should handle server error", async () => {
      req.user = { id: "123" };
      User.findById.mockImplementation(() => {
        throw new Error("Error");
      });
      await getMebyId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to get user" });
    });
  });

  // ----------------- updateMeById -----------------
  describe("updateMeById", () => {
    it("should return 400 if no valid fields provided", async () => {
      req.body = { data: {} };
      await updateMeById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "No valid fields to update",
      });
    });

    it("should update user successfully", async () => {
      req.body = { data: { name: "NewName", email: "new@test.com" } };
      req.user = { id: "123" };
      const updatedUser = {
        _id: "123",
        name: "NewName",
        email: "new@test.com",
      };
      User.findByIdAndUpdate.mockReturnValue({
        select: jest
          .fn()
          .mockReturnValueOnce({ lean: () => Promise.resolve(updatedUser) }),
      });
      await updateMeById(req, res);
      expect(res.json).toHaveBeenCalledWith({
        message: "Successfully updated user",
        updatedUser,
      });
    });

    it("should handle server error", async () => {
      req.body = { data: { name: "test" } };
      req.user = { id: "123" };
      User.findByIdAndUpdate.mockImplementation(() => {
        throw new Error("Error");
      });
      await updateMeById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Failed to update user" });
    });
  });

  // ----------------- resetPassword -----------------
  describe("resetPassword", () => {
    it("should return 400 if passwords not provided", async () => {
      req.body = {};
      await resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Current and new passwords are required",
      });
    });

    it("should return 404 if user not found", async () => {
      req.body = { currentPassword: "123", newPassword: "456" };
      req.user = { id: "123" };
      User.findById.mockResolvedValue(null);
      await resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should return 400 if current password is incorrect", async () => {
      req.body = { currentPassword: "wrong", newPassword: "newpass" };
      req.user = { id: "123" };
      const mockUser = { password: "hashedPassword" };
      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      await resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Incorrect current password",
      });
    });

    it("should return 400 if new password is too short", async () => {
      req.body = { currentPassword: "correct", newPassword: "123" };
      req.user = { id: "123" };
      const mockUser = { password: "hashedPassword" };
      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      await resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "New password must be at least 6 characters",
      });
    });

    it("should successfully update password", async () => {
      req.body = { currentPassword: "correct", newPassword: "newpassword" };
      req.user = { id: "123" };
      const mockUser = { password: "hashedPassword" };
      User.findById.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue("hashedNewPassword");
      User.findByIdAndUpdate.mockResolvedValue();
      await resetPassword(req, res);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password updated successfully",
      });
    });

    it("should handle server error", async () => {
      req.body = { currentPassword: "correct", newPassword: "newpassword" };
      req.user = { id: "123" };
      User.findById.mockImplementation(() => {
        throw new Error("Error");
      });
      await resetPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to update password",
      });
    });
  });
});
