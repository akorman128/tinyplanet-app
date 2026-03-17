import { useState, useCallback, useMemo } from "react";
import { useReducedMotion } from "react-native-reanimated";
import { ProfileThemeSettings, DEFAULT_THEME } from "@/types/theme";
import { useUpdateProfile } from "@/hooks/useProfile";

export function useThemeEditor(
  savedTheme: ProfileThemeSettings | null | undefined
) {
  const [draftTheme, setDraftTheme] = useState<ProfileThemeSettings>(
    savedTheme ?? DEFAULT_THEME
  );
  const updateProfile = useUpdateProfile();
  const reducedMotion = useReducedMotion() ?? false;

  const updateDraft = useCallback((partial: Partial<ProfileThemeSettings>) => {
    setDraftTheme((prev) => ({ ...prev, ...partial }));
  }, []);

  const save = useCallback(async () => {
    await updateProfile.mutateAsync({
      updateData: { theme_settings: draftTheme },
    });
  }, [draftTheme, updateProfile]);

  const reset = useCallback(() => {
    setDraftTheme(DEFAULT_THEME);
  }, []);

  const isDirty = useMemo(() => {
    const saved = savedTheme ?? DEFAULT_THEME;
    return JSON.stringify(draftTheme) !== JSON.stringify(saved);
  }, [draftTheme, savedTheme]);

  const syncFromSaved = useCallback(
    (theme: ProfileThemeSettings | null | undefined) => {
      setDraftTheme(theme ?? DEFAULT_THEME);
    },
    []
  );

  return {
    draftTheme,
    updateDraft,
    save,
    reset,
    isDirty,
    reducedMotion,
    saving: updateProfile.isPending,
    syncFromSaved,
  };
}
