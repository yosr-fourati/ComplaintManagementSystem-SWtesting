const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ticketSchema = new Schema(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: "User" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    title: { type: String, required: true },
    description: { type: String },
    priority: { type: String, enum: ["High", "Medium", "Low"] },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    closed: { type: Boolean },
    index: { type: Number, required: true },
  },
  { timestamps: true, strict: "throw" }
);

ticketSchema.pre("save", function (next) {
  const doc = this;
  if (doc.isNew) {
    // Check if the document is new (i.e., being created)
    Ticket.findOne(
      { projectId: this.projectId },
      {},
      { sort: { index: -1 } },
      function (err, lastDoc) {
        if (err) {
          return next(err);
        }
        doc.index = lastDoc ? lastDoc.index + 1 : 1; // Increment the index by 1
        next();
      }
    );
  } else {
    next();
  }
});

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = { Ticket, ticketSchema };
