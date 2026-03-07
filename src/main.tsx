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
    // Derive glass/glow vars from theme
    if (colors.card) document.documentElement.style.setProperty("--glass-bg", colors.card);
    if (colors.border) document.documentElement.style.setProperty("--glass-border", colors.border);
    if (colors.primary) document.documentElement.style.setProperty("--glow-color", colors.primary);
    // Card foreground
    if (colors.foreground) {
      document.documentElement.style.setProperty("--card-foreground", colors.foreground);
      document.documentElement.style.setProperty("--popover-foreground", colors.foreground);
    }
    if (colors.card) {
      document.documentElement.style.setProperty("--popover", colors.card);
    }
    if (colors.primary) {
      document.documentElement.style.setProperty("--ring", colors.primary);
      document.documentElement.style.setProperty("--sidebar-primary", colors.primary);
    }
    if (colors.secondary) document.documentElement.style.setProperty("--input", colors.secondary);
    if (colors.muted) document.documentElement.style.setProperty("--muted-foreground", colors["muted-foreground"] || colors.muted);
  }
  // Restore saved font
  const font = localStorage.getItem("portfolio_font");
  if (font) {
    document.documentElement.style.setProperty("--font-family", font);
    document.body.style.fontFamily = font;
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
