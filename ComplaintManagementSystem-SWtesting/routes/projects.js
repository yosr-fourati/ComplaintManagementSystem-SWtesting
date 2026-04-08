const express = require("express");
const router = express.Router();

const ProjectsController = require("../controllers/ProjectsController");

//Project Management
router.get("/", ProjectsController.showAllUserProjects); //returns all the projects of a certain user
router.get("/names", ProjectsController.showAllUserProjectsNames); //returns all the projects of a certain user (Only names)
router.post("/", ProjectsController.createProject); //creates a project
router.get("/:projectId", ProjectsController.getProject); //returns single project
router.put("/:projectId", ProjectsController.updateProject); //updates a project
router.delete("/:projectId", ProjectsController.deleteProject); //deletes a project

router.get("/:projectId/supervisors", ProjectsController.getSupervisors); //add a supervisor
router.post("/:projectId/supervisors", ProjectsController.addSupervisor); //add a supervisor
router.delete("/:projectId/supervisors", ProjectsController.removeSupervisor); //add a supervisor

module.exports = router;
