import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { WalletContext } from "../context/WalletContext.jsx";
import { getContract } from "../blockchain/contract";
import "../styles/tender.css";

function TenderList({ filter = "all", initialTenders = [] }) {
  const { walletAddress } = useContext(WalletContext);

  const [tenders, setTenders] = useState(initialTenders || []);
  const [bidAmounts, setBidAmounts] = useState({});
  const [timers, setTimers] = useState({});
  const [biddingInProgress, setBiddingInProgress] = useState({});

  const userRole = localStorage.getItem("role") || "";

  // ----------------------------
  // Fetch tenders from DB
  // ----------------------------
  const fetchTenders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/tender/all");

      const tenderMap = new Map();
      res.data.forEach(t => {
        if (!tenderMap.has(t.tenderId)) {
          tenderMap.set(t.tenderId, t);
        }
      });

      setTenders(Array.from(tenderMap.values()));
    } catch (error) {
      console.error("Error fetching tenders:", error);
    }
  };

  useEffect(() => {
  if (!initialTenders || initialTenders.length === 0) {
    fetchTenders(); // fallback
  } else {
    setTenders(initialTenders); // use passed data
  }
}, [initialTenders]);
  // ----------------------------
  // Timer
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
  }, [tenders, initialTenders]);

  const getTenderStatus = (start, end) => {
    const now = Math.floor(Date.now() / 1000);
    if (now < start) return "⏳ NOT STARTED";
    if (now >= start && now <= end) return "🟢 OPEN";
    return "🔴 CLOSED";
  };

  // ----------------------------
  // 🚀 PLACE BID (FIXED)
  // ----------------------------
  const placeBid = async (tenderId) => {
    if (biddingInProgress[tenderId]) {
      return alert("❌ Bid already in progress");
    }

    if (!walletAddress) return alert("Connect wallet first");
    if (!bidAmounts[tenderId]) return alert("Enter bid amount");

    try {
      setBiddingInProgress(p => ({ ...p, [tenderId]: true }));

      const contract = await getContract();
      const bidAmount = Number(bidAmounts[tenderId]);

      // ✅ Get tender from DB
      const tender = tenders.find(t => Number(t.tenderId) === Number(tenderId));
      if (!tender) return alert("❌ Tender not found");

      // ✅ RANGE VALIDATION
      const minAllowed = Math.min(tender.minAmount, tender.maxAmount);
      const maxAllowed = Math.max(tender.minAmount, tender.maxAmount);

      if (bidAmount < minAllowed || bidAmount > maxAllowed) {
        return alert(`❌ Bid must be between ₹${minAllowed} and ₹${maxAllowed}`);
      }

      // ✅ 🔥 CRITICAL FIX: VALIDATE AGAINST DB LAST BID
      if (tender.lastBidAmount !== null && bidAmount >= tender.lastBidAmount) {
        return alert(
          `❌ Your bid must be LOWER than current bid ₹${tender.lastBidAmount}`
        );
      }

      // ----------------------------
      // Blockchain (NO VALIDATION)
      // ----------------------------
      const tx = await contract.placeBid(
        tenderId,
        BigInt(Math.floor(bidAmount))
      );

      await tx.wait();

      // ----------------------------
      // Update DB
      // ----------------------------
      await axios.post("http://localhost:5000/bid/update", {
        tenderId,
        bidAmount,
        bidder: walletAddress
      });

      alert("🎯 Bid placed successfully");

      setBidAmounts(p => ({ ...p, [tenderId]: "" }));
      fetchTenders();

    } catch (err) {
      console.error(err);
      alert(err?.reason || err?.message || "❌ Bid failed");
    } finally {
      setBiddingInProgress(p => ({ ...p, [tenderId]: false }));
    }
  };

  // ----------------------------
  // Government actions
  // ----------------------------
  const markCompleted = async (tenderId) => {
    try {
      const contract = await getContract();
      await (await contract.markWorkCompleted(BigInt(tenderId))).wait();

      await axios.post("http://localhost:5000/tender/mark-complete", {
        tenderId
      });

      fetchTenders();
      alert("✅ Work completed");
    } catch {
      alert("❌ Error");
    }
  };

  const releasePayment = async (tenderId) => {
    try {
      const contract = await getContract();
      await (await contract.releasePayment(BigInt(tenderId))).wait();

      await axios.post("http://localhost:5000/tender/payment-done", {
        tenderId
      });

      fetchTenders();
      alert("💸 Payment released");
    } catch {
      alert("❌ Error");
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="tender-list">
      {tenders.map((t) => {
        const status = getTenderStatus(t.biddingStart, t.biddingEnd);

// ----------------------------
// ✅ FILTER FIX (IMPORTANT)
// ----------------------------

// Ongoing = has bid AND not paid
if (filter === "ongoing") {
  if (t.lastBidAmount === null) return null; // ❌ remove no-bid tenders
  if (t.paymentReleased) return null;        // ❌ remove completed
}

// Completed = payment released
if (filter === "completed") {
  if (!t.paymentReleased) return null;
}

        return (
  <div className="tender-card" key={t.tenderId}>
    <h3>{t.title}</h3>
    <p>{t.description}</p>

    <p>Start: ₹{t.maxAmount}</p>
    <p>Min: ₹{t.minAmount}</p>

    {t.lastBidAmount && (
      <p>💰 Current Bid: ₹{t.lastBidAmount}</p>
    )}

    {/* ✅ COUNTDOWN TIMER ADDED */}
    {status === "🟢 OPEN" && timers[t.tenderId] && (
      <p>⏳ Closes in: {timers[t.tenderId]}</p>
    )}

    {status === "🟢 OPEN" && (
      <div>
        <input
          type="number"
          value={bidAmounts[t.tenderId] || ""}
          onChange={(e) =>
            setBidAmounts({ ...bidAmounts, [t.tenderId]: e.target.value })
          }
        />
        <button onClick={() => placeBid(t.tenderId)}>
          Place Bid
        </button>
      </div>
    )}

    {userRole === "government" && status === "🔴 CLOSED" && t.lastBidAmount !== null && (
      <>
        {!t.workCompleted && (
          <button onClick={() => markCompleted(t.tenderId)}>
            Complete
          </button>
        )}
        {t.workCompleted && !t.paymentReleased && (
          <button onClick={() => releasePayment(t.tenderId)}>
            Pay
          </button>
        )}
      </>
    )}
  </div>
);
      })}
    </div>
  );
}

export default TenderList;