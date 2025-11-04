const mongoose = require("mongoose");

require("dotenv").config();
const mongoUri = process.env.MONGODB;

async function initialiseDatabase() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to database!");
  } catch (error) {
    console.log("Error while connecting to database: ", error);
  }
}

module.exports = { initialiseDatabase };
