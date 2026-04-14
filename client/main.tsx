import "./global.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

// Store the root instance for HMR updates
declare global {
  interface Window {
    __reactRoot?: ReturnType<typeof ReactDOM.createRoot>;
  }
}

if (container.hasChildNodes() && window.__reactRoot) {
  // If root already exists (HMR reload), use the existing root
  window.__reactRoot.render(<App />);
} else {
  // Create a new root on first load
  const root = ReactDOM.createRoot(container);
  window.__reactRoot = root;
  root.render(<App />);
}
