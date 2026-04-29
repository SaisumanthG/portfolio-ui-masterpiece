import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyLayoutTemplate, applyThemeColors, applyThemeFont, applyThemeRadius, loadFontIfNeeded } from "@/lib/theme";
import { getAppearance } from "@/lib/database";

getAppearance().then((appearance) => {
  if (appearance.colors) applyThemeColors(appearance.colors);
  if (appearance.font) {
    loadFontIfNeeded(appearance.font);
    applyThemeFont(appearance.font);
  }
  if (appearance.radius) applyThemeRadius(appearance.radius);
  applyLayoutTemplate(appearance.template || "default");
}).catch(() => applyLayoutTemplate("default"));

createRoot(document.getElementById("root")!).render(<App />);
