const { Project } = require("../models/Project");
const { Ticket } = require("../models/Ticket");
const { Comment } = require("../models/Comment");
const { User } = require("../models/User");

const startDate = new Date("2023-04-15"); // Start date
const endDate = new Date("2023-04-21"); // End date

function getRandomDate() {
  const startTime = startDate.getTime(); // Get the time value of the start date
  const endTime = endDate.getTime(); // Get the time value of the end date
  const randomTime = Math.random() * (endTime - startTime) + startTime; // Generate a random time value within the range
  const randomDate = new Date(randomTime); // Create a new date object using the random time value
  return randomDate;
}

const createTicket = async (req, res, next) => {
  try {
    const { id: creatorId } = req.user;
    const { projectId } = req.params;
    const { title, description, priority } = req.body;
    const randomDate = getRandomDate(startDate, endDate);

    const ticket = new Ticket({
      creatorId,
      projectId: projectId,
      title,
      description,
      priority,
      comments: [],
      closed: false,
      index: 0,
      createdAt: randomDate,
    });
    const savedTicket = await ticket.save();
    const project = await Project.findById(projectId);
    project.tickets.push(ticket._id);
    await project.save();

    return res
      .status(201)
      .send({ message: "Successfully created", savedTicket });
  } catch (error) {
    return res.status(500).send({ message: "Failed to create ticket", error });
  }
};

const showTickets = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).select(
      "name description image"
    );
    const tickets = await Ticket.find({
      projectId: projectId,
    }).populate({ path: "creatorId", select: "name profileImage" });

    if (tickets) {
      return res.json({
        project,
        tickets,
      });
    } else {
      return res.status(404).send({ error: "No tickets have been found" });
    }
  } catch (error) {
    return res
      .status(500)
      .send({ error: "Failed to show ticket", message: error });
  }
};

const updateTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { title, description, priority, closed } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        title: title && title,
        description: description && description,
        priority: priority && priority,
        closed: closed && closed,
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found", ticket });
    }

    res.send({ message: "Ticket updated successfully", ticket });
  } catch (error) {
    res.status(500).send({ message: "Failed to update ticket", error });
  }
};

const deleteTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    const deletedTicket = await Ticket.findByIdAndDelete(ticketId);

    const deletedComments = await Comment.deleteMany({
      ticketId: deletedTicket._id,
    });

    res.send({ message: "Ticket successfully deleted" });
  } catch (error) {
    return res.status(500).send({ message: "Failed to delete ticket", error });
  }
};

const getTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId).populate([
      { path: "creatorId", select: "name profileImage" },
      { path: "projectId", select: "name" },
      {
        path: "comments",
        populate: {
          path: "creatorId",
          select: "name profileImage",
        },
      },
    ]);

    if (!ticket) {
      return res.status(404).send({ error: "Ticket not found" });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    return res.status(500).send({ message: "Failed to get ticket", error });
  }
};

const pushComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { text } = req.body;

    const ticket = await Ticket.findById(ticketId);

    const newComment = await Comment.create({
      creatorId: req.user.id,
      projectId: ticket.projectId,
      text: text,
      ticketId: ticketId,
    });

    ticket.comments.push(newComment._id);

    await ticket.save();
    return res.status(200).json({
      newComment,
      message: "Sucessfuly created a new comment",
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    return res.status(200).json({
      deletedComment,
      message: "Comment sucessfuly deleted",
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  createTicket,
  showTickets,
  updateTicket,
  deleteTicket,
  getTicket,
  pushComment,
  deleteComment,
};
