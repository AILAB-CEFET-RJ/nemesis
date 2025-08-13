import React from "react";
import { Link } from "react-router-dom";

export const LandingPage: React.FC = () => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "sans-serif",
    }}>
      <h1>Welcome to My App</h1>
      <p>Choose where you want to go:</p>
      
      <div style={{
        display: "flex",
        gap: "1rem",
        marginTop: "1rem"
      }}>
        <Link to="/visualizer">
          <button style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer"
          }}>
            Go to Embeddings Projector
          </button>
        </Link>

        <Link to="/query">
          <button style={{
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer"
          }}>
            Go to Query Page
          </button>
        </Link>
      </div>
    </div>
  );
};