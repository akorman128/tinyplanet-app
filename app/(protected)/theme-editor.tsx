import React, { useState } from "react";
import {
  View,
  Pressable,
  TextInput,
  Switch,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import {
  Text,
  Body,
  Caption,
  Icons,
  colors,
  MenuRow,
  radius,
} from "@/design-system";
import { ColorPicker } from "@/design-system/ColorPicker";
import { FontSelector } from "@/components/FontSelector";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { useThemeEditor } from "@/hooks/useThemeEditor";
import {
  ProfileThemeSettings,
  EmojiBorderSettings,
  PresetTheme,
  PRESET_THEMES,
  DEFAULT_THEME,
  DEFAULT_EMOJI_BORDER,
} from "@/types/theme";
import { CURATED_FONTS } from "@/utils/themeDefaults";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;

function deriveSelectedPresetId(theme: ProfileThemeSettings): string | null {
  const match = PRESET_THEMES.find(
    (p) =>
      p.backgroundColor === theme.backgroundColor &&
      p.fontColor === theme.fontColor &&
      theme.emojiBorder?.enabled === true &&
      JSON.stringify(p.emojis) === JSON.stringify(theme.emojiBorder?.emojis)
  );
  return match?.id ?? null;
}

interface PresetCardProps {
  preset: PresetTheme;
  isSelected: boolean;
  width: number;
  onPress: () => void;
}

function PresetCard({ preset, isSelected, width, onPress }: PresetCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${preset.name} theme preset: ${preset.emojis.join(" ")}`}
      accessibilityState={{ selected: isSelected }}
      style={{
        width,
        height: width,
        backgroundColor: preset.backgroundColor,
        borderRadius: radius.lg,
        borderWidth: isSelected ? 2 : 0,
        borderColor: isSelected ? colors.hex.blue900 : "transparent",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {isSelected && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: colors.hex.gray900,
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Icons.check size={12} color="#FFFFFF" />
        </View>
      )}
      <Text
        style={{
          color: preset.fontColor,
          fontSize: 18,
          fontWeight: "700",
        }}
      >
        {preset.name}
      </Text>
      <Text style={{ fontSize: 20, marginTop: 8 }}>
        {preset.emojis.join(" ")}
      </Text>
    </Pressable>
  );
}

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <View className="px-4 pt-2 ">
      <Pressable
        onPress={onReset}
        className="items-center py-2"
        accessibilityRole="button"
        accessibilityLabel="Reset theme to default"
      >
        <Text className="text-gray-500 text-sm font-semibold">
          Reset to Default
        </Text>
      </Pressable>
    </View>
  );
}

export default function ThemeEditorScreen() {
  const router = useRouter();
  const profile = useRequireProfile();
  const savedTheme = profile?.theme_settings ?? null;

  const { draftTheme, updateDraft, save, reset, isDirty, saving } =
    useThemeEditor(savedTheme);

  const [fontPickerVisible, setFontPickerVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = (windowWidth - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

  const selectedPresetId = deriveSelectedPresetId(draftTheme);

  const selectedFontDisplay =
    CURATED_FONTS.find((f) => f.family === draftTheme.fontFamily)
      ?.displayName ?? "System Default";

  const emojiBorder = draftTheme.emojiBorder ?? DEFAULT_EMOJI_BORDER;

  const updateEmojiBorder = (partial: Partial<EmojiBorderSettings>) => {
    updateDraft({
      emojiBorder: { ...emojiBorder, ...partial },
    });
  };

  const applyPreset = (preset: PresetTheme) => {
    updateDraft({
      backgroundColor: preset.backgroundColor,
      fontColor: preset.fontColor,
      fontFamily: null,
      emojiBorder: { emojis: preset.emojis, enabled: true },
    });
  };

  const handleSave = async () => {
    await save();
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Theme",
          headerRight: () => {
            const canSave = isDirty && !saving;
            return (
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.hex.blue500} />
                ) : (
                  <Icons.check
                    size={24}
                    color={canSave ? colors.hex.blue500 : colors.hex.gray300}
                  />
                )}
              </Pressable>
            );
          },
        }}
      />
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: colors.hex.cream }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {!showCustomize ? (
            <>
              {/* Preset Grid */}
              <View className="px-4 pt-2">
                <MenuRow
                  icon={<Body>⚙️</Body>}
                  label="Customize"
                  onPress={() => setShowCustomize(true)}
                />
              </View>
              <View className="px-4 pt-4 pb-2">
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: CARD_GAP,
                  }}
                >
                  {PRESET_THEMES.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPresetId === preset.id}
                      width={cardWidth}
                      onPress={() => applyPreset(preset)}
                    />
                  ))}
                </View>
              </View>

              <ResetButton onReset={reset} />
            </>
          ) : (
            <>
              {/* Back to Presets */}
              <View className="px-4 pt-4 pb-2">
                <Pressable
                  onPress={() => setShowCustomize(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Back to preset themes"
                >
                  <Icons.arrowLeft size={32} color={colors.black} />
                </Pressable>
              </View>

              {/* Font Section */}
              <View className="px-4 pt-4 pb-2">
                <Caption className="mb-2 uppercase tracking-wide font-semibold">
                  Font
                </Caption>
                <Pressable
                  onPress={() => setFontPickerVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Current font: ${selectedFontDisplay}. Tap to change.`}
                  className="border border-gray-300 rounded-xl px-4 py-3 bg-white flex-row items-center justify-between"
                >
                  <Body>{selectedFontDisplay}</Body>
                  <Text className="text-gray-400">Change</Text>
                </Pressable>
              </View>

              {/* Background Color Section */}
              <View className="px-4 pt-4 pb-2">
                <Caption className="mb-2 uppercase tracking-wide font-semibold">
                  Background Color
                </Caption>
                <ColorPicker
                  value={
                    draftTheme.backgroundColor ?? DEFAULT_THEME.backgroundColor!
                  }
                  onChange={(hex) => updateDraft({ backgroundColor: hex })}
                />
              </View>

              {/* Font Color Section */}
              <View className="px-4 pt-4 pb-2">
                <Caption className="mb-2 uppercase tracking-wide font-semibold">
                  Font Color
                </Caption>
                <ColorPicker
                  value={draftTheme.fontColor ?? DEFAULT_THEME.fontColor!}
                  onChange={(hex) => updateDraft({ fontColor: hex })}
                  contrastAgainst={
                    draftTheme.backgroundColor ?? DEFAULT_THEME.backgroundColor!
                  }
                />
              </View>

              {/* Emoji Border Section */}
              <View className="px-4 pt-4 pb-2">
                <View className="flex-row items-center justify-between mb-3">
                  <Caption className="uppercase tracking-wide font-semibold">
                    Emoji Border
                  </Caption>
                  <Switch
                    value={emojiBorder.enabled}
                    onValueChange={(val) => updateEmojiBorder({ enabled: val })}
                    trackColor={{
                      false: colors.hex.gray300,
                      true: colors.hex.gray900,
                    }}
                    accessibilityLabel="Toggle emoji border"
                  />
                </View>

                {emojiBorder.enabled && (
                  <View className="gap-3">
                    <View>
                      <Caption className="mb-1">
                        Emojis (space-separated)
                      </Caption>
                      <TextInput
                        className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                        value={emojiBorder.emojis.join(" ")}
                        onChangeText={(text) => {
                          const emojis = text
                            .split(/\s+/)
                            .filter((e) => e.length > 0);
                          if (emojis.length > 0) {
                            updateEmojiBorder({ emojis });
                          }
                        }}
                        autoCorrect={false}
                        accessibilityLabel="Emoji border emojis, space-separated"
                      />
                    </View>
                  </View>
                )}
              </View>

              <ResetButton onReset={reset} />
            </>
          )}
        </ScrollView>

        <FontSelector
          visible={fontPickerVisible}
          onClose={() => setFontPickerVisible(false)}
          selectedFont={draftTheme.fontFamily}
          onSelect={(family) => updateDraft({ fontFamily: family })}
        />
      </KeyboardAwareScrollView>
    </>
  );
}
