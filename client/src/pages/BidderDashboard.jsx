import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { WalletContext } from "../context/WalletContext.jsx";
import TenderList from "./TenderList.jsx";

function BidderDashboard() {
  const { walletAddress } = useContext(WalletContext);
  const [activeTab, setActiveTab] = useState("available");
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const response = await axios.get("http://localhost:5000/tender/all");
        setTenders(response.data);
      } catch (error) {
        console.error("Error fetching tenders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  // Get ongoing contracts (bidder won but payment not released) - sorted by most recent first
  const ongoingContracts = tenders
    .filter(t => t.lastBidder === walletAddress && !t.paymentReleased)
    .sort((a, b) => b.tenderId - a.tenderId);

  // Debug logging
  console.log("🔍 BidderDashboard Debug:");
  console.log("Wallet Address:", walletAddress);
  console.log("All Tenders:", tenders.map(t => ({
    tenderId: t.tenderId,
    lastBidder: t.lastBidder,
    paymentReleased: t.paymentReleased,
    matches: t.lastBidder === walletAddress
  })));
  console.log("Ongoing Contracts Found:", ongoingContracts.length);

  // Get contract history (bidder won and payment released) - sorted by most recent first
  const contractHistory = tenders
    .filter(t => t.lastBidder === walletAddress && t.paymentReleased)
    .sort((a, b) => b.tenderId - a.tenderId);

  const totalMoneyReceived = contractHistory.reduce(
    (sum, contract) => sum + (contract.lastBidAmount || 0),
    0
  );

  // Get available tenders to bid on (tenders where user hasn't bid yet and bidding is open)
  const getTenderStatus = (start, end) => {
    const now = Math.floor(Date.now() / 1000);
    if (now < start) return "NOT_STARTED";
    if (now >= start && now <= end) return "OPEN";
    return "CLOSED";
  };

  const allTenders = tenders
    .filter(t => t.lastBidder !== walletAddress)
    .sort((a, b) => b.tenderId - a.tenderId);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>👷 Bidder Dashboard</h2>
        </div>
        <p style={{ textAlign: 'center', padding: '2rem' }}>⏳ Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>👷 Bidder Dashboard</h2>
        <div className="user-info">
          📍 Wallet: {walletAddress?.substring(0, 10)}...
        </div>
      </div>

      {/* TABS */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "available" ? "active" : ""}`}
          onClick={() => setActiveTab("available")}
        >
          🔓 Available Tenders ({allTenders.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          ✅ My Contract History ({contractHistory.length})
        </button>
      </div>

      {/* AVAILABLE TENDERS TAB */}
      {activeTab === "available" && (
        <div className="tab-content">
          {allTenders.length > 0 ? (
            <>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                All available tenders - Place bids on open tenders
              </p>
              <TenderList initialTenders={allTenders} isOngoing={false} />
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
                📭 No tenders available
              </p>
              <p style={{ color: '#92400e', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                Check back later for new bidding opportunities!
              </p>
            </div>
          )}
        </div>
      )}

      {/* CONTRACT HISTORY TAB */}
      {activeTab === "history" && (
        <div className="tab-content">
          {contractHistory.length > 0 ? (
            <>
              {/* SUMMARY CARD */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  background: '#d1fae5',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  borderLeft: '4px solid #10b981'
                }}>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                    COMPLETED CONTRACTS
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#047857', margin: '0' }}>
                    {contractHistory.length}
                  </p>
                </div>
                <div style={{
                  background: '#dbeafe',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                    TOTAL MONEY RECEIVED
                  </p>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1e40af', margin: '0' }}>
                    ₹{totalMoneyReceived.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* CONTRACTS GRID */}
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Contracts completed and payments released
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {contractHistory.map((contract, index) => (
                  <div
                    key={contract.tenderId}
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                      e.currentTarget.style.transform = 'translateY(-5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* STATUS BADGE */}
                    <div style={{ background: '#d1fae5', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                      <p style={{ color: '#166534', fontSize: '0.85rem', fontWeight: '600', margin: '0', textTransform: 'uppercase' }}>
                        ✅ COMPLETED & PAID
                      </p>
                    </div>

                    {/* TENDER TITLE */}
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
                      {contract.title}
                    </h4>
                    <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
                      {contract.description}
                    </p>

                    {/* DIVIDER */}
                    <div style={{ height: '1px', background: '#e5e7eb', margin: '1rem 0' }}></div>

                    {/* BID AMOUNT */}
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ color: '#9ca3af', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
                        💰 Your Winning Bid
                      </p>
                      <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#059669', margin: '0' }}>
                        ₹{contract.lastBidAmount?.toLocaleString()}
                      </p>
                    </div>

                    {/* DETAILS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <p style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>
                          Starting Amount
                        </p>
                        <p style={{ fontSize: '1rem', fontWeight: '700', color: '#374151', margin: '0' }}>
                          ₹{contract.maxAmount?.toLocaleString()}
                        </p>
                      </div>
                      <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem' }}>
                        <p style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>
                          You Saved
                        </p>
                        <p style={{ fontSize: '1rem', fontWeight: '700', color: '#059669', margin: '0' }}>
                          ₹{(contract.maxAmount - contract.lastBidAmount)?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* PAYMENT BADGE */}
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#d1fae5', borderRadius: '0.5rem', textAlign: 'center', borderLeft: '3px solid #10b981' }}>
                      <p style={{ color: '#065f46', fontWeight: '600', margin: '0', fontSize: '0.9rem' }}>
                        ✅ Payment Released
                      </p>
                    </div>
                  </div>
                ))}
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
                📭 No contract history yet
              </p>
              <p style={{ color: '#92400e', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                Your completed contracts will appear here
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default BidderDashboard;
