const express = require("express");
const router = express.Router();
const Tender = require("../models/Tender");

/**
 * ===============================
 * CREATE / UPSERT TENDER (DB only)
 * Blockchain tx happens in frontend
 * ===============================
 */
router.post("/create", async (req, res) => {
  try {
    const {
      tenderId,
      title,
      description,
      maxAmount,
      minAmount,
      biddingStart,
      biddingEnd
    } = req.body;

    // Validate all required fields
    if (!tenderId || !title || !description || maxAmount === undefined || 
        minAmount === undefined || !biddingStart || !biddingEnd) {
      return res.status(400).json({ message: "Missing required fields: tenderId, title, description, maxAmount, minAmount, biddingStart, biddingEnd" });
    }

    // Validate amount ranges
    if (maxAmount <= 0 || minAmount <= 0) {
      return res.status(400).json({ message: "Amounts must be greater than 0" });
    }

    if (minAmount > maxAmount) {
      return res.status(400).json({ message: "Minimum amount cannot be greater than maximum amount" });
    }

    // Validate bidding times
    if (biddingStart >= biddingEnd) {
      return res.status(400).json({ message: "Bidding start time must be before end time" });
    }

    const tender = await Tender.findOneAndUpdate(
      { tenderId }, // 🔑 unique identifier
      {
        tenderId,
        title,
        description,
        maxAmount,
        minAmount,
        biddingStart,
        biddingEnd,
        status: "OPEN",
        lastBidAmount: null,
        lastBidder: null,
        workCompleted: false,
        paymentReleased: false
      },
      {
        new: true,
        upsert: true // 🔥 THIS PREVENTS DUPLICATES
      }
    );

    res.status(201).json({
      message: "Tender stored safely (no duplicates)",
      tender
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error storing tender ❌" });
  }
});

/**
 * ===============================
 * GET ALL TENDERS
 * ===============================
 */
router.get("/all", async (req, res) => {
  try {
    const tenders = await Tender.find().sort({ tenderId: 1 });
    res.json(tenders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tenders ❌" });
  }
});

/**
 * ===============================
 * MARK WORK COMPLETED (DB)
 * ===============================
 */
router.post("/mark-complete", async (req, res) => {
  try {
    const { tenderId } = req.body;

    // Validate required field
    if (!tenderId) {
      return res.status(400).json({ message: "Missing tenderId" });
    }

    const tender = await Tender.findOne({ tenderId });
    if (!tender) {
      return res.status(404).json({ message: "Tender not found" });
    }

    tender.workCompleted = true;
    tender.status = "CLOSED";

    await tender.save();

    res.json({ message: "Work marked completed ✔" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark completed ❌" });
  }
});

/**
 * ===============================
 * MARK PAYMENT DONE (DB)
 * ===============================
 */
router.post("/payment-done", async (req, res) => {
  try {
    const { tenderId } = req.body;

    // Validate required field
    if (!tenderId) {
      return res.status(400).json({ message: "Missing tenderId" });
    }

    const tender = await Tender.findOne({ tenderId });
    if (!tender) {
      return res.status(404).json({ message: "Tender not found" });
    }

    tender.paymentReleased = true;

    await tender.save();

    res.json({ message: "Payment marked done ✔" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark payment ❌" });
  }
});

module.exports = router;
