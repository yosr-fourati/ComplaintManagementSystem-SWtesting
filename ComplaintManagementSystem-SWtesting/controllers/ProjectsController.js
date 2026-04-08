const { Project } = require("../models/Project");
const { User } = require("../models/User");
const { Ticket } = require("../models/Ticket");
const { Comment } = require("../models/Comment");

const showAllUserProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [{ ownerId: req.user.id }, { supervisors: { $in: [req.user.id] } }],
    }).populate({
      path: "tickets",
      select: "_id",
    });

    const projectsWithTicketCount = projects.map((project) => {
      const { tickets, ...rest } = project.toObject();
      return {
        ...rest,
        tickets,
        ticketCount: project.tickets.length,
        supervisorCount: project.supervisors.length,
      };
    });

    if (!projectsWithTicketCount) {
      return res.status(404).send({ error: "No projects have been found" });
    }

    return res.json(projectsWithTicketCount);
  } catch (error) {
    return res
      .status(400)
      .send({ error: "Failed to retrieve projects", message: error.message });
  }
};

const showAllUserProjectsNames = async (req, res, next) => {
  try {
    const { select } = req.query;
    const projects = await Project.find({
      $or: [{ ownerId: req.user.id }, { supervisors: { $in: [req.user.id] } }],
    }).select(select);

    return res.json(projects);
  } catch (error) {
    return res.json("Error retriving data");
  }
};

const createProject = async (req, res, next) => {
  try {
    const project = new Project({
      ownerId: req.user.id,
      tickets: [],
      name: req.body.name,
      description: req.body.description,
      image: req.body.image,
    });

    const savedProject = await project.save();
    return res
      .status(201)
      .send({ message: "Successfully created", project: savedProject });
  } catch (error) {
    return res
      .status(400)
      .send({ error: "Failed to create project", message: error.message });
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    const updates = req.body;
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.projectId,
      updates
    );

    return res
      .status(200)
      .send({ message: "Successfully updated", updatedProject });
  } catch (error) {
    return res
      .status(400)
      .send({ message: "Failed to update projects", error });
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }

    await project.remove();

    await Ticket.deleteMany({ projectId: project._id });

    await Comment.deleteMany({ projectId: project._id });

    return res.status(200).send({ message: "Successfully deleted project" });
  } catch (error) {
    return res.status(400).send({ message: "Failed to delete project", error });
  }
};

const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { populate, select } = req.query;

    const project = await Project.findById(projectId)
      .select(select)
      .populate(populate);
    if (!project) {
      return res.status(404).send({ error: "Project not found" });
    }
    return res.status(200).json(project);
  } catch (error) {
    return res.status(400).send({ message: "Failed to get project", error });
  }
};

const getSupervisors = async (req, res) => {
  const { projectId } = req.params;

  try {
    const supervisors = await Project.findById(projectId)
      .select("supervisors")
      .populate({
        path: "supervisors",
        select: "name email phone profileImage",
      });

    return res.status(200).json(supervisors);
  } catch (error) {
    return res.status(500).json({ errorMsg: error, error: true });
  }
};

const addSupervisor = async (req, res) => {
  const { projectId } = req.params;
  const { supervisorId } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found", error: true });
    }

    const supervisor = await User.findById(supervisorId, "_id");
    if (!supervisor) {
      return res
        .status(404)
        .json({ message: "Supervisor not found", error: true });
    }
    if (project.supervisors.includes(supervisor._id)) {
      return res
        .status(404)
        .json({ message: "Supervisor already added", error: true });
    }

    project.supervisors.push(supervisorId);
    await project.save();
    return res.status(200).json({
      message: "Supervisor added",
      supervisors: project.supervisors,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({ errorMsg: error, error: true });
  }
};

const removeSupervisor = async (req, res) => {
  const { projectId } = req.params;
  const { supervisorId } = req.body;

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found", error: true });
    }

    if (!project.supervisors.includes(supervisorId)) {
      return res
        .status(404)
        .json({ message: "Supervisor doesn't exist ", error: true });
    }

    project.supervisors = project.supervisors.filter(
      (element) => element != supervisorId
    );

    await project.save();
    return res.status(200).json({
      message: "Supervisor removed",
      supervisors: project.supervisors,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({ errorMsg: error, error: true });
  }
};

module.exports = {
  createProject,
  showAllUserProjects,
  updateProject,
  deleteProject,
  getProject,
  addSupervisor,
  removeSupervisor,
  getSupervisors,
  showAllUserProjectsNames,
};
