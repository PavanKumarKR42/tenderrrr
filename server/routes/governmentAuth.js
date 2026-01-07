const express = require("express");
const router = express.Router();
const Government = require("../models/Government");
const Bidder = require("../models/Bidder");

// GOVERNMENT SIGNUP RULES:
// - Only one government allowed
// - Wallet cannot already be a bidder

router.post("/signup", async (req, res) => {
  try {
    const { name, email, wallet } = req.body;

    // Validate required fields
    if (!name || !email || !wallet) {
      return res.status(400).json({ message: "Missing required fields: name, email, wallet" });
    }

    // Block wallet if already a bidder
    const isBidder = await Bidder.findOne({ wallet });
    if (isBidder) {
      return res.status(400).json({ message: "❌ This wallet is registered as Bidder. It cannot register as Government." });
    }

    // Allow only one government TOTAL
    const anyGovernmentExists = await Government.findOne();
    if (anyGovernmentExists) {
      return res.status(400).json({ message: "❌ Government already exists. No more registrations allowed." });
    }

    await Government.create({ name, email, wallet });
    res.status(201).json({ message: "✔ Government Registered Successfully" });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "❌ Wallet already registered" });
    }
    res.status(500).json({ message: "Error registering government ❌" });
  }
});

module.exports = router;
