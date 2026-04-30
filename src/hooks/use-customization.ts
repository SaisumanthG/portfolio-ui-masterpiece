import { useState, useEffect, useCallback } from "react";

export interface PageCustomization {
  cardHeight?: number;
  cardPadding?: number;
  imageHeight?: number;
  profileSize?: number;
  collegeImageHeight?: number;
}

const defaults: Record<string, PageCustomization> = {
  projects: { cardHeight: 192, cardPadding: 16 },
  internships: { imageHeight: 160, cardPadding: 16 },
  hackathons: { cardHeight: 192, cardPadding: 16 },
  papers: { imageHeight: 224, cardPadding: 24 },
  certificates: { imageHeight: 224, cardPadding: 20 },
  home: { profileSize: 192, collegeImageHeight: 256, cardPadding: 20 },
};

export function useCustomization(page: string): PageCustomization {
  const [values, setValues] = useState<PageCustomization>(() => {
    try {
      const raw = localStorage.getItem("portfolio_customizations");
      if (raw) {
        const all = JSON.parse(raw);
        return { ...defaults[page], ...all[page] };
      }
    } catch {}
    return defaults[page] || {};
  });

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "portfolio_customizations") {
        try {
          const all = JSON.parse(e.newValue || "{}");
          setValues({ ...defaults[page], ...all[page] });
        } catch {}
      }
    };
    window.addEventListener("storage", handler);

    // Also poll for same-tab changes
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem("portfolio_customizations");
        if (raw) {
          const all = JSON.parse(raw);
          setValues({ ...defaults[page], ...all[page] });
        }
      } catch {}
    }, 500);

    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, [page]);

  return values;
}
