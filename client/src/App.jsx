import React, { useContext, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

import { WalletContext } from "./context/WalletContext.jsx";
import Navbar from "./layout/Navbar.jsx";

import GovernmentSignup from "./pages/GovernmentSignup.jsx";
import BidderSignup from "./pages/BidderSignup.jsx";
import CreateTender from "./pages/CreateTender.jsx";
import BidderDashboard from "./pages/BidderDashboard.jsx";
import "./styles/global.css";
import "./styles/auth.css";
import "./styles/dashboard.css";
import "./styles/tender.css";
import GovernmentDashboard from "./pages/GovernmentDashboard.jsx";



function App() {
  const { walletAddress, setWalletAddress } = useContext(WalletContext);
  const navigate = useNavigate();

  const role = localStorage.getItem("role");

  // 🔄 Restore wallet
  useEffect(() => {
    const restore = async () => {
      if (!window.ethereum) return;
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length > 0) setWalletAddress(accounts[0]);
    };
    restore();
  }, []);

  // 🔌 Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask not installed");
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setWalletAddress(accounts[0]);
  };

  // 🔐 Login
  const login = async () => {
    if (!walletAddress) return alert("Connect wallet first");

    const res = await axios.post("http://localhost:5000/login", {
      wallet: walletAddress,
    });

    if (res.data.role === "none") {
      alert("Wallet not registered");
      return;
    }

    localStorage.setItem("role", res.data.role);

    if (res.data.role === "government") navigate("/government");
    if (res.data.role === "bidder") navigate("/bidder");
  };

  // 🚪 Logout
  const logout = () => {
    localStorage.removeItem("role");
    setWalletAddress(null);
    navigate("/");
  };

  return (
    <>
      {role && <Navbar />}
      <Routes>
        {/* HOME */}
        <Route
          path="/"
          element={
            <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', minHeight: '100vh', paddingBottom: '3rem' }}>
              {/* HERO SECTION */}
              <div className="home-container">
                <div className="home-card">
                  <h1>🏢 Tender Management System</h1>
                  <p>Transparent, Decentralized Bidding Platform Powered by Blockchain</p>
                  
                  <div className="wallet-section">
                    {!walletAddress ? (
                      <>
                        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                          Connect your wallet to get started
                        </p>
                        <button 
                          onClick={connectWallet}
                          style={{ width: '100%', marginBottom: '1rem' }}
                        >
                          🔌 Connect MetaMask Wallet
                        </button>
                      </>
                    ) : (
                      <div className="wallet-info">
                        ✅ Connected: {walletAddress}
                      </div>
                    )}
                  </div>

                  {walletAddress && !role && (
                    <>
                      <div className="divider">
                        <div className="divider-text">New User?</div>
                      </div>
                      
                      <div className="button-group">
                        <button onClick={() => navigate("/signup-government")}>
                          🏛️ Register as Government
                        </button>
                        <button onClick={() => navigate("/signup-bidder")}>
                          👷 Register as Bidder
                        </button>
                      </div>

                      <div className="divider">
                        <div className="divider-text">Existing User?</div>
                      </div>

                      <button 
                        onClick={login}
                        style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                      >
                        ✅ Login
                      </button>
                    </>
                  )}

                  {role && (
                    <button 
                      onClick={logout}
                      className="danger"
                      style={{ width: '100%', marginTop: '1rem' }}
                    >
                      🚪 Logout
                    </button>
                  )}
                </div>
              </div>

              {/* ABOUT PROJECT SECTION */}
              <div style={{ maxWidth: '1200px', margin: '3rem auto', padding: '0 1rem' }}>
                {/* INTRO */}
                <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <h2 style={{ color: '#1f2937', marginTop: '0', fontSize: '2rem' }}>📋 About This Platform</h2>
                  <p style={{ color: '#6b7280', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    Our Tender Management System revolutionizes government procurement by leveraging blockchain technology to create a transparent, secure, and efficient bidding platform. We eliminate intermediaries, reduce fraud, and ensure fair competition among bidders while maintaining complete data integrity.
                  </p>
                </div>

                {/* KEY FEATURES */}
                <div style={{ marginBottom: '2rem' }}>
                  <h2 style={{ color: '#1f2937', fontSize: '2rem' }}>✨ Key Features</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {[
                      {
                        icon: '🔒',
                        title: 'Blockchain Security',
                        desc: 'All tender transactions are recorded immutably on the blockchain, ensuring no tampering or manipulation'
                      },
                      {
                        icon: '💰',
                        title: 'Smart Contracts',
                        desc: 'Automated contract execution ensures payment is released only when work is completed and verified'
                      },
                      {
                        icon: '🎯',
                        title: 'Fair Bidding',
                        desc: 'Descending auction model ensures lowest price bidding with complete transparency for all parties'
                      },
                      {
                        icon: '📊',
                        title: 'Performance Scoring',
                        desc: 'Track bidder reputation with comprehensive scoring based on contracts won and payment received'
                      },
                      {
                        icon: '🔍',
                        title: 'Full Transparency',
                        desc: 'Government can view all bidders, their wallets, company details, and performance metrics in real-time'
                      },
                      {
                        icon: '⚡',
                        title: 'Real-time Updates',
                        desc: 'Instant synchronization between blockchain and database ensures accurate tender status at all times'
                      }
                    ].map((feature, idx) => (
                      <div key={idx} style={{
                        background: 'white',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        border: '2px solid #e5e7eb'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                      >
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{feature.icon}</div>
                        <h3 style={{ color: '#1f2937', margin: '0.5rem 0' }}>{feature.title}</h3>
                        <p style={{ color: '#6b7280', margin: '0', lineHeight: '1.6' }}>{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HOW IT WORKS */}
                <div style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', border: '2px solid #3b82f6' }}>
                  <h2 style={{ color: '#1e40af', marginTop: '0' }}>🔄 How It Works</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {[
                      {
                        num: '1️⃣',
                        title: 'Government Creates Tender',
                        desc: 'Government officials create a tender with specifications, starting bid amount, and minimum acceptable bid'
                      },
                      {
                        num: '2️⃣',
                        title: 'Tender Posted on Blockchain',
                        desc: 'The tender details are recorded on the blockchain, creating an immutable record accessible to all'
                      },
                      {
                        num: '3️⃣',
                        title: 'Bidders Place Bids',
                        desc: 'Registered bidders compete by placing lower bids (descending auction). Each bid is verified and recorded'
                      },
                      {
                        num: '4️⃣',
                        title: 'Work Completion',
                        desc: 'The winning bidder completes the work and marks it as complete on the blockchain'
                      },
                      {
                        num: '5️⃣',
                        title: 'Payment Release',
                        desc: 'Government verifies completion and releases payment automatically via smart contract'
                      },
                      {
                        num: '6️⃣',
                        title: 'Reputation Tracked',
                        desc: 'Bidder reputation and performance score are updated automatically for future reference'
                      }
                    ].map((step, idx) => (
                      <div key={idx} style={{
                        background: 'white',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{step.num}</div>
                        <h3 style={{ color: '#1e40af', margin: '0.5rem 0' }}>{step.title}</h3>
                        <p style={{ color: '#6b7280', margin: '0', lineHeight: '1.6' }}>{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BENEFITS */}
                <div style={{ background: '#d1fae5', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', border: '2px solid #10b981' }}>
                  <h2 style={{ color: '#065f46', marginTop: '0' }}>🚀 Benefits</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <h3 style={{ color: '#059669' }}>For Government</h3>
                      <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
                        <li>✓ Complete transparency in all bids and transactions</li>
                        <li>✓ Reduced corruption and fraud</li>
                        <li>✓ Automatic contract execution with no intermediaries</li>
                        <li>✓ View complete bidder performance metrics</li>
                        <li>✓ Cost savings through competitive bidding</li>
                      </ul>
                    </div>
                    <div>
                      <h3 style={{ color: '#059669' }}>For Bidders</h3>
                      <ul style={{ color: '#6b7280', lineHeight: '1.8' }}>
                        <li>✓ Equal opportunity to bid on all tenders</li>
                        <li>✓ Transparent bidding process with real-time updates</li>
                        <li>✓ Secure and fast payment upon completion</li>
                        <li>✓ Build reputation and trust score</li>
                        <li>✓ No hidden fees or delays</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* BLOCKCHAIN BENEFITS */}
                <div style={{ background: 'linear-gradient(135deg, #fed7aa 0%, #fed7aa 100%)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', border: '2px solid #f59e0b' }}>
                  <h2 style={{ color: '#92400e' }}>⛓️ Why Blockchain?</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {[
                      {
                        title: 'Immutability',
                        desc: 'Once recorded, tender details and bids cannot be modified or deleted, ensuring authentic records'
                      },
                      {
                        title: 'Decentralization',
                        desc: 'No single authority controls the platform. Trust is built into the system itself'
                      },
                      {
                        title: 'Smart Contracts',
                        desc: 'Automated execution of terms eliminates need for intermediaries and reduces delays'
                      },
                      {
                        title: 'Auditability',
                        desc: 'Complete history of all transactions is available for audit and compliance verification'
                      }
                    ].map((benefit, idx) => (
                      <div key={idx} style={{
                        background: 'white',
                        borderRadius: '0.75rem',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <h3 style={{ color: '#92400e', margin: '0 0 0.5rem 0' }}>{benefit.title}</h3>
                        <p style={{ color: '#6b7280', margin: '0', lineHeight: '1.6' }}>{benefit.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STATS */}
                <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <h2 style={{ color: '#1f2937', marginTop: '0' }}>📈 Platform Stats</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {[
                      { label: 'Security Level', value: '100% Blockchain-backed' },
                      { label: 'Transaction Cost', value: 'Minimal Gas Fees' },
                      { label: 'Bidding Model', value: 'Descending Auction' },
                      { label: 'Platform', value: 'Decentralized & Transparent' }
                    ].map((stat, idx) => (
                      <div key={idx} style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        textAlign: 'center'
                      }}>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: '0.9' }}>{stat.label}</p>
                        <p style={{ margin: '0', fontSize: '1.3rem', fontWeight: '700' }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FOOTER */}
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <p style={{ marginTop: '0' }}>🔐 Secured by Blockchain | 🌍 Decentralized Platform | 📊 Real-time Transparency</p>
                  <p style={{ marginBottom: '0', fontSize: '0.9rem' }}>Start your journey with transparent, secure, and fair government procurement today.</p>
                </div>
              </div>
            </div>
          }
        />

        {/* SIGNUPS */}
        <Route path="/signup-government" element={<GovernmentSignup />} />
        <Route path="/signup-bidder" element={<BidderSignup />} />

        {/* GOVERNMENT */}
        <Route
          path="/government"
          element={
            role === "government"
              ? <GovernmentDashboard />
              : <Navigate to="/" />
          }
        />

        {/* BIDDER */}
        <Route
          path="/bidder"
          element={
            role === "bidder" ? (
              <BidderDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
