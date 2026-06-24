import React, { forwardRef, useState } from "react";
import { View, Pressable } from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { useGetViewableLists } from "@/hooks/useLists";
import { ViewableList } from "@/types/list";
import {
  LoadingState,
  EmptyState,
  Icons,
  colors,
  SectionTitle,
  Body,
  Caption,
  Text,
} from "@/design-system";

interface ListPickerSheetProps {
  onSelect: (list: ViewableList | null) => void;
  selectedListId?: string | null;
  onSheetChange?: (index: number) => void;
}

export const ListPickerSheet = forwardRef<BottomSheet, ListPickerSheetProps>(
  ({ onSelect, selectedListId, onSheetChange }, ref) => {
    const { data: viewableResult, isLoading: loading } = useGetViewableLists();
    const lists = viewableResult?.data ?? [];
    const [sheetIndex, setSheetIndex] = useState(-1);

    const handleSelect = (list: ViewableList) => {
      onSelect(list);
      (ref as React.RefObject<BottomSheet>).current?.close();
    };

    const handleClear = () => {
      onSelect(null);
      (ref as React.RefObject<BottomSheet>).current?.close();
    };

    const handleSheetChange = (index: number) => {
      setSheetIndex(index);
      onSheetChange?.(index);
    };

    const renderItem = ({ item }: { item: ViewableList }) => (
      <Pressable
        onPress={() => handleSelect(item)}
        className={`flex-row items-center px-4 py-3 border-b border-gray-100 ${
          selectedListId === item.id ? "bg-blue-50" : ""
        }`}
      >
        <Icons.list size={20} color={colors.hex.blue500} />
        <View className="flex-1 ml-3">
          <Body className="font-medium">{item.title}</Body>
          <Caption>
            {item.location_name}
            {item.owner_name !== "You" && ` - by ${item.owner_name}`}
          </Caption>
        </View>
        {selectedListId === item.id && (
          <Icons.check size={20} color={colors.hex.blue500} />
        )}
      </Pressable>
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={["60%"]}
        enablePanDownToClose
        onChange={handleSheetChange}
        backgroundStyle={{ backgroundColor: colors.hex.cream }}
      >
        <BottomSheetView className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <SectionTitle>Attach a List</SectionTitle>
            {selectedListId && (
              <Pressable onPress={handleClear}>
                <Text className="text-blue-500 font-medium">Clear</Text>
              </Pressable>
            )}
          </View>

          {loading ? (
            <LoadingState />
          ) : lists.length === 0 ? (
            <EmptyState message="No lists available" />
          ) : (
            <BottomSheetFlatList
              data={lists}
              renderItem={renderItem}
              keyExtractor={(item: ViewableList) => item.id}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);
