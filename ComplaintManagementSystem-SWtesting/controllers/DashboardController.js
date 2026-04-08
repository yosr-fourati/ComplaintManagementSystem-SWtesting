const { User } = require("../models/User");
const { Project } = require("../models/Project");
const { Ticket } = require("../models/Ticket");
const { Comment } = require("../models/Comment");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const UserTopSupervisors = async (req, res) => {
  const { projectId } = req.params;

  try {
    const project = await Project.findById(projectId)
      .select("supervisors")
      .populate({ path: "supervisors", select: "_id name email profileImage" });

    let nbrOfTicketsPerSupervisor = [];

    for (const supervisor of project.supervisors) {
      const nbrOfTickets = await Ticket.find({
        projectId: project._id,
        creatorId: supervisor,
      }).count();

      nbrOfTicketsPerSupervisor.push({
        supervisor,
        nbrOfTickets: nbrOfTickets,
      });
    }

    nbrOfTicketsPerSupervisor.sort((a, b) => b.nbrOfTickets - a.nbrOfTickets);

    return res.json(nbrOfTicketsPerSupervisor);
  } catch (error) {
    return res.json("this is an error");
  }
};

const StatusReport = async (req, res) => {
  const { projectId } = req.params;

  try {
    const tickets = await Ticket.find({ projectId: projectId }).select(
      "closed"
    );

    let open = 0;
    tickets.forEach((element) => {
      if (element.closed == false) open++;
    });

    return res.json({
      open,
      closed: tickets.length - open,
    });
  } catch (error) {
    return res.json(error);
  }
};

const priorityReport = async (req, res) => {
  const { projectId } = req.params;

  try {
    const highCount = await Ticket.find({ projectId }).count({
      priority: "High",
    });
    const mediumCount = await Ticket.find({ projectId }).count({
      priority: "Medium",
    });
    const lowCount = await Ticket.find({ projectId }).count({
      priority: "Low",
    });

    const tickets = await Ticket.find({ projectId: projectId }).select(
      "closed"
    );

    let open = 0;
    tickets.forEach((element) => {
      if (element.closed == false) open++;
    });

    return res.json({
      highCount: highCount || 0,
      mediumCount: mediumCount || 0,
      lowCount: lowCount || 0,
      open: open || 0,
      closed: tickets.length - open || 0,
    });
  } catch (error) {
    return res.json(error);
  }
};

const latestTickets = async (req, res) => {
  const { projectId } = req.params;

  try {
    const tickets = await Ticket.find({ projectId: projectId })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json(tickets);
  } catch (error) {
    return res.json(error);
  }
};

const topCommentors = async (req, res) => {
  const { projectId } = req.params;
  try {
    const commentCounts = await Comment.aggregate([
      {
        $match: {
          projectId: ObjectId(projectId), // Filter comments based on projectId
        },
      },
      {
        $group: {
          _id: "$creatorId", // Group by creatorId
          count: { $sum: 1 }, // Count the comments for each creatorId
        },
      },
      {
        $lookup: {
          from: "users", // Collection name of the User model
          localField: "_id",
          foreignField: "_id",
          as: "creator", // Name of the array field to store the populated User details
        },
      },
      {
        $project: {
          count: 1,
          _id: 0, // Exclude _id field
          "creator._id": 1, // Include the 'username' field from creator
          "creator.name": 1, // Include the 'username' field from creator
          "creator.email": 1, // Include the 'email' field from creator
          "creator.profileImage": 1, // Include the 'email' field from ownerDetails
          // You can specify other fields from ownerDetails that you want to include
        },
      },
    ]);

    return res.json(commentCounts);
  } catch (error) {
    return res.json(error);
  }
};

async function getTicketsPerDayLastMonth(req, res) {
  const { projectId } = req.params;

  const currentDate = new Date(); // Get current date
  const lastWeekDate = new Date(); // Create a new date object for last month
  lastWeekDate.setDate(currentDate.getDate() - 7); // Subtract 1 from the current month

  try {
    const result = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeekDate, $lte: currentDate },
          projectId: ObjectId(projectId),
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$createdAt" }, // Group by day of the month
            month: { $month: "$createdAt" }, // Group by month
            year: { $year: "$createdAt" }, // Group by year
          },
          count: { $sum: 1 }, // Count the number of tickets in each group
        },
      },
      {
        $sort: {
          "_id.year": 1, // Sort by year in ascending order
          "_id.month": 1, // Sort by month in ascending order
          "_id.day": 1, // Sort by day of the month in ascending order
        },
      },
    ]);

    return res.status(200).json(result || []);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving tickets per day for last month." });
  }
}

module.exports = {
  UserTopSupervisors,
  StatusReport,
  latestTickets,
  topCommentors,
  priorityReport,
  getTicketsPerDayLastMonth,
};
