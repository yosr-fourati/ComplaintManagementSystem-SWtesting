var cors = require("cors");

const express = require("express");
const app = express();

const AuthRoute = require("./routes/auth");
const ProjectsRoute = require("./routes/projects");
const TicketsRoute = require("./routes/tickets");
const UsersRoute = require("./routes/users");
const DashboardRoute = require("./routes/dashboard");
const authenticate = require("./middlewares/Authenticate");

app.use(cors());
app.use(express.json());

app.use("/auth", AuthRoute);
app.use("/api/project", authenticate.authenticate, ProjectsRoute);
app.use("/api/ticket", authenticate.authenticate, TicketsRoute);
app.use("/api/user", authenticate.authenticate, UsersRoute);
app.use("/api/dashboard", authenticate.authenticate, DashboardRoute);

app.get("/verifyToken", authenticate.authenticate, async (req, res) => {
  res.status(200).json({
    message: "Authentication Succeed",
    valid: true,
  });
});

module.exports = app;
