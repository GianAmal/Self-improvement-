import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Daymark render failure:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app-fatal-screen">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>
          <p className="eyebrow">DAYMARK / STARTUP CHECK</p>
          <h1>Something interrupted your workspace.</h1>
          <p className="fatal-detail">{this.state.error.message || "An unexpected rendering error occurred."}</p>
          <button className="primary-button" onClick={() => window.location.reload()}>Reload Daymark</button>
        </main>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
const bootFallback = document.getElementById("daymark-boot-fallback");
if (bootFallback) bootFallback.remove();

createRoot(root).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
