
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import { initializeAppData } from "./utils/storage";

import "./index.css";

// Initialize application data before React renders.
initializeAppData();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
