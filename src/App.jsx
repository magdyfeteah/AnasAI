import "regenerator-runtime/runtime";
import React, { useState } from "react";
import "./App.css";
import TextField from "./Components/TextField/TextField";
import Header from "./Components/Header/Header";


function App() {
  const [aiResponse, setAiResponse] = useState("");

  return (
    <div className="container">
      <Header />
      <TextField onAiResponse={setAiResponse} />
      {aiResponse && (
        <div className="response">
          <strong>انس:</strong>
          <p className="ai-response">{aiResponse}</p>
        </div>
      )}

    </div>
  );
}

export default App;
