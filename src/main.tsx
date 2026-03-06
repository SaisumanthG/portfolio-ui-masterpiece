import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore saved theme
try {
  const saved = localStorage.getItem("portfolio_theme");
  if (saved) {
    const colors = JSON.parse(saved);
    Object.entries(colors).forEach(([key, val]) => {
      document.documentElement.style.setProperty(`--${key}`, val as string);
    });
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
