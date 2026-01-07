import React, { useContext } from "react";
import axios from "axios";
import { WalletContext } from "../context/WalletContext.jsx";

function Login() {
  const { walletAddress, setWalletAddress } = useContext(WalletContext);

  const connectWallet = async () => {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWalletAddress(accounts[0]);
  };

  const handleLogin = async () => {
    if (!walletAddress) return alert("Connect wallet first!");

    const res = await axios.post("http://localhost:5000/login", {
      wallet: walletAddress,
    });

    alert(res.data.message);

    if (res.data.role === "government") {
      // redirect to government panel (we'll build later)
      console.log("Redirect → Government Dashboard");
    } 
    
    else if (res.data.role === "bidder") {
      // redirect to bidder panel
      console.log("Redirect → Bidder Dashboard");
    } 
    
    else {
      alert("Please register before login.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: 50 }}>
      <h2>Login Using Wallet</h2>

      {!walletAddress ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <p>Wallet Connected: {walletAddress}</p>
      )}

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;
