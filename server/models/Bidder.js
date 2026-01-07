const mongoose = require("mongoose");

const bidderSchema = new mongoose.Schema({
  name: String,
  email: String,
  company: String,
  wallet: { type: String, unique: true }
});

module.exports = mongoose.model("Bidder", bidderSchema);
