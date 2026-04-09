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
        if (!tenderMap.has(t.tenderId)) tenderMap.set(t.tenderId, t);
      });
      setTenders(Array.from(tenderMap.values()));
    } catch (error) {
      console.error("Error fetching tenders:", error);
    }
  };

  useEffect(() => {
    if (!initialTenders || initialTenders.length === 0) {
      fetchTenders();
    } else {
      setTenders(initialTenders);
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
        if (status === "OPEN") {
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

  const getTenderStatus = (start, end) => {
    const now = Math.floor(Date.now() / 1000);
    if (now < start) return "NOT_STARTED";
    if (now >= start && now <= end) return "OPEN";
    return "CLOSED";
  };

  const statusLabel = {
    OPEN: "● Live",
    CLOSED: "Closed",
    NOT_STARTED: "Upcoming",
  };

  const statusClass = {
    OPEN: "status-open",
    CLOSED: "status-closed",
    NOT_STARTED: "status-not-started",
  };

  // ----------------------------
  // Place bid
  // ----------------------------
  const placeBid = async (tenderId) => {
    if (biddingInProgress[tenderId]) return alert("Bid already in progress");
    if (!walletAddress) return alert("Connect wallet first");
    if (!bidAmounts[tenderId]) return alert("Enter bid amount");

    try {
      setBiddingInProgress(p => ({ ...p, [tenderId]: true }));

      const contract = await getContract();
      const bidAmount = Number(bidAmounts[tenderId]);

      const tender = tenders.find(t => Number(t.tenderId) === Number(tenderId));
      if (!tender) return alert("Tender not found");

      const minAllowed = Math.min(tender.minAmount, tender.maxAmount);
      const maxAllowed = Math.max(tender.minAmount, tender.maxAmount);

      if (bidAmount < minAllowed || bidAmount > maxAllowed) {
        return alert(`Bid must be between ₹${minAllowed} and ₹${maxAllowed}`);
      }

      if (tender.lastBidAmount !== null && bidAmount >= tender.lastBidAmount) {
        return alert(`Your bid must be lower than current bid ₹${tender.lastBidAmount}`);
      }

      const tx = await contract.placeBid(tenderId, BigInt(Math.floor(bidAmount)));
      await tx.wait();

      await axios.post("http://localhost:5000/bid/update", {
        tenderId,
        bidAmount,
        bidder: walletAddress,
      });

      alert("Bid placed successfully");
      setBidAmounts(p => ({ ...p, [tenderId]: "" }));
      fetchTenders();
    } catch (err) {
      console.error(err);
      alert(err?.reason || err?.message || "Bid failed");
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
      await axios.post("http://localhost:5000/tender/mark-complete", { tenderId });
      fetchTenders();
      alert("Work marked as completed");
    } catch {
      alert("Error marking work complete");
    }
  };

  const releasePayment = async (tenderId) => {
    try {
      const contract = await getContract();
      await (await contract.releasePayment(BigInt(tenderId))).wait();
      await axios.post("http://localhost:5000/tender/payment-done", { tenderId });
      fetchTenders();
      alert("Payment released");
    } catch {
      alert("Error releasing payment");
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="tender-list">
      {tenders.map((t) => {
        const status = getTenderStatus(t.biddingStart, t.biddingEnd);

        if (filter === "ongoing") {
          if (t.lastBidAmount === null) return null;
          if (t.paymentReleased) return null;
        }
        if (filter === "completed") {
          if (!t.paymentReleased) return null;
        }

        return (
          <div className="tender-card" key={t.tenderId}>
            <div className="tender-card__stripe" />

            <div className="tender-card__body">
              <div className="tender-card__header">
                <h3>{t.title}</h3>
                <span className={`status-badge ${statusClass[status]}`}>
                  {statusLabel[status]}
                </span>
              </div>

              <p className="tender-card__desc">{t.description}</p>

              <div className="tender-meta">
                <div className="meta-item">
                  <span className="meta-label">Start amount</span>
                  <span className="meta-value">₹{t.maxAmount.toLocaleString()}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Floor</span>
                  <span className="meta-value">₹{t.minAmount.toLocaleString()}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Tender ID</span>
                  <span className="meta-value">#{t.tenderId}</span>
                </div>
              </div>

              {t.lastBidAmount ? (
                <div className="current-bid">
                  <span className="current-bid__label">Current bid</span>
                  <span className="current-bid__amount">₹{Number(t.lastBidAmount).toLocaleString()}</span>
                </div>
              ) : (
                status === "CLOSED" && (
                  <div className="no-bid">No bids were placed on this tender.</div>
                )
              )}

              {status === "OPEN" && timers[t.tenderId] && (
                <div className="timer">
                  Closes in {timers[t.tenderId]}
                </div>
              )}
            </div>

            {status === "OPEN" && (
              <div className="bid-section">
                <div className="bid-input-group">
                  <input
                    type="number"
                    placeholder="Enter your bid (₹)"
                    value={bidAmounts[t.tenderId] || ""}
                    onChange={(e) =>
                      setBidAmounts({ ...bidAmounts, [t.tenderId]: e.target.value })
                    }
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => placeBid(t.tenderId)}
                    disabled={biddingInProgress[t.tenderId]}
                  >
                    {biddingInProgress[t.tenderId] ? "Placing…" : "Place bid"}
                  </button>
                </div>
              </div>
            )}

            {userRole === "government" && status === "CLOSED" && t.lastBidAmount !== null && (
              <div className="action-buttons">
                {!t.workCompleted && (
                  <button className="btn btn-primary" onClick={() => markCompleted(t.tenderId)}>
                    Mark work completed
                  </button>
                )}
                {t.workCompleted && !t.paymentReleased && (
                  <button className="btn btn-secondary" onClick={() => releasePayment(t.tenderId)}>
                    Release payment
                  </button>
                )}
                {t.workCompleted && (
                  <span className="completed-badge">Work verified</span>
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