const express = require("express");
const router = express.Router();
const Bidder = require("../models/Bidder");
const Government = require("../models/Government");

// BIDDER SIGNUP RULES:
// - Wallet cannot be the government
// - Wallet must not already be a bidder

router.post("/signup", async (req, res) => {
  try {
    const { name, email, company, wallet } = req.body;

    // Validate required fields
    if (!name || !email || !company || !wallet) {
      return res.status(400).json({ message: "Missing required fields: name, email, company, wallet" });
    }

    // ❗ IMPORTANT: First check if WALLET itself is the government
    const isGovernment = await Government.findOne({ wallet });
    if (isGovernment) {
      return res.status(400).json({ message: "❌ This wallet is registered as Government. It cannot register as Bidder." });
    }

    // Check if wallet is already bidder
    const bidderExists = await Bidder.findOne({ wallet });
    if (bidderExists) {
      return res.status(400).json({ message: "❌ Wallet is already registered as a Bidder." });
    }

    // Register new bidder
    await Bidder.create({ name, email, company, wallet });
    res.status(201).json({ message: "✔ Bidder Registered Successfully" });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "❌ Wallet already registered" });
    }
    res.status(500).json({ message: "Error registering bidder ❌" });
  }
});

// GET ALL BIDDERS
router.get("/", async (req, res) => {
  try {
    const bidders = await Bidder.find();
    res.status(200).json(bidders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching bidders" });
  }
});

module.exports = router;
