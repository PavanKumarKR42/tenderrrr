import React, { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { WalletContext } from "../context/WalletContext.jsx";

function GovernmentSignup() {
  const { walletAddress } = useContext(WalletContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    email: ""
  });

  const handleSubmit = async () => {
    if (!walletAddress) return alert("Connect wallet first!");

    // Validate form inputs
    if (!form.name || !form.email) {
      return alert("Please fill all fields");
    }

    // Simple email validation
    if (!form.email.includes("@")) {
      return alert("Please enter a valid email");
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/government/signup", {
        ...form,
        wallet: walletAddress
      });

      alert(res.data.message);
      
      if (res.status === 201) {
        setForm({
          name: "",
          email: ""
        });
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "❌ Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>🏛️ Government Registration</h2>
        <p>Create tenders and manage bidding process on our platform</p>

        <div className={`wallet-status ${walletAddress ? 'connected' : 'disconnected'}`}>
          {walletAddress ? (
            <>
              ✅ Wallet Connected
              <code>{walletAddress}</code>
            </>
          ) : (
            "❌ Please connect your wallet to continue"
          )}
        </div>

        <div className="form-group">
          <label>Government Name</label>
          <input
            type="text"
            placeholder="Department or Ministry name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            placeholder="official.email@government.gov"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <button 
          className="submit-button" 
          onClick={handleSubmit} 
          disabled={loading || !walletAddress}
        >
          {loading ? "Registering..." : "🏛️ Register as Government"}
        </button>

        <p className="text-secondary" style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Already registered? <a href="/">Go back to login</a>
        </p>
      </div>
    </div>
  );
}

export default GovernmentSignup;
