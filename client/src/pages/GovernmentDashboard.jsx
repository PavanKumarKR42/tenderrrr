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

  // Fetch bidders and tenders data
  const fetchBiddersData = async () => {
    setLoading(true);
    try {
      const [biddersRes, tendersRes] = await Promise.all([
        axios.get("http://localhost:5000/bidder"),
        axios.get("http://localhost:5000/tender/all")
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
    if (activeTab === "analytics") {
      fetchBiddersData();
    }
  }, [activeTab]);

  // Calculate bidder statistics
  const calculateBidderStats = () => {
    return bidders.map(bidder => {
      // Get all contracts won by this bidder
      const contractsWon = tenders.filter(
        t => t.lastBidder === bidder.wallet && t.paymentReleased
      );

      // Total payment received
      const totalPaymentReceived = contractsWon.reduce(
        (sum, contract) => sum + (contract.lastBidAmount || 0),
        0
      );

      // Number of contracts won
      const contractsCount = contractsWon.length;

      // SCORING FORMULA (1-1000):
      // Base: 50 points + (contracts won * 100) + (payment received / 100)
      // Normalized to 1-1000 range
      const baseScore = 50;
      const contractScore = contractsCount * 100;
      const paymentScore = Math.min(totalPaymentReceived / 100, 500); // Cap at 500
      let score = baseScore + contractScore + paymentScore;

      // Normalize to max 1000
      score = Math.min(Math.round(score), 1000);
      score = Math.max(score, 1); // Minimum score of 1

      return {
        ...bidder,
        contractsWon: contractsCount,
        totalPaymentReceived,
        score
      };
    });
  };

  const bidderStats = activeTab === "analytics" ? calculateBidderStats() : [];
  const sortedBidders = [...bidderStats].sort((a, b) => b.score - a.score);

  return (
    <div className="dashboard">
      <h2>🏛 Government Dashboard</h2>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "create" ? "tab active" : "tab"}
          onClick={() => setActiveTab("create")}
        >
          ➕ Create Tender
        </button>

        <button
          className={activeTab === "ongoing" ? "tab active" : "tab"}
          onClick={() => setActiveTab("ongoing")}
        >
          🚧 Ongoing Contracts
        </button>

        <button
          className={activeTab === "completed" ? "tab active" : "tab"}
          onClick={() => setActiveTab("completed")}
        >
          ✅ Completed Contracts
        </button>

        <button
          className={activeTab === "bidders" ? "tab active" : "tab"}
          onClick={() => setActiveTab("bidders")}
        >
          👷 Bidders & Winners
        </button>

        <button
          className={activeTab === "analytics" ? "tab active" : "tab"}
          onClick={() => setActiveTab("analytics")}
        >
          📊 Bidders Analytics
        </button>
      </div>

      <hr />

      {/* Tab Content */}
      {activeTab === "create" && <CreateTender />}

      {activeTab === "ongoing" && (
        <TenderList filter="ongoing" />
      )}

      {activeTab === "completed" && (
        <TenderList filter="completed" />
      )}

      {activeTab === "bidders" && <BidderHistory />}

      {/* BIDDERS ANALYTICS TAB */}
      {activeTab === "analytics" && (
        <div className="form-container">
          <h3>📊 Bidders Analytics & Performance Ranking</h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            View all bidders with their performance metrics and scores
          </p>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>⏳ Loading bidders data...</p>
          ) : sortedBidders.length > 0 ? (
            <>
              {/* SUMMARY STATS */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ background: '#dbeafe', padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '4px solid #3b82f6' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                    TOTAL BIDDERS
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1e40af', margin: '0' }}>
                    {sortedBidders.length}
                  </p>
                </div>
                <div style={{ background: '#d1fae5', padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '4px solid #10b981' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                    TOTAL CONTRACTS WON
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#047857', margin: '0' }}>
                    {sortedBidders.reduce((sum, b) => sum + b.contractsWon, 0)}
                  </p>
                </div>
                <div style={{ background: '#fed7aa', padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '4px solid #f59e0b' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                    TOTAL AMOUNT PAID
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#92400e', margin: '0' }}>
                    ₹{sortedBidders.reduce((sum, b) => sum + b.totalPaymentReceived, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* BIDDERS TABLE */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Rank</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Wallet Address</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Company</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Contracts Won</th>
                      <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Payment Received</th>
                      <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBidders.map((bidder, index) => {
                      // Score color gradient
                      let scoreColor = '#ef4444'; // Red
                      if (bidder.score >= 700) scoreColor = '#10b981'; // Green
                      else if (bidder.score >= 500) scoreColor = '#3b82f6'; // Blue
                      else if (bidder.score >= 300) scoreColor = '#f59e0b'; // Orange

                      return (
                        <tr
                          key={bidder.wallet}
                          style={{
                            borderBottom: '1px solid #e5e7eb',
                            transition: 'background 0.2s ease',
                            background: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                          onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#ffffff' : '#f9fafb'}
                        >
                          <td style={{ padding: '1rem', fontWeight: '700', color: '#1f2937' }}>
                            {index + 1}
                          </td>
                          <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#6b7280' }}>
                            {bidder.wallet.substring(0, 10)}...{bidder.wallet.substring(bidder.wallet.length - 8)}
                          </td>
                          <td style={{ padding: '1rem', color: '#1f2937', fontWeight: '500' }}>
                            {bidder.name}
                          </td>
                          <td style={{ padding: '1rem', color: '#6b7280' }}>
                            {bidder.company}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#3b82f6' }}>
                            {bidder.contractsWon}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                            ₹{bidder.totalPaymentReceived.toLocaleString()}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{
                              display: 'inline-block',
                              background: scoreColor,
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '0.5rem',
                              fontWeight: '700',
                              fontSize: '0.9rem'
                            }}>
                              {bidder.score}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* SCORING FORMULA EXPLANATION */}
              <div style={{
                marginTop: '2rem',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '0.75rem',
                padding: '1.5rem'
              }}>
                <h4 style={{ color: '#1e40af', margin: '0 0 1rem 0' }}>📏 Scoring Formula</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div>
                    <p style={{ color: '#1f2937', fontWeight: '600', margin: '0 0 0.5rem 0' }}>Base Components:</p>
                    <ul style={{ color: '#6b7280', margin: '0', paddingLeft: '1.5rem' }}>
                      <li>Base Score: +50 points</li>
                      <li>Per Contract: +100 points each</li>
                      <li>Payment Score: +1 point per ₹100</li>
                    </ul>
                  </div>
                  <div>
                    <p style={{ color: '#1f2937', fontWeight: '600', margin: '0 0 0.5rem 0' }}>Scoring Ranges:</p>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                      <div style={{ margin: '0.5rem 0' }}><span style={{ color: '#10b981', fontWeight: '600' }}>700-1000:</span> Excellent</div>
                      <div style={{ margin: '0.5rem 0' }}><span style={{ color: '#3b82f6', fontWeight: '600' }}>500-699:</span> Good</div>
                      <div style={{ margin: '0.5rem 0' }}><span style={{ color: '#f59e0b', fontWeight: '600' }}>300-499:</span> Average</div>
                      <div style={{ margin: '0.5rem 0' }}><span style={{ color: '#ef4444', fontWeight: '600' }}>1-299:</span> Beginner</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: '#fef3c7',
              borderRadius: '0.75rem',
              border: '1px solid #fcd34d'
            }}>
              <p style={{ color: '#92400e', fontSize: '1.1rem', margin: '0' }}>
                📭 No bidders registered yet
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GovernmentDashboard;
