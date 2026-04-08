const express = require("express");
const router = express.Router();

const DashboardController = require("../controllers/DashboardController");

router.get(
  "/:projectId/top-supervisors",
  DashboardController.UserTopSupervisors
);

router.get("/:projectId/status-report", DashboardController.StatusReport);
router.get("/:projectId/latest-tickets", DashboardController.latestTickets);
router.get("/:projectId/top-commentors", DashboardController.topCommentors);
router.get("/:projectId/priority-report", DashboardController.priorityReport);
router.get(
  "/:projectId/tickets-report",
  DashboardController.getTicketsPerDayLastMonth
);
module.exports = router;
