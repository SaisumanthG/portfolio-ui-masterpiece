import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyLayoutTemplate, applyThemeColors, applyThemeFont, applyThemeRadius, loadFontIfNeeded } from "@/lib/theme";

// Restore saved appearance
try {
  const savedColors = localStorage.getItem("portfolio_theme");
  if (savedColors) {
    const colors = JSON.parse(savedColors);
    applyThemeColors(colors);
  }

  const savedFont = localStorage.getItem("portfolio_font");
  if (savedFont) {
    loadFontIfNeeded(savedFont);
    applyThemeFont(savedFont);
  }

  const savedRadius = localStorage.getItem("portfolio_theme_radius");
  if (savedRadius) {
    applyThemeRadius(savedRadius);
  }

  const savedTemplate = localStorage.getItem("portfolio_layout_template") || "default";
  applyLayoutTemplate(savedTemplate);
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
