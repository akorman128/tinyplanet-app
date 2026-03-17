import { useState, useEffect } from "react";
import * as Font from "expo-font";
import { CURATED_FONTS } from "@/utils/themeDefaults";

const loadedFonts = new Set<string>();
const loadingFonts = new Map<string, Promise<void>>();

export function useFontLoader(fontFamily: string | null | undefined) {
  const [loaded, setLoaded] = useState(() =>
    fontFamily ? loadedFonts.has(fontFamily) : true
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fontFamily) {
      setLoaded(true);
      setError(null);
      return;
    }

    if (loadedFonts.has(fontFamily)) {
      setLoaded(true);
      setError(null);
      return;
    }

    const font = CURATED_FONTS.find((f) => f.family === fontFamily);
    if (!font) {
      setLoaded(false);
      setError(`Font "${fontFamily}" not found in curated list`);
      return;
    }

    // Deduplicate concurrent loads of the same font
    let promise = loadingFonts.get(fontFamily);
    if (!promise) {
      promise = Font.loadAsync({ [fontFamily]: font.url });
      loadingFonts.set(fontFamily, promise);
    }

    setLoaded(false);
    setError(null);

    promise
      .then(() => {
        loadedFonts.add(fontFamily);
        loadingFonts.delete(fontFamily);
        setLoaded(true);
      })
      .catch((err) => {
        loadingFonts.delete(fontFamily);
        setError(err?.message ?? "Failed to load font");
      });
  }, [fontFamily]);

  return { loaded, error };
}
