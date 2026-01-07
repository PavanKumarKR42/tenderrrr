const mongoose = require("mongoose");

const TenderSchema = new mongoose.Schema({
  tenderId: {
    type: Number,
    required: true,
    unique: true,        // 🔥 THIS LINE FIXES EVERYTHING
    index: true
  },

  title: String,
  description: String,

  maxAmount: Number,
  minAmount: Number,

  biddingStart: Number,
  biddingEnd: Number,

  status: { type: String, default: "OPEN" },

  lastBidAmount: { type: Number, default: null },
  lastBidder: { type: String, default: null },

  workCompleted: { type: Boolean, default: false },
  paymentReleased: { type: Boolean, default: false }
});

module.exports = mongoose.model("Tender", TenderSchema);
