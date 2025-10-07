import React from "react";
import "./Navbar.css";

function Navbar({ selectedModel, onModelChange }) {
  const models = [
    "Heart Disease",
    "Diabetes",
    "Cancer Diagnosis",
    "Body Fat Estimation",
  ];

  return (
    <nav className="navbar">
      <h2>🧬 Health Prediction Models</h2>
      <div className="nav-buttons">
        {models.map((m) => (
          <button
            key={m}
            className={selectedModel === m ? "active" : ""}
            onClick={() => onModelChange(m)}
          >
            {m}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;
