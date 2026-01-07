import React, { useState } from "react";
import axios from "axios";
import { getContract } from "../blockchain/contract";

function CreateTender() {
  const [data, setData] = useState({
    title: "",
    description: "",
    maxAmount: "",
    minAmount: "",
    biddingStart: "",
    biddingEnd: "",
  });
  const [loading, setLoading] = useState(false);

  const toTimestamp = (value) =>
    Math.floor(new Date(value).getTime() / 1000);

  const handleCreate = async () => {
    // Prevent multiple submissions while one is pending
    if (loading) {
      return alert("❌ A tender is already being created. Please wait...");
    }

    try {
      // Validation
      if (!data.title || !data.description || !data.maxAmount || !data.minAmount || 
          !data.biddingStart || !data.biddingEnd) {
        return alert("❌ Please fill all fields");
      }

      const maxAmount = Number(data.maxAmount);
      const minAmount = Number(data.minAmount);

      if (maxAmount <= 0 || minAmount <= 0) {
        return alert("❌ Amounts must be greater than 0");
      }

      if (minAmount > maxAmount) {
        return alert("❌ Minimum amount cannot be greater than maximum amount");
      }

      const startTS = toTimestamp(data.biddingStart);
      const endTS = toTimestamp(data.biddingEnd);

      if (startTS >= endTS) {
        return alert("❌ Bidding start time must be before end time");
      }

      const now = Math.floor(Date.now() / 1000);
      if (endTS <= now) {
        return alert("❌ Bidding end time must be in the future");
      }

      setLoading(true);
      const contract = await getContract();

      // Convert amounts and timestamps to BigInt for contract interaction
      const tx = await contract.createTender(
        data.title,
        data.description,
        BigInt(maxAmount),
        BigInt(minAmount),
        BigInt(startTS),
        BigInt(endTS)
      );
      await tx.wait();

      const tenderId = await contract.tenderCount();

      await axios.post("http://localhost:5000/tender/create", {
        tenderId: Number(tenderId),
        title: data.title,
        description: data.description,
        maxAmount: maxAmount,
        minAmount: minAmount,
        biddingStart: startTS,
        biddingEnd: endTS,
      });

      alert(`🎉 Tender Created (ID: ${tenderId})`);
      setData({
        title: "",
        description: "",
        maxAmount: "",
        minAmount: "",
        biddingStart: "",
        biddingEnd: "",
      });
    } catch (err) {
      console.error("Error creating tender:", err);
      const errorMsg = err?.reason || err?.message || "❌ Error creating tender";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>➕ Create New Tender</h3>
      <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
        Fill in the details below to create a new tender for bidders
      </p>

      {/* INFO BOX */}
      <div style={{
        background: '#e0f2fe',
        border: '1px solid #0ea5e9',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '2rem',
        fontSize: '0.9rem',
        color: '#0c4a6e'
      }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>📌 How Bidding Works:</p>
        <ul style={{ margin: '0', paddingLeft: '1.5rem', lineHeight: '1.6' }}>
          <li>Bidding starts at the <strong>Starting Bid Amount</strong></li>
          <li>Bidders can place <strong>lower bids</strong> (descending auction)</li>
          <li>The lowest bid must be <strong>≥ Minimum Acceptable Bid</strong></li>
          <li>Winner is the one with the lowest valid bid</li>
        </ul>
      </div>

      <div className="form-section">
        <label>Tender Title</label>
        <input 
          type="text"
          placeholder="e.g., Building Construction Project"
          value={data.title}
          onChange={(e) => setData({ ...data, title: e.target.value })}
        />
      </div>

      <div className="form-section">
        <label>Description</label>
        <textarea
          placeholder="Provide detailed description of the tender..."
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="form-section" style={{ margin: 0 }}>
          <label>Starting Bid Amount (₹) <span style={{ color: '#ef4444' }}>*</span></label>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.25rem 0 0.5rem 0' }}>Highest starting bid for auction</p>
          <input 
            type="number"
            placeholder="e.g., 1000000"
            value={data.maxAmount}
            onChange={(e) => setData({ ...data, maxAmount: e.target.value })}
          />
        </div>

        <div className="form-section" style={{ margin: 0 }}>
          <label>Minimum Acceptable Bid (₹) <span style={{ color: '#ef4444' }}>*</span></label>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0.25rem 0 0.5rem 0' }}>Lowest acceptable bid allowed</p>
          <input 
            type="number"
            placeholder="e.g., 500000"
            value={data.minAmount}
            onChange={(e) => setData({ ...data, minAmount: e.target.value })}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="form-section" style={{ margin: 0 }}>
          <label>Bidding Starts</label>
          <input 
            type="datetime-local"
            value={data.biddingStart}
            onChange={(e) => setData({ ...data, biddingStart: e.target.value })}
          />
        </div>

        <div className="form-section" style={{ margin: 0 }}>
          <label>Bidding Ends</label>
          <input 
            type="datetime-local"
            value={data.biddingEnd}
            onChange={(e) => setData({ ...data, biddingEnd: e.target.value })}
          />
        </div>
      </div>

      <button 
        onClick={handleCreate} 
        disabled={loading}
        style={{ 
          width: '100%', 
          padding: '1rem',
          marginTop: '1rem',
          background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        {loading ? "⏳ Creating Tender..." : "🚀 Create Tender"}
      </button>
    </div>
  );
}

export default CreateTender;
