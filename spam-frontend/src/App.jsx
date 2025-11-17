import React from "react";
import SpamChecker from "./components/SpamChecker";

export default function App() {
  return (
    <div className="app-shell">
      <div className="brand">
        <div className="logo">✉️</div>
        <div>
          <h1>SpamSense</h1>
          <p className="brand-sub"><b>Quick spam/ham detection — simple, fast, stunning.</b></p>
        </div>
      </div>
      <SpamChecker />
      <footer className="footer">Built for demo — model runs on your backend</footer>
    </div>
  );
}
