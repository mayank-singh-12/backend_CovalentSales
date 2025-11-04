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
    const newAgent = new SalesAgent(agentData);
    const emailPattern = /^[^@/s]+@[^@/s]+\.[^@/s]+$/;
    const validateEmail = emailPattern.test(newAgent.email);
    if (!validateEmail) {
      throw {
        status: 400,
        message: "Invalid input: 'email' must be a valid email address.",
      };
    }
    const emailExists = await SalesAgent.findOne({ email: newAgent.email });
    if (emailExists) {
      throw {
        status: 409,
        message: `Sales agent with email '${newAgent.email}' already exists.`,
      };
    }
    const saveNewAgent = await newAgent.save();
    return saveNewAgent;
  } catch (error) {
    throw error;
  }
}

app.post("/agents", async (req, res) => {
  const agentData = req.body;
  try {
    const newAgent = await addNewAgent(agentData);
    if (!newAgent) throw { status: 500, message: "Unable to add new agent." };
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
    const allLeadsData = await Lead.find(filters);
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
    res.status(200).json({ updatedLead });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ error: error.message || "Internal Server Error." });
  }
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log("Server running on port: ", port);
});
