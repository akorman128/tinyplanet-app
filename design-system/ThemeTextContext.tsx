import { createContext, useContext } from "react";

export interface ThemeTextStyle {
  fontFamily?: string;
  fontColor?: string;
  backgroundColor?: string;
}

const ThemeTextContext = createContext<ThemeTextStyle>({});

export const ThemeTextProvider = ThemeTextContext.Provider;

export function useThemeTextStyle(): ThemeTextStyle {
  return useContext(ThemeTextContext);
}
