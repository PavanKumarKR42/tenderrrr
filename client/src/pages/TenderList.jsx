import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { WalletContext } from "../context/WalletContext.jsx";
import { getContract } from "../blockchain/contract";
import "../styles/tender.css";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function TenderList({ filter = "all" }) {
  const { walletAddress } = useContext(WalletContext);

  const [tenders, setTenders] = useState([]);
  const [chainData, setChainData] = useState({});
  const [bidAmounts, setBidAmounts] = useState({});
  const [timers, setTimers] = useState({});
  const [biddingInProgress, setBiddingInProgress] = useState({});

  const userRole = localStorage.getItem("role") || "";

  // ----------------------------
  // Fetch tenders from DB (DEDUPED)
  // ----------------------------
  const fetchTenders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/tender/all");

      // HARD DEDUPLICATION by tenderId - keep only the first occurrence
      const tenderMap = new Map();
      res.data.forEach(t => {
        if (!tenderMap.has(t.tenderId)) {
          tenderMap.set(t.tenderId, t);
        }
      });

      const unique = Array.from(tenderMap.values());
      console.log("Fetched tenders:", unique.length, "tenders");
      console.log("Tender IDs:", unique.map(t => t.tenderId));
      
      setTenders(unique);
    } catch (error) {
      console.error("Error fetching tenders:", error);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  // ----------------------------
  // Countdown Timer (OPEN only)
  // ----------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const updated = {};

      tenders.forEach((t) => {
        const status = getTenderStatus(t.biddingStart, t.biddingEnd);
        if (status === "🟢 OPEN") {
          const diff = t.biddingEnd - now;
          if (diff > 0) {
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;

            updated[t.tenderId] =
              `${String(h).padStart(2, "0")}:` +
              `${String(m).padStart(2, "0")}:` +
              `${String(s).padStart(2, "0")}`;
          }
        }
      });

      setTimers(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [tenders]);

  // ----------------------------
  // Status from DB time
  // ----------------------------
  const getTenderStatus = (start, end) => {
    const now = Math.floor(Date.now() / 1000);
    if (now < start) return "⏳ NOT STARTED";
    if (now >= start && now <= end) return "🟢 OPEN";
    return "🔴 CLOSED";
  };

  // ----------------------------
  // Place Bid
  // ----------------------------
  const placeBid = async (tenderId) => {
    // Prevent multiple bid submissions on the same tender
    if (biddingInProgress[tenderId]) {
      return alert(`❌ A bid is already being placed for this tender. Please wait...`);
    }

    if (!walletAddress) return alert("Connect wallet first");
    if (!bidAmounts[tenderId]) return alert("Enter bid amount");

    try {
      // Mark this tender as having a bid in progress
      setBiddingInProgress(p => ({ ...p, [tenderId]: true }));
      const contract = await getContract();
      const bidAmount = Number(bidAmounts[tenderId]);
      
      console.log("===== PLACING BID =====");
      console.log("Clicking tender ID:", tenderId);
      console.log("All available tenders:", tenders.map(t => ({ 
        id: t.tenderId, 
        min: Number(t.minAmount), 
        max: Number(t.maxAmount),
        title: t.title 
      })));
      
      // Find the EXACT tender by ID - strict number comparison
      const tender = tenders.find(t => Number(t.tenderId) === Number(tenderId));
      
      if (!tender) {
        console.error("❌ TENDER NOT FOUND! TenderId:", tenderId, "Available tenders:", tenders.map(t => t.tenderId));
        return alert(`❌ Tender ID ${tenderId} not found in database`);
      }

      console.log("✅ Found tender:", { 
        tenderId: Number(tender.tenderId), 
        minAmount: Number(tender.minAmount), 
        maxAmount: Number(tender.maxAmount),
        title: tender.title 
      });
      console.log("Bid amount to validate:", bidAmount);

      // Validation 1: Bid must be within tender's min-max range
      // Rule: minAmount ≤ bid ≤ maxAmount
      // minAmount = quality floor (lowest acceptable)
      // maxAmount = starting amount (highest allowed)
      const minAllowed = Math.min(Number(tender.minAmount), Number(tender.maxAmount));
      const maxAllowed = Math.max(Number(tender.minAmount), Number(tender.maxAmount));
      
      console.log("Validation range from DATABASE:", { minAllowed, maxAllowed });
      
      if (bidAmount < minAllowed || bidAmount > maxAllowed) {
        return alert(`❌ Tender ID ${tenderId}: Bid must be between ₹${minAllowed?.toLocaleString()} (minimum quality floor) and ₹${maxAllowed?.toLocaleString()} (starting amount)`);
      }

      // Validation 2: Check if bid is lower than previous bid (descending auction rule)
      // Rule: Each new bid must be LOWER than the previous bid
      console.log("🔗 Fetching tender data from BLOCKCHAIN for tender ID:", tenderId);
      const tenderData = await contract.getTender(tenderId);
      
      console.log("📋 Raw blockchain tender data:", tenderData);
      console.log("Blockchain minAmount:", Number(tenderData.minAmount));
      console.log("Blockchain maxAmount:", Number(tenderData.maxAmount));
      console.log("Blockchain currentBid:", Number(tenderData.currentBid));
      
      const currentBlockchainBid = Number(tenderData.currentBid);
      const blockchainMinAmount = Number(tenderData.minAmount);
      const blockchainMaxAmount = Number(tenderData.maxAmount);
      
      console.log("✅ Blockchain RANGE for tender 29:", { 
        minAmount: blockchainMinAmount, 
        maxAmount: blockchainMaxAmount 
      });
      console.log("User bid amount:", bidAmount);
      console.log("Is bid >= minAmount? ", bidAmount >= blockchainMinAmount);
      console.log("Is bid <= maxAmount? ", bidAmount <= blockchainMaxAmount);
      
      console.log("Current blockchain bid:", currentBlockchainBid);
      
      if (currentBlockchainBid > 0 && bidAmount >= currentBlockchainBid) {
        return alert(`❌ Your bid (₹${bidAmount?.toLocaleString()}) must be LOWER than the current bid (₹${currentBlockchainBid?.toLocaleString()})\nDescending auction: Each bid must be lower than the previous one`);
      }
      
      // Convert to BigInt for contract interaction (uint256)
      const bidAmountBigInt = BigInt(Math.floor(bidAmount));
      
      console.log("💰 Placing bid on blockchain...");
      console.log("tenderId:", tenderId, "bidAmount:", bidAmount);
      
      const txResponse = await contract.placeBid(
        tenderId,
        bidAmountBigInt
      );
      console.log("📡 TX sent, waiting for confirmation...");
      
      await txResponse.wait();
      console.log("✅ Blockchain transaction confirmed!");

      // Update database only
      console.log("📊 Updating database with bid info...");
      console.log("Sending to /bid/update:", {
        tenderId,
        bidAmount,
        bidder: walletAddress
      });
      
      const dbResponse = await axios.post("http://localhost:5000/bid/update", {
        tenderId,
        bidAmount,
        bidder: walletAddress
      });
      
      console.log("✅ Database updated!", dbResponse.data);

      alert("🎯 Bid placed successfully");
      setBidAmounts(p => ({ ...p, [tenderId]: "" }));
      fetchTenders(); // Refresh DB data
    } catch (err) {
      console.error("❌ BID ERROR:", err);
      console.error("Error message:", err?.message);
      console.error("Error reason:", err?.reason);
      console.error("Full error object:", err);
      alert(err?.reason || err?.message || "❌ Bid failed");
    } finally {
      // Clear the bidding in progress flag
      setBiddingInProgress(p => ({ ...p, [tenderId]: false }));
    }
  };

  // ----------------------------
  // Government actions
  // ----------------------------
  const markCompleted = async (tenderId) => {
    try {
      const contract = await getContract();
      // Convert tenderId to BigInt for contract interaction
      const tenderIdBigInt = BigInt(tenderId);
      await (await contract.markWorkCompleted(tenderIdBigInt)).wait();
      
      // Update database only
      await axios.post("http://localhost:5000/tender/mark-complete", {
        tenderId
      });

      alert("✅ Work marked completed");
      fetchTenders(); // Refresh DB data
    } catch (err) {
      console.error(err);
      alert("❌ Already completed or not allowed");
    }
  };

  const releasePayment = async (tenderId) => {
    try {
      const contract = await getContract();
      // Convert tenderId to BigInt for contract interaction
      const tenderIdBigInt = BigInt(tenderId);
      await (await contract.releasePayment(tenderIdBigInt)).wait();
      
      // Update database only
      await axios.post("http://localhost:5000/tender/payment-done", {
        tenderId
      });

      alert("💸 Payment released");
      fetchTenders(); // Refresh DB data
    } catch (err) {
      console.error(err);
      alert("❌ Insufficient TenderCoin balance");
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="tender-list">
      {tenders.map((t) => {
        const status = getTenderStatus(t.biddingStart, t.biddingEnd);

        // ✅ FILTERING BASED ON DATABASE paymentReleased FLAG
        // ONGOING = paymentReleased is false (from DB, immediate)
        if (filter === "ongoing" && t.paymentReleased === true) {
          return null;
        }

        // COMPLETED = paymentReleased is true (from DB, immediate)
        if (filter === "completed" && t.paymentReleased === false) {
          return null;
        }

        return (
          <div className="tender-card" key={t.tenderId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h3>{t.title}</h3>
                <p style={{ color: '#6b7280', margin: '0.5rem 0' }}>{t.description}</p>
              </div>
              <div className={`status-badge status-${status.includes('OPEN') ? 'open' : status.includes('CLOSED') ? 'closed' : 'not-started'}`}>
                {status}
              </div>
            </div>

            <div className="tender-meta">
              <div className="meta-item">
                <span className="meta-label">Starting Amount</span>
                <span className="meta-value">₹{t.maxAmount?.toLocaleString()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Minimum Allowed</span>
                <span className="meta-value">₹{t.minAmount?.toLocaleString()}</span>
              </div>
            </div>

            {status === "🟢 OPEN" && timers[t.tenderId] && (
              <p className="timer">⏳ Bidding closes in: {timers[t.tenderId]}</p>
            )}

            {t.lastBidAmount ? (
              <div className="bid-info">
                <p><b>💰 Current Lowest Bid:</b> ₹{t.lastBidAmount?.toLocaleString()}</p>
                <p><b>👤 Lowest Bidder:</b> {t.lastBidder?.substring(0, 10)}...{t.lastBidder?.substring(t.lastBidder.length - 8)}</p>
                <p><b>✅ Work Status:</b> {t.workCompleted ? <span className="completed-badge">Completed</span> : <span className="pending-badge">Pending</span>}</p>
                <p><b>💸 Payment:</b> {t.paymentReleased ? <span className="completed-badge">Released</span> : <span className="pending-badge">Pending</span>}</p>
              </div>
            ) : (
              <p className="no-bid">🚫 No bids placed yet</p>
            )}


            {userRole === "bidder" && status === "🟢 OPEN" && (
              <div className="bid-section">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Place Your Bid (Descending Auction)
                </label>
                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#166534', border: '1px solid #86efac', lineHeight: '1.6' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>📋 Bidding Rules:</p>
                  <div style={{ paddingLeft: '0.5rem' }}>
                    <p style={{ margin: '0.25rem 0' }}>✓ Bid must be between ₹{Math.min(t.minAmount, t.maxAmount)?.toLocaleString()} - ₹{Math.max(t.minAmount, t.maxAmount)?.toLocaleString()}</p>
                    {t.lastBidAmount ? (
                      <p style={{ margin: '0.25rem 0' }}>✓ Your bid must be LESS than ₹{t.lastBidAmount?.toLocaleString()} (current lowest)</p>
                    ) : (
                      <p style={{ margin: '0.25rem 0' }}>✓ First bid: can be any amount between the range</p>
                    )}
                    <p style={{ margin: '0.25rem 0' }}>ℹ️ Each bid must be lower than the previous (descending)</p>
                  </div>
                </div>
                <div className="bid-input-group">
                  <input
                    type="number"
                    placeholder={`Enter bid between ₹${Math.min(t.minAmount, t.maxAmount)} - ₹${Math.max(t.minAmount, t.maxAmount)}`}
                    value={bidAmounts[t.tenderId] || ""}
                    onChange={(e) =>
                      setBidAmounts({ ...bidAmounts, [t.tenderId]: e.target.value })
                    }
                  />
                  <button onClick={() => placeBid(t.tenderId)}>
                    💰 Place Bid
                  </button>
                </div>
              </div>
            )}

            {userRole === "government" && status === "🔴 CLOSED" && t.lastBidAmount && (
              <div className="action-buttons">
                {!t.workCompleted && (
                  <button onClick={() => markCompleted(t.tenderId)} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                    ✔ Mark Work Completed
                  </button>
                )}
                {t.workCompleted && !t.paymentReleased && (
                  <button onClick={() => releasePayment(t.tenderId)} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' }}>
                    💸 Release Payment
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TenderList;
