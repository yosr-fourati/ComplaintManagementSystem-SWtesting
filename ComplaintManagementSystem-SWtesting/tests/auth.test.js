const { login, register } = require("../controllers/AuthController");
const { User } = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Mock dependencies
jest.mock("../models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  describe("Login", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return 200 and a token on successful login", async () => {
      const user = {
        _id: "123",
        email: "test@example.com",
        password: "hashedpassword",
      };
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mockedtoken");

      const req = {
        body: { username: "test@example.com", password: "correctpassword" },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "correctpassword",
        "hashedpassword"
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "123" },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Successfully connected",
        token: "mockedtoken",
        user,
      });
    });

    it("should return 400 if user does not exist", async () => {
      User.findOne.mockResolvedValue(null);

      const req = {
        body: { username: "nonexistent@example.com", password: "somepassword" },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "No user found!" });
    });

    it("should return 401 if password is incorrect", async () => {
      User.findOne.mockResolvedValue({
        email: "test@example.com",
        password: "hashedpassword",
      });
      bcrypt.compare.mockResolvedValue(false);

      const req = {
        body: { username: "test@example.com", password: "wrongpassword" },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongpassword",
        "hashedpassword"
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Failed to login! Check credentials",
      });
    });

    it("should return 400 if username is empty", async () => {
      const req = { body: { username: "", password: "somepassword" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid input" });
    });

    it("should return 400 if password is empty", async () => {
      const req = { body: { username: "test@example.com", password: "" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid input" });
    });

    it("should return 400 if email format is invalid", async () => {
      const req = {
        body: { username: "invalid-email", password: "somepassword" },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid email format",
      });
    });

    it("should return 200 if login is successful using phone number", async () => {
      const user = {
        _id: "123",
        phone: "1234567890",
        password: "hashedpassword",
      };
      User.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mockedtoken");

      const req = {
        body: { username: "1234567890", password: "correctpassword" },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Successfully connected",
        token: "mockedtoken",
        user,
      });
    });

    it("should return 400 on SQL injection attempt", async () => {
      const req = { body: { username: "' OR '1'='1' --", password: "any" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "No user found!" });
    });

    it("should return 400 on NoSQL injection attempt", async () => {
      const req = { body: { username: { $gt: "" }, password: "any" } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "No user found!" });
    });

    it("should return 500 if database error occurs", async () => {
      User.findOne.mockRejectedValue(new Error("Database error"));

      const req = {
        body: { username: "test@example.com", password: "testpassword" },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "An error occurred while logging in",
        error: "Database error",
      });
    });

    it("should return 500 if user has no password field", async () => {
      User.findOne.mockResolvedValue({ email: "test@example.com" });

      const req = {
        body: { username: "test@example.com", password: "testpassword" },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "An error occurred while logging in",
      });
    });
  });

  describe("Register", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should register a new user successfully", async () => {
      User.find.mockResolvedValue([]); // No existing user
      bcrypt.hash.mockResolvedValue("hashedpassword");
      User.prototype.save = jest.fn().mockResolvedValue(true);

      const req = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          password: "password123",
          isProjectOwner: true,
        },
      };
      const res = { json: jest.fn() };

      await register(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(User.prototype.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "User Added Successfully",
      });
    });

    it("should return 409 if user already exists (email or phone)", async () => {
      User.find.mockResolvedValue([{ email: "john@example.com" }]); // User already exists

      const req = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          password: "password123",
          isProjectOwner: true,
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: "User already exists!",
      });
    });

    it("should return 400 if email is missing", async () => {
      const req = {
        body: {
          name: "John Doe",
          phone: "1234567890",
          password: "password123",
          isProjectOwner: true,
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Please fill all fields",
      });
    });

    it("should return 400 if password is missing", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          isProjectOwner: true,
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Please fill all fields",
      });
    });

    it("should return 400 if phone number is missing", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          isProjectOwner: true,
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Please fill all fields",
      });
    });

    it("should return 400 if email format is invalid", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: "invalid-email",
          phone: "123123123",
          password: "password123",
          isProjectOwner: true,
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid email format",
      });
    });

    it("should return 400 if phone number is too short", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          phone: "123",
          password: "password123",
          isProjectOwner: true,
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid phone number",
      });
    });

    it("should return 400 if password is too short", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          password: "123",
          isProjectOwner: true,
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password must be at least 6 characters long",
      });
    });

    it("should return 400 on SQL injection attempt", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: "' OR '1'='1' --",
          phone: "1234567890",
          password: "password123",
          isProjectOwner: true,
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid input detected",
      });
    });

    it("should return 400 on NoSQL injection attempt", async () => {
      const req = {
        body: {
          name: "John Doe",
          email: { $gt: "" },
          phone: "1234567890",
          password: "password123",
          isProjectOwner: true,
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid input detected",
      });
    });

    it("should return 500 if database error occurs", async () => {
      User.find.mockRejectedValue(new Error("Database error"));

      const req = {
        body: {
          name: "John Doe",
          email: "john@example.com",
          phone: "1234567890",
          password: "password123",
          isProjectOwner: true,
        },
      };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "An error occurred while registering",
        error: "Database error",
      });
    });
  });
});

// npm test -- --coverage --coverageDirectory=coverage
