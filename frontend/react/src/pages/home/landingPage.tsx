import React from "react";
import { Link } from "react-router-dom";

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans p-6">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to My App</h1>
        <p className="text-gray-600 mb-8">
          Choose where you want to go:
        </p>

        <div className="flex flex-col gap-4">
          <Link to="/visualizer">
            <button className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Go to Embeddings Projector
            </button>
          </Link>

          <Link to="/query">
            <button className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700 transition">
              Go to Query Page
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
