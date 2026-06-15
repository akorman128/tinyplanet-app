import { Text as RNText, TextProps, StyleSheet } from "react-native";
import { useThemeTextStyle } from "./ThemeTextContext";

export function Text({
  className = "",
  style,
  ...props
}: TextProps & { className?: string }) {
  const { fontFamily, fontColor } = useThemeTextStyle();

  const themeStyle =
    fontFamily || fontColor ? { fontFamily, color: fontColor } : undefined;

  return (
    <RNText
      className={`${className}`}
      style={StyleSheet.flatten([themeStyle, style])}
      {...props}
    />
  );
}
