import React, { useCallback, useState } from "react";
import { View, TextInput } from "react-native";
import ColorPickerLib, { Panel1, HueSlider } from "reanimated-color-picker";
import { runOnJS } from "react-native-reanimated";
import { Text } from "./Text";
import { colors } from "./colors";
import { getContrastRatio } from "@/utils/themeDefaults";

export interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  contrastAgainst?: string;
}

export function ColorPicker({
  value,
  onChange,
  contrastAgainst,
}: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);

  const showWarning =
    contrastAgainst && getContrastRatio(value, contrastAgainst) < 4.5;

  const handleColorChange = useCallback(
    ({ hex }: { hex: string }) => {
      "worklet";
      const normalized = hex.length === 9 ? hex.substring(0, 7) : hex;
      runOnJS(setHexInput)(normalized);
      runOnJS(onChange)(normalized);
    },
    [onChange]
  );

  const handleHexSubmit = () => {
    const cleaned = hexInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      onChange(cleaned);
    } else {
      setHexInput(value);
    }
  };

  return (
    <View className="gap-3">
      <ColorPickerLib
        value={value}
        onComplete={handleColorChange}
        style={{ gap: 12 }}
      >
        <Panel1 style={{ height: 120, borderRadius: 12 }} />
        <HueSlider style={{ height: 32, borderRadius: 12 }} />
      </ColorPickerLib>

      <View className="flex-row items-center gap-2">
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: value,
            borderWidth: 1,
            borderColor: colors.hex.gray300,
          }}
        />
        <TextInput
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
          value={hexInput}
          onChangeText={setHexInput}
          onBlur={handleHexSubmit}
          onSubmitEditing={handleHexSubmit}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={7}
          placeholder="#000000"
        />
      </View>

      {showWarning && (
        <View className="flex-row items-center bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          <Text className="text-yellow-800 text-xs">
            Low contrast — text may be hard to read (ratio:{" "}
            {getContrastRatio(value, contrastAgainst!).toFixed(1)}:1, minimum
            4.5:1)
          </Text>
        </View>
      )}
    </View>
  );
}
