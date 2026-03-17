import React, { useMemo } from "react";
import { View } from "react-native";
import { ProfileThemeSettings } from "@/types/theme";
import { AnimatedEmojiBorder } from "./AnimatedEmojiBorder";
import { ThemeTextProvider, ThemeTextStyle } from "./ThemeTextContext";
import { colors } from "./colors";

export interface ThemedProfileContainerProps {
  theme: ProfileThemeSettings | null | undefined;
  fontLoaded: boolean;
  reducedMotion: boolean;
  children: React.ReactNode;
}

export function ThemedProfileContainer({
  theme,
  fontLoaded,
  reducedMotion,
  children,
}: ThemedProfileContainerProps) {
  const bg = theme?.backgroundColor ?? colors.hex.cream;
  const emojiBorder = theme?.emojiBorder;

  const textStyle = useMemo<ThemeTextStyle>(
    () => ({
      fontFamily:
        fontLoaded && theme?.fontFamily ? theme.fontFamily : undefined,
      fontColor: theme?.fontColor ?? undefined,
      backgroundColor: bg,
    }),
    [fontLoaded, theme?.fontFamily, theme?.fontColor, bg]
  );

  const content = (
    <ThemeTextProvider value={textStyle}>
      <View style={{ flex: 1, backgroundColor: bg }}>{children}</View>
    </ThemeTextProvider>
  );

  if (emojiBorder?.enabled && emojiBorder.emojis.length > 0) {
    return (
      <AnimatedEmojiBorder
        emojis={emojiBorder.emojis}
        reducedMotion={reducedMotion}
      >
        {content}
      </AnimatedEmojiBorder>
    );
  }

  return content;
}
