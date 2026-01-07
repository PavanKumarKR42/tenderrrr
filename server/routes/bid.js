const express = require("express");
const router = express.Router();
const Tender = require("../models/Tender");

/**
 * Update last bid info in DB
 * Called AFTER blockchain tx succeeds
 */
router.post("/update", async (req, res) => {
  try {
    const { tenderId, bidAmount, bidder } = req.body;

    console.log("📨 /bid/update received:");
    console.log("tenderId:", tenderId);
    console.log("bidAmount:", bidAmount);
    console.log("bidder:", bidder);

    // Validate required fields
    if (!tenderId || bidAmount === undefined || !bidder) {
      console.log("❌ Missing fields!");
      return res.status(400).json({ message: "Missing required fields: tenderId, bidAmount, bidder" });
    }

    const tender = await Tender.findOne({ tenderId });

    if (!tender) {
      console.log("❌ Tender not found in DB!");
      return res.status(404).json({ message: "Tender not found" });
    }

    console.log("✅ Tender found. Current data:", {
      lastBidAmount: tender.lastBidAmount,
      lastBidder: tender.lastBidder
    });

    // DB-side safety check: bid amount must be within tender range AND lower than last bid
    // Rule 1: minAmount ≤ bid ≤ maxAmount
    // minAmount = quality floor (lowest acceptable)
    // maxAmount = starting amount (highest allowed)
    const minAllowed = Math.min(tender.minAmount, tender.maxAmount);
    const maxAllowed = Math.max(tender.minAmount, tender.maxAmount);
    
    console.log("Bid validation - range check:", { minAllowed, maxAllowed, bidAmount });
    
    if (bidAmount < minAllowed || bidAmount > maxAllowed) {
      console.log("❌ Bid outside range!");
      return res
        .status(400)
        .json({ message: `❌ Bid must be between ₹${minAllowed} (minimum quality floor) and ₹${maxAllowed} (starting amount)` });
    }

    // Rule 2: Each new bid must be LOWER than the previous bid (descending auction)
    if (
      tender.lastBidAmount !== null &&
      bidAmount >= tender.lastBidAmount
    ) {
      console.log("❌ Bid not lower than previous bid!");
      return res
        .status(400)
        .json({ message: `❌ Your bid (₹${bidAmount}) must be LOWER than the current bid (₹${tender.lastBidAmount})` });
    }

    tender.lastBidAmount = bidAmount;
    tender.lastBidder = bidder;

    await tender.save();
    
    console.log("✅ Bid saved! New data:", {
      lastBidAmount: tender.lastBidAmount,
      lastBidder: tender.lastBidder
    });

    res.json({ message: "Bid stored in DB ✔" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating bid ❌" });
  }
});

module.exports = router;
