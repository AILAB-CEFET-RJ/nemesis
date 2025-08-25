import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout } from "../utils/auth"; // clears localStorage

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);


  return (
    <nav className="bg-blue-600 h-20 flex items-center justify-between px-6 shadow-md">
      {/* Logo */}
    <div className="flex items-center">
      <img
        src={require("../assets/logo.png")}
        alt="App Logo"
        className="h-20 w-20"
      />
    </div>

      {/* Links */}
      <div className="flex gap-6 text-white font-medium">
        <Link to="/" className="hover:text-gray-200 transition">
          Home
        </Link>
        <Link to="/visualizer" className="hover:text-gray-200 transition">
          3D Visualizer
        </Link>
        <Link to="/query" className="hover:text-gray-200 transition">
          Query
        </Link>
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 text-white hover:text-gray-200 transition"
        >
          <span className="text-xl">👤</span>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-md py-2">
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/settings"); // route to user settings page
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              User Settings
            </button>
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
