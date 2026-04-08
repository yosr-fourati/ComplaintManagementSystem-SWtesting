const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const projectSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    supervisors: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    tickets: [
      {
        ref: "Ticket",
        type: Schema.Types.ObjectId,
      },
    ],
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
  },
  { timestamps: true, strict: "throw" }
);

const Project = mongoose.model("Project", projectSchema);
module.exports = { Project, projectSchema };
