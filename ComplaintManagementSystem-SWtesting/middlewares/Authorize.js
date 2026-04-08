const { Project } = require("../models/Project");

const isProjectOwner = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (project.ownerId.toString() !== req.user.id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    next();
  } catch (error) {
    return res.status(404).json({
      error: error,
      message: "Failed to authorize",
    });
  }
};

module.exports = { isProjectOwner };
