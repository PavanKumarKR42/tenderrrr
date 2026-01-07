const express = require("express");
const router = express.Router();
const Government = require("../models/Government");
const Bidder = require("../models/Bidder");

// LOGIN USING ONLY WALLET ADDRESS
router.post("/", async (req, res) => {
  try {
    const { wallet } = req.body;

    // Validate required fields
    if (!wallet) {
      return res.status(400).json({ message: "Missing wallet address" });
    }

    // Check if wallet is government
    const government = await Government.findOne({ wallet });
    if (government) {
      return res.json({ role: "government", message: "✔ Government Login Successful" });
    }

    // Check if wallet is bidder
    const bidder = await Bidder.findOne({ wallet });
    if (bidder) {
      return res.json({ role: "bidder", message: "✔ Bidder Login Successful" });
    }

    // Wallet not found
    return res.status(404).json({ role: "none", message: "❌ Wallet not registered. Please sign up first." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error during login ❌" });
  }
});

module.exports = router;
