const express = require("express");
const router = express.Router();

const TicketController = require("../controllers/TicketController");

router.post("/:projectId", TicketController.createTicket); // creates a ticket in a specific project
router.get("/all/:projectId", TicketController.showTickets); // return All tickets in a specific project

router.get("/:ticketId", TicketController.getTicket); //returns a specific ticket inside a project
router.put("/:ticketId", TicketController.updateTicket); //updates a specific ticket inside a project
router.delete("/:ticketId", TicketController.deleteTicket); // deletes a ticket from a project

router.post("/:ticketId/comment", TicketController.pushComment);
router.delete("/comment/:commentId", TicketController.deleteComment);

module.exports = router;
