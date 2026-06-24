import { useState } from "react";
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

  const updateDraft = (partial: Partial<ProfileThemeSettings>) => {
    setDraftTheme((prev) => ({ ...prev, ...partial }));
  };

  const save = async () => {
    await updateProfile.mutateAsync({
      updateData: { theme_settings: draftTheme },
    });
  };

  const reset = () => {
    setDraftTheme(DEFAULT_THEME);
  };

  const saved = savedTheme ?? DEFAULT_THEME;
  const isDirty = JSON.stringify(draftTheme) !== JSON.stringify(saved);

  const syncFromSaved = (theme: ProfileThemeSettings | null | undefined) => {
    setDraftTheme(theme ?? DEFAULT_THEME);
  };

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
