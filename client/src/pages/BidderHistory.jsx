import React, { useEffect, useState } from "react";
import axios from "axios";

function BidderHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:5000/tender/all")
      .then(res => setRecords(res.data))
      .catch(() => alert("Error loading data"))
      .finally(() => setLoading(false));
  }, []);

  const completedTenders = records.filter(t => t.paymentReleased);
  const totalWinners = completedTenders.length;
  const totalPaymentReleased = completedTenders.reduce((sum, t) => sum + (t.lastBidAmount || 0), 0);

  if (loading) {
    return (
      <div className="form-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>⏳ Loading bidders and winners...</p>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h3>🏆 Completed Tenders & Winners</h3>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        View all completed tender contracts with payment released
      </p>

      {/* STATS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#dbeafe', padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '4px solid #3b82f6' }}>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>COMPLETED TENDERS</p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#1e40af', margin: '0' }}>{totalWinners}</p>
        </div>
        <div style={{ background: '#d1fae5', padding: '1.5rem', borderRadius: '0.75rem', borderLeft: '4px solid #10b981' }}>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>TOTAL PAYMENT RELEASED</p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#047857', margin: '0' }}>₹{totalPaymentReleased.toLocaleString()}</p>
        </div>
      </div>

      {/* WINNERS LIST */}
      {completedTenders.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {completedTenders.map((t, index) => (
            <div 
              key={t.tenderId} 
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
              {/* TENDER INFO */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <p style={{ color: '#166534', fontSize: '0.85rem', fontWeight: '600', margin: '0', textTransform: 'uppercase' }}>
                    ✅ COMPLETED
                  </p>
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
                  {t.title}
                </h4>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0' }}>
                  {t.description}
                </p>
              </div>

              {/* DIVIDER */}
              <div style={{ height: '1px', background: '#e5e7eb', margin: '1rem 0' }}></div>

              {/* WINNER INFO */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
                  🏆 Winning Bidder
                </p>
                <p style={{ 
                  background: '#f3f4f6', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: '#1f2937',
                  margin: '0',
                  wordBreak: 'break-all'
                }}>
                  {t.lastBidder}
                </p>
              </div>

              {/* BID AMOUNT */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
                  💰 Winning Bid Amount
                </p>
                <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#059669', margin: '0' }}>
                  ₹{t.lastBidAmount?.toLocaleString()}
                </p>
              </div>

              {/* TENDER DETAILS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>
                    Starting Amount
                  </p>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: '#374151', margin: '0' }}>
                    ₹{t.maxAmount?.toLocaleString()}
                  </p>
                </div>
                <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>
                    Min Allowed
                  </p>
                  <p style={{ fontSize: '1rem', fontWeight: '700', color: '#374151', margin: '0' }}>
                    ₹{t.minAmount?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* STATUS BADGE */}
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#d1fae5', borderRadius: '0.5rem', textAlign: 'center', borderLeft: '3px solid #10b981' }}>
                <p style={{ color: '#065f46', fontWeight: '600', margin: '0', fontSize: '0.9rem' }}>
                  ✅ Payment Released
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#fef3c7', borderRadius: '0.75rem', border: '1px solid #fcd34d' }}>
          <p style={{ color: '#92400e', fontSize: '1.1rem', margin: '0' }}>
            📭 No completed tenders with payment released yet
          </p>
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

export default BidderHistory;
