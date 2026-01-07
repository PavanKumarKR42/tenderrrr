const mongoose = require("mongoose");

const governmentSchema = new mongoose.Schema({
  name: String,
  email: String,
  wallet: { type: String, unique: true }
});

module.exports = mongoose.model("Government", governmentSchema);
