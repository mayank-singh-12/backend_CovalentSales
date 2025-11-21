const express = require("express");
require("dotenv").config();

const SalesAgent = require("./models/agent.models");
const Lead = require("./models/lead.models");
const Tag = require("./models/tag.models");
const Comment = require("./models/comment.models");

const cors = require("cors");
const { initialiseDatabase } = require("./db/db.connect");

initialiseDatabase();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

// -------- SALES AGENTS API ------------

// add new sales agent
async function addNewAgent(agentData) {
  try {
    const newAgent = await new SalesAgent(agentData).save();
    return newAgent;
  } catch (error) {
    throw error;
  }
}

app.post("/agents", async (req, res) => {
  const agentData = req.body;
  try {
    if (!agentData.name) throw { status: 400, message: "Name is required." };

    // email pattern check
    const emailPattern = /^[^@/s]+@[^@/s]+\.[^@/s]+$/;
    const validateEmail = emailPattern.test(agentData.email);
    if (!validateEmail) {
      throw {
        status: 400,
        message: "Invalid input: 'email' must be a valid email address.",
      };
    }

    // unique email check
    const emailExists = await SalesAgent.findOne({ email: agentData.email });
    if (emailExists) {
      throw {
        status: 409,
        message: `Sales agent with email '${agentData.email}' already exists.`,
      };
    }

    const newAgent = await addNewAgent(agentData);
    if (!newAgent) throw { status: 400, message: "Unable to add new agent." };
    res.status(201).json({ message: "New Agent added!", newAgent });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal server error." });
  }
});

// get all sales agents
async function getAllSalesAgents() {
  try {
    const allSalesAgentsData = await SalesAgent.find();
    return allSalesAgentsData;
  } catch (error) {
    throw error;
  }
}

app.get("/agents", async (req, res) => {
  try {
    const allSalesAgents = await getAllSalesAgents();
    if (allSalesAgents.length === 0)
      throw { status: 404, message: "No agents found." };
    res.status(200).json(allSalesAgents);
  } catch (error) {
    res.status(error.status).json({ error: error.message });
  }
});

// sales agent by id
async function getSalesAgentById(salesAgentId) {
  try {
    const salesAgentData = await SalesAgent.findById(salesAgentId);
    return salesAgentData;
  } catch (error) {
    throw error;
  }
}

app.get("/agents/:id", async (req, res) => {
  const salesAgentId = req.params.id;
  try {
    const salesAgent = await getSalesAgentById(salesAgentId);
    if (!salesAgent)
      throw res.status(404).json({ message: "Sales Agent not found." });
    res.status(200).json(salesAgent);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal server error." });
  }
});

// -------- LEADS API ------------

// validation functions

function sourceCheck(source) {
  const allowedSources = Lead.schema.path("source").enumValues;
  if (!allowedSources.includes(source))
    throw {
      status: 400,
      message:
        "Invalid input: 'source' must be one of ['Website', 'Referral', 'Cold Call', 'Advertisement', 'Email', 'Other'].",
    };
}

async function salesAgentCheck(salesAgentId) {
  try {
    const salesAgent = await SalesAgent.findById(salesAgentId);

    if (!salesAgent) {
      throw {
        status: 404,
        message: `Sales agent with ID '${salesAgentId}' not found.`,
      };
    }
  } catch (error) {
    throw error;
  }
}

function statusCheck(status) {
  const allowedStatus = Lead.schema.path("status").enumValues;
  if (!allowedStatus.includes(status)) {
    throw {
      status: 400,
      message:
        "Invalid input: 'status' must be one of ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed'].",
    };
  }
}

function timeToCloseCheck(timeToClose) {
  if (timeToClose < 1) {
    throw {
      status: 400,
      message: "Time to close must be a positive number.",
    };
  }
}

function priorityCheck(priority) {
  const allowedPriorities = Lead.schema.path("priority").enumValues;
  if (!allowedPriorities.includes(priority))
    throw {
      status: 400,
      message:
        "Invalid input: 'priority' must be one of ['High', 'Medium', 'Low'].",
    };
}

// create a new lead
async function createNewLead(leadData) {
  try {
    const newLead = await new Lead(leadData).save();
    return await newLead.populate("salesAgent");
  } catch (error) {
    throw error;
  }
}

app.post("/leads", async (req, res) => {
  const leadData = req.body;
  try {
    if (!leadData.name) {
      throw { status: 400, message: "Invalid input: 'name' is required." };
    }

    // Source check
    sourceCheck(leadData.source);

    // Sales agent check
    await salesAgentCheck(leadData.salesAgent);

    // Status check
    statusCheck(leadData.status);

    // timeToClose check
    timeToCloseCheck(leadData.timeToClose);

    // Priority check
    priorityCheck(leadData.priority);

    const newLead = await createNewLead(leadData);
    if (!newLead) throw { status: 500, message: "Unable to create new lead." };
    res.status(201).json(newLead);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal server error." });
  }
});

// get all leads
async function getAllLeads(filters) {
  try {
    const allLeadsData = await Lead.find(filters).populate("salesAgent");
    return allLeadsData;
  } catch (error) {
    throw error;
  }
}

app.get("/leads", async (req, res) => {
  try {
    const filters = {};

    // Sales Agent Check
    const salesAgentId = req.query.salesAgent;
    if (salesAgentId) {
      salesAgentCheck(salesAgentId);
      filters.salesAgent = salesAgentId;
    }

    // Status Check
    const status = req.query.status;
    if (status) {
      statusCheck(status);
      filters.status = status;
    }

    // Source Check
    const source = req.query.source;
    if (source) {
      sourceCheck(source);
      filters.source = source;
    }

    // Priority Check
    const priority = req.query.priority;
    if (priority) {
      priorityCheck(priority);
      filters.priority = priority;
    }

    // Tags Check
    const tags = req.query.tags;
    if (tags) filters.tags = { $all: tags.split(",") };

    const allLeads = await getAllLeads(filters);
    if (allLeads.length === 0)
      throw { status: 404, message: "Leads not found." };

    res.status(200).json(allLeads);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error." });
  }
});

// update a lead
async function updateLead(leadId, updatedData) {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(leadId, updatedData, {
      new: true,
    });
    return updatedLead;
  } catch (error) {
    throw error;
  }
}

app.post("/leads/:id", async (req, res) => {
  const leadId = req.params.id;
  const updatedData = req.body;
  try {
    if (!updatedData.name) {
      throw { status: 400, message: "Invalid input: 'name' is required." };
    }

    // Source check
    sourceCheck(updatedData.source);

    // Sales agent check
    await salesAgentCheck(updatedData.salesAgent);

    // Status check
    statusCheck(updatedData.status);

    // timeToClose check
    timeToCloseCheck(updatedData.timeToClose);

    // Priority check
    priorityCheck(updatedData.priority);

    const updatedLead = await updateLead(leadId, updatedData);
    res.status(200).json(updatedLead);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error." });
  }
});

// delete a lead
async function deleteLead(leadId) {
  try {
    const deletedLead = await Lead.findByIdAndDelete(leadId);
    return deletedLead;
  } catch (error) {
    throw error;
  }
}

app.delete("/leads/:id", async (req, res) => {
  try {
    const leadId = req.params.id;
    const deletedLead = await deleteLead(leadId);
    if (!deletedLead)
      throw { status: 404, message: `Lead with Id '${leadId}' not found.` };

    res.status(200).json({ message: "Lead deleted successfully." });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error." });
  }
});

// -------- COMMENTS API ------------
// add a new comment
async function addComment(commentData) {
  try {
    const comment = await new Comment(commentData).save();
    return comment;
  } catch (error) {
    throw error;
  }
}

app.post("/leads/:id/comments", async (req, res) => {
  const leadId = req.params.id;
  const commentObj = req.body;
  try {
    // checking lead
    const lead = await Lead.findById(leadId);
    if (!lead)
      throw { status: 404, message: `Lead with ID '${leadId}' not found.` };

    const comment = await addComment({ ...commentObj, lead: leadId });
    if (!comment) throw { status: 401, message: "Unable to add new comment." };

    res.status(200).json({ message: "Comment added successfully!", comment });
  } catch (error) {
    res
      .status(error.message || 500)
      .json({ error: error.message || "Internal Server Error." });
  }
});

// get all comments for a lead
async function getAllComments(leadId) {
  try {
    const comments = await Comment.find({ lead: leadId }).populate("author");
    return comments;
  } catch (error) {
    throw error;
  }
}

app.get("/leads/:id/comments", async (req, res) => {
  const leadId = req.params.id;
  try {
    const allComments = await getAllComments(leadId);
    if (allComments.length === 0) throw { status: 404, message: "No Comments" };

    res.status(200).json(allComments);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error." });
  }
});

// -------- TAGS API ------------
// add a new tag
async function addNewTag(tagData) {
  try {
    const newTag = await new Tag(tagData).save();
    return newTag;
  } catch (error) {
    throw error;
  }
}

app.post("/tags", async (req, res) => {
  const tagData = req.body;
  try {
    if (!tagData.name || tagData.name === "") {
      throw {
        status: 400,
        message: "Invalid input: please enter a valid tag name.",
      };
    }
    const tagExistsCheck = await Tag.findOne({ name: tagData.name });
    if (tagExistsCheck)
      throw {
        status: 409,
        message: `tag with name '${tagData.name}' already exists.`,
      };
    const newTag = await addNewTag(tagData);
    if (!newTag) throw { status: 400, message: "Unable to add new tag." };
    res.status(200).json(newTag);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error." });
  }
});

// get all tags
async function getAllTags() {
  try {
    const allTagsData = await Tag.find();
    return allTagsData;
  } catch (error) {
    throw error;
  }
}

app.get("/tags", async (req, res) => {
  try {
    const allTags = await getAllTags();
    if (allTags.length === 0) {
      throw { status: 404, message: "No tags found." };
    }
    res.status(200).json(allTags);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error." });
  }
});

// -------- REPORTING API ------------
// leads closed within last week
async function getLeadsClosedLastWeek() {
  const curr = new Date();
  const currDate = curr.getDate();
  const lastWeekTimestamp = new Date().setDate(currDate - 7);
  const dateLastWeek = new Date(lastWeekTimestamp);
  try {
    const leadsData = await Lead.find({
      closedAt: { $gte: dateLastWeek, $lte: curr },
    });
    return leadsData;
  } catch (error) {
    throw error;
  }
}

app.get("/report/last-week", async (req, res) => {
  try {
    const leads = await getLeadsClosedLastWeek();
    if (!leads) throw { status: 404, message: "Leads not found." };
    res.status(200).json(leads);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error." });
  }
});

// open leads in pipeline
async function getOpenLeads() {
  try {
    const leads = await Lead.find({ status: { $ne: "Closed" } });
    return leads;
  } catch (error) {
    throw error;
  }
}

app.get("/report/pipeline", async (req, res) => {
  try {
    const leads = await getOpenLeads();
    if (!leads) throw { status: 404, message: "Leads not found." };
    res.status(200).json({ totalLeadsInPipeline: leads.length });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal server error." });
  }
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log("Server running on port: ", port);
});
