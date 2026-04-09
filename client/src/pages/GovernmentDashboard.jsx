import React, { useState, useEffect } from "react";
import axios from "axios";
import CreateTender from "./CreateTender.jsx";
import TenderList from "./TenderList.jsx";
import BidderHistory from "./BidderHistory.jsx";
import "../styles/dashboard.css";

function GovernmentDashboard() {
  const [activeTab, setActiveTab] = useState("create");
  const [bidders, setBidders] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBiddersData = async () => {
    setLoading(true);
    try {
      const [biddersRes, tendersRes] = await Promise.all([
        axios.get("http://localhost:5000/bidder"),
        axios.get("http://localhost:5000/tender/all"),
      ]);
      setBidders(biddersRes.data);
      setTenders(tendersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analytics") fetchBiddersData();
  }, [activeTab]);

  const calculateBidderStats = () =>
    bidders.map((bidder) => {
      const contractsWon = tenders.filter(
        (t) => t.lastBidder === bidder.wallet && t.paymentReleased
      );
      const totalPaymentReceived = contractsWon.reduce(
        (sum, c) => sum + (c.lastBidAmount || 0),
        0
      );
      const contractsCount = contractsWon.length;
      let score =
        50 +
        contractsCount * 100 +
        Math.min(totalPaymentReceived / 100, 500);
      score = Math.max(Math.min(Math.round(score), 1000), 1);
      return { ...bidder, contractsWon: contractsCount, totalPaymentReceived, score };
    });

  const bidderStats = activeTab === "analytics" ? calculateBidderStats() : [];
  const sortedBidders = [...bidderStats].sort((a, b) => b.score - a.score);

  const getScoreClass = (score) => {
    if (score >= 700) return "score-pill score-excellent";
    if (score >= 500) return "score-pill score-good";
    if (score >= 300) return "score-pill score-average";
    return "score-pill score-beginner";
  };

  const getScoreLabel = (score) => {
    if (score >= 700) return "Excellent";
    if (score >= 500) return "Good";
    if (score >= 300) return "Average";
    return "Beginner";
  };

  const tabs = [
    { id: "create",    label: "Create tender" },
    { id: "ongoing",   label: "Ongoing" },
    { id: "completed", label: "Completed" },
    { id: "bidders",   label: "Bidders & winners" },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <div className="dashboard">
      <h2>Government Dashboard</h2>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "create" && <CreateTender />}
      {activeTab === "ongoing" && <TenderList filter="ongoing" />}
      {activeTab === "completed" && <TenderList filter="completed" />}
      {activeTab === "bidders" && <BidderHistory />}

      {activeTab === "analytics" && (
        <div className="form-container">
          <h3>Bidder analytics &amp; performance ranking</h3>
          <p>Performance metrics and scores for all registered bidders.</p>

          {loading ? (
            <div className="state-loading">Loading bidder data…</div>
          ) : sortedBidders.length > 0 ? (
            <>
              {/* Summary stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-card__label">Total bidders</span>
                  <span className="stat-card__value">{sortedBidders.length}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-card__label">Contracts won</span>
                  <span className="stat-card__value">
                    {sortedBidders.reduce((s, b) => s + b.contractsWon, 0)}
                  </span>
                </div>
                <div className="stat-card">
                  <span className="stat-card__label">Total paid out</span>
                  <span className="stat-card__value">
                    ₹{sortedBidders
                      .reduce((s, b) => s + b.totalPaymentReceived, 0)
                      .toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Rank</th>
                      <th style={{ textAlign: "left" }}>Wallet</th>
                      <th style={{ textAlign: "left" }}>Name</th>
                      <th style={{ textAlign: "left" }}>Company</th>
                      <th style={{ textAlign: "center" }}>Contracts won</th>
                      <th style={{ textAlign: "right" }}>Payment received</th>
                      <th style={{ textAlign: "center" }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBidders.map((bidder, index) => (
                      <tr key={bidder.wallet}>
                        <td className="rank-cell">{index + 1}</td>
                        <td className="wallet-cell">
                          {bidder.wallet.substring(0, 8)}…
                          {bidder.wallet.substring(bidder.wallet.length - 6)}
                        </td>
                        <td className="name-cell">{bidder.name}</td>
                        <td className="company-cell">{bidder.company}</td>
                        <td className="contracts-cell">{bidder.contractsWon}</td>
                        <td className="payment-cell">
                          ₹{bidder.totalPaymentReceived.toLocaleString()}
                        </td>
                        <td className="score-cell">
                          <span className={getScoreClass(bidder.score)}>
                            {bidder.score} · {getScoreLabel(bidder.score)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Scoring formula */}
              <div className="formula-box">
                <h4>Scoring formula</h4>
                <div className="formula-grid">
                  <div>
                    <p>Components</p>
                    <ul>
                      <li>Base score: +50 pts</li>
                      <li>Per contract won: +100 pts</li>
                      <li>Per ₹100 paid out: +1 pt (cap 500)</li>
                    </ul>
                  </div>
                  <div>
                    <p>Score ranges</p>
                    <div className="formula-ranges">
                      <span className="score-pill score-excellent">700 – 1000 · Excellent</span>
                      <span className="score-pill score-good">500 – 699 · Good</span>
                      <span className="score-pill score-average">300 – 499 · Average</span>
                      <span className="score-pill score-beginner">1 – 299 · Beginner</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="state-empty">No bidders registered yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default GovernmentDashboard;