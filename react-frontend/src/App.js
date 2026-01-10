import React, { useState } from "react";
import Navbar from "./components/Navbar";
import PredictionForm from "./components/PredictionForm";
import Chatbot from "./components/Chatbot";
import "./App.css";

function App() {
  const [selectedModel, setSelectedModel] = useState("Heart Disease");

  const handleModelChange = (model) => setSelectedModel(model);

  return (
    <div className="App">
      <Navbar selectedModel={selectedModel} onModelChange={handleModelChange} />

      <main className="main-content">
        <h1>🩺 AI Health Prediction Dashboard</h1>
        <p className="caption">
          Powered by <strong>FastAPI + React + Machine Learning</strong>
        </p>
        <PredictionForm selectedModel={selectedModel} />
      </main>

      <Chatbot />
    </div>
  );
}

export default App;
