import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { WalletContext } from "../context/WalletContext";

function Navbar() {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const { setWalletAddress } = useContext(WalletContext);

  const handleLogout = () => {
    localStorage.removeItem("role");
    setWalletAddress(null);
    navigate("/");
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      background: 'linear-gradient(135deg, #7db8e8 0%, #6ba3d4 100%)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      color: 'white'
    }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: '600', fontSize: '1.1rem' }}>
          🏠 Home
        </Link>

        {role === "government" && (
          <Link to="/government" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>
            🏛 Government
          </Link>
        )}

        {role === "bidder" && (
          <Link to="/bidder" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>
            👷 Bidder
          </Link>
        )}
      </div>

      {role && (
        <button
          onClick={handleLogout}
          style={{
            background: '#772f2f21',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'background 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.background = '#dc2626'}
          onMouseLeave={(e) => e.target.style.background = '#ef4444'}
        >
          🚪 Logout
        </button>
      )}
    </div>
  );
}

export default Navbar;
