import React, { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://email-spam-classification-1-i931.onrender.com";
console.log("api" , API_URL)
const HISTORY_KEY = "spam_history_v1";
const MAX_HISTORY = 7;

function nowReadable(ts = Date.now()) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function SpamChecker() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [lastExampleIndex, setLastExampleIndex] = useState(null);
  const textareaRef = useRef(null);

  // Balanced examples: equal number of spam and ham samples
  const examples = [
    // Spam samples
    { text: "Congratulations! You won a $1000 gift card. Click the link to claim your prize.", label: "spam" },
    { text: "You have been selected for a special offer. Click the link to get ₹10,000 cashback.", label: "spam" },
    { text: "You have been selected for a free vacation. Provide card details to confirm.", label: "spam" },
    { text: "hi, you win the cash prize & lottrey of 10000 rs and free vouchers upto 8000INR.", label: "spam" },

    // Ham samples
    { text: "Claim your lottery winnings. Provide your bank details now.", label: "spam" },
    { text: "Can we move our 3pm meeting to 4pm? I have a call then.", label: "ham" },
    { text: "Hello, you have won a lucky draw coupon worth ₹15,000. Click here and fill the form to receive your reward.", label: "spam" },
    { text: "Happy birthday! Wishing you a wonderful day and a great year ahead.", label: "ham" }
  ];

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      try {
        setHistory(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  }, [history]);

  const pushHistory = (entry) => {
    setHistory((h) => [entry, ...h].slice(0, MAX_HISTORY));
  };

  const handlePredict = async (e) => {
    e?.preventDefault();
    setError(null);
    setResult(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Please enter email text to check.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error("Prediction failed");
      const data = await res.json();
      setResult(data);
      const entry = {
        id: Date.now(),
        text: trimmed.slice(0, 500),
        prediction: data.prediction,
        probability: data.probability || null,
        time: Date.now(),
      };
      pushHistory(entry);
    } catch (err) {
      console.error(err);
      setError("Could not reach the prediction service. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText("");
    setResult(null);
    setError(null);
    textareaRef.current?.focus();
  };


  const handleReRun = (item) => {
    setText(item.text);
    // run prediction shortly after setting text so UI updates
    setTimeout(() => handlePredict({ preventDefault: () => {} }), 120);
  };

  const clearHistory = () => {
    if (!confirm("Clear local history?")) return;
    setHistory([]);
  };


  // New: pick random example, balanced and avoid immediate repeat
  const insertRandomExample = () => {
    if (examples.length === 0) return;
    // pick index uniformly at random
    let idx;
    if (examples.length === 1) idx = 0;
    else {
      // try a few times to avoid picking same index as last time
      let attempts = 0;
      do {
        idx = Math.floor(Math.random() * examples.length);
        attempts++;
      } while (idx === lastExampleIndex && attempts < 8);
    }
    setLastExampleIndex(idx);
    setText(examples[idx].text);
    setResult(null);
    setError(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="container">
      <div className="left">
        <div className="card animated-card">
          <h2 className="card-title">Check an email — instantly</h2>
          <p className="muted">Paste the email body below and press <strong>Predict</strong>.</p>

          <form onSubmit={handlePredict}>
            <textarea
              ref={textareaRef}
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste email content here..."
              rows={8}
            />

            <div className="row space" style={{ marginTop: 12 }}>
              <div className="controls">
                <button className="btn primary" onClick={handlePredict} disabled={loading}>
                  {loading ? <span className="loader" /> : "Predict"}
                </button>
                <button className="btn ghost" type="button" onClick={handleReset}>
                  Reset
                </button>
                <button
                  className="btn link"
                  type="button"
                  onClick={insertRandomExample}
                  title="Insert a random example (spam or ham)"
                >
                  Insert Example
                </button>
              </div>

              <div className="meta" style={{ alignSelf: "center" }}>
                <div className="char">Chars: {text.length}</div>
              </div>
            </div>
          </form>

          {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}

          {result && (
            <div className="result-block">
              <div className={`badge ${result.prediction === 1 ? "spam" : "ham"}`}>
                {result.prediction === 1 ? "SPAM" : "HAM"}
              </div>
            </div>
          )}

          
        </div>
      </div>

      <aside className="right">
        <div className="panel">
          <div className="panel-head">
            <h3>Recent checks</h3>
            <div className="panel-actions">
              <button className="btn tiny" onClick={clearHistory} disabled={history.length===0}>Clear</button>
            </div>
          </div>

          {history.length === 0 && <div className="muted small">No recent checks</div>}

          <div className="history-list">
            {history.map((item) => (
              <div className="history-item" key={item.id}>
                <div className={`h-pill ${item.prediction === 1 ? "hp-spam" : "hp-ham"}`}>
                  {item.prediction === 1 ? "SPAM" : "HAM"}
                </div>
                <div className="h-body">
                  <div className="h-text">{item.text.length > 120 ? item.text.slice(0, 120) + "…" : item.text}</div>
                  <div className="h-meta">
                    <span className="h-time">{nowReadable(item.time)}</span>
                    {item.probability && (
                      <span className="h-prob">{((item.probability[0][item.prediction]||0)*100).toFixed(1)}%</span>
                    )}
                  </div>
                </div>
                <div className="h-actions">
                  <button className="btn tiny" onClick={() => handleReRun(item)}>Re-run</button>
                </div>
              </div>
            ))}
          </div>

          
        </div>
      </aside>
    </div>
  );
}
