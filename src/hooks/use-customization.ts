import { useState, useEffect } from "react";
import { getCustomizations, subscribeToDatabaseChanges } from "@/lib/database";

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
  const [values, setValues] = useState<PageCustomization>(() => defaults[page] || {});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const all = await getCustomizations();
        if (mounted) setValues({ ...defaults[page], ...all[page] });
      } catch {
        if (mounted) setValues(defaults[page] || {});
      }
    };
    load();
    const unsubscribe = subscribeToDatabaseChanges(load);

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [page]);

  return values;
}
