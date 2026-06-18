import React, { useState, useCallback } from "react";
import {
  View,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Text, SectionTitle, Icons, colors } from "@/design-system";
import { FontPreviewItem } from "@/design-system/FontPreviewItem";
import { CURATED_FONTS, CuratedFont } from "@/utils/themeDefaults";
import { useFontLoader } from "@/hooks/useFontLoader";
import { hapticSelection } from "@/utils";

interface FontSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedFont: string | null;
  onSelect: (fontFamily: string | null) => void;
}

function FontRow({
  font,
  selected,
  onSelect,
}: {
  font: CuratedFont;
  selected: boolean;
  onSelect: () => void;
}) {
  const { loaded } = useFontLoader(font.family);

  return (
    <FontPreviewItem
      fontName={font.family}
      displayName={font.displayName}
      loaded={loaded}
      selected={selected}
      onPress={onSelect}
    />
  );
}

export function FontSelector({
  visible,
  onClose,
  selectedFont,
  onSelect,
}: FontSelectorProps) {
  const [search, setSearch] = useState("");

  const filteredFonts = search
    ? CURATED_FONTS.filter((f) =>
        f.displayName.toLowerCase().includes(search.toLowerCase())
      )
    : CURATED_FONTS;

  const handleSelectSystem = () => {
    hapticSelection();
    onSelect(null);
    onClose();
  };

  const handleSelect = (family: string) => {
    onSelect(family);
    onClose();
  };

  const renderItem = useCallback(
    ({ item }: { item: CuratedFont }) => (
      <FontRow
        font={item}
        selected={selectedFont === item.family}
        onSelect={() => handleSelect(item.family)}
      />
    ),
    [selectedFont]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.hex.cream }}>
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <SectionTitle>Choose Font</SectionTitle>
          <Pressable onPress={onClose} hitSlop={8}>
            <Icons.close size={24} color={colors.black} />
          </Pressable>
        </View>
        <View className="px-4 py-2">
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Search fonts..."
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>
        <Pressable
          onPress={handleSelectSystem}
          className={`flex-row items-center px-4 py-3 border-b border-gray-100 ${
            selectedFont === null ? "bg-blue-50" : ""
          }`}
        >
          <Text className="flex-1 text-base text-gray-900">System Default</Text>
          {selectedFont === null && (
            <Icons.check size={20} color={colors.hex.blue500} />
          )}
        </Pressable>
        <FlatList
          data={filteredFonts}
          renderItem={renderItem}
          keyExtractor={(item: CuratedFont) => item.family}
        />
      </SafeAreaView>
    </Modal>
  );
}
