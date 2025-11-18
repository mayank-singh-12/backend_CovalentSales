const mongoose = require("mongoose");

// Lead Schema
const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Lead name is required"],
  },
  source: {
    type: String,
    required: [true, "Lead source is required"],
    enum: [
      "Website",
      "Referral",
      "Cold Call",
      "Advertisement",
      "Email",
      "Other",
    ],
  },
  salesAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesAgent",
    required: [true, "Sales Agent is required"],
  },
  status: {
    type: String,
    required: true,
    enum: ["New", "Contacted", "Qualified", "Proposal Sent", "Closed"],
    default: "New",
  },
  tags: {
    type: [String],
  },
  timeToClose: {
    type: Number,
    required: [true, "Time to Close is required"],
    min: [1, "Time to Close must be a positive number"],
  },
  priority: {
    type: String,
    required: true,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  closedAt: {
    type: Date,
  },
});

// Middleware to update the `updatedAt` field on each save
leadSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // calculating closedAt
  if (this.status === "Closed") this.closedAt = this.createdAt;
  else {
    const creationDateObj = new Date(this.createdAt);
    const creationDate = creationDateObj.getDate(); // returns date

    const timeToClose = this.timeToClose; // in days

    const closingTimestamp = creationDateObj.setDate(
      creationDate + timeToClose
    );
    const closedAtObj = new Date(closingTimestamp);

    this.closedAt = closedAtObj.toISOString();
  }

  next();
});

module.exports = mongoose.model("Lead", leadSchema);
