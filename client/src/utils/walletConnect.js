import { createContext, useEffect, useState } from "react";

export const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [walletAddress, setWalletAddress] = useState("");

  // 🔄 Restore wallet on refresh
  useEffect(() => {
    const restoreWallet = async () => {
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    };

    restoreWallet();
  }, []);

  return (
    <WalletContext.Provider value={{ walletAddress, setWalletAddress }}>
      {children}
    </WalletContext.Provider>
  );
}
