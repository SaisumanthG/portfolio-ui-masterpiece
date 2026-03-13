export type ThemeColorMap = Record<string, string>;

const parseHsl = (input?: string) => {
  if (!input) return null;
  const match = input.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!match) return null;
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) };
};

const getReadableForeground = (base: string | undefined, fallback: string) => {
  const parsed = parseHsl(base);
  if (!parsed) return fallback;
  if (parsed.l >= 72) return "222 47% 11%";
  if (parsed.l >= 58) return "225 30% 18%";
  return "0 0% 100%";
};

const getMutedForeground = (foreground?: string, background?: string) => {
  const fg = parseHsl(foreground);
  const bg = parseHsl(background);
  if (!fg || !bg) return "220 12% 46%";

  if (bg.l >= 85) {
    return `${fg.h} ${Math.max(8, fg.s - 16)}% 38%`;
  }

  if (bg.l >= 65) {
    return `${fg.h} ${Math.max(8, fg.s - 14)}% 42%`;
  }

  if (bg.l <= 30) {
    return `${fg.h} ${Math.max(10, fg.s - 8)}% 68%`;
  }

  return `${fg.h} ${Math.max(10, fg.s - 10)}% 52%`;
};

export function applyThemeColors(colors: ThemeColorMap) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, val]) => {
    if (!val) return;
    root.style.setProperty(`--${key}`, val);
  });

  const foreground = colors.foreground || root.style.getPropertyValue("--foreground").trim() || "210 20% 92%";
  const background = colors.background || root.style.getPropertyValue("--background").trim() || "225 45% 8%";
  const card = colors.card || root.style.getPropertyValue("--card").trim() || background;
  const primary = colors.primary || root.style.getPropertyValue("--primary").trim() || "230 80% 62%";
  const secondary = colors.secondary || root.style.getPropertyValue("--secondary").trim() || "225 35% 16%";
  const accent = colors.accent || root.style.getPropertyValue("--accent").trim() || primary;
  const border = colors.border || root.style.getPropertyValue("--border").trim() || secondary;

  root.style.setProperty("--glass-bg", card);
  root.style.setProperty("--glass-border", border);
  root.style.setProperty("--glow-color", primary);
  root.style.setProperty("--ring", primary);
  root.style.setProperty("--sidebar-primary", primary);
  root.style.setProperty("--sidebar-background", background);
  root.style.setProperty("--sidebar-foreground", foreground);
  root.style.setProperty("--card-foreground", foreground);
  root.style.setProperty("--popover", card);
  root.style.setProperty("--popover-foreground", foreground);
  root.style.setProperty("--input", secondary);

  root.style.setProperty("--primary-foreground", getReadableForeground(primary, "0 0% 100%"));
  root.style.setProperty("--secondary-foreground", getReadableForeground(secondary, foreground));
  root.style.setProperty("--accent-foreground", getReadableForeground(accent, "0 0% 100%"));
  root.style.setProperty("--muted-foreground", colors["muted-foreground"] || getMutedForeground(foreground, background));

  document.body.style.background = `linear-gradient(135deg, hsl(${background}) 0%, hsl(${card}) 100%)`;
  document.body.style.color = `hsl(${foreground})`;
}

export function applyThemeFont(font?: string) {
  if (!font) return;
  document.documentElement.style.setProperty("--font-family", font);
  document.body.style.fontFamily = font;
}

export function applyThemeRadius(radius?: string) {
  if (!radius) return;
  document.documentElement.style.setProperty("--radius", radius);
}

export function applyLayoutTemplate(template = "default") {
  document.documentElement.setAttribute("data-template", template);
}

export function loadFontIfNeeded(fontName?: string) {
  if (!fontName) return;
  const clean = fontName.split(",")[0].replace(/"/g, "").trim();
  if (!clean) return;
  const href = `https://fonts.googleapis.com/css2?family=${clean.replace(/ /g, "+")}:wght@300;400;500;600;700;800&display=swap`;
  if (document.querySelector(`link[href=\"${href}\"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}
