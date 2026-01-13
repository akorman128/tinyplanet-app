import React, { forwardRef, useState, useEffect, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { useLists } from "@/hooks/useLists";
import { ViewableList } from "@/types/list";
import { LoadingState, EmptyState, Icons, colors } from "@/design-system";

interface ListPickerSheetProps {
  onSelect: (list: ViewableList | null) => void;
  selectedListId?: string | null;
  onSheetChange?: (index: number) => void;
}

export const ListPickerSheet = forwardRef<BottomSheet, ListPickerSheetProps>(
  ({ onSelect, selectedListId, onSheetChange }, ref) => {
    const { getViewableLists } = useLists();
    const [lists, setLists] = useState<ViewableList[]>([]);
    const [loading, setLoading] = useState(true);
    const [sheetIndex, setSheetIndex] = useState(-1);

    useEffect(() => {
      if (sheetIndex >= 0) {
        loadLists();
      }
    }, [sheetIndex]);

    const loadLists = async () => {
      try {
        setLoading(true);
        const { data } = await getViewableLists();
        setLists(data);
      } catch (err) {
        console.error("Error loading lists:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleSelect = (list: ViewableList) => {
      onSelect(list);
      (ref as React.RefObject<BottomSheet>).current?.close();
    };

    const handleClear = () => {
      onSelect(null);
      (ref as React.RefObject<BottomSheet>).current?.close();
    };

    const handleSheetChange = useCallback(
      (index: number) => {
        setSheetIndex(index);
        onSheetChange?.(index);
      },
      [onSheetChange]
    );

    const renderItem = ({ item }: { item: ViewableList }) => (
      <Pressable
        onPress={() => handleSelect(item)}
        className={`flex-row items-center px-4 py-3 border-b border-gray-100 ${
          selectedListId === item.id ? "bg-purple-50" : ""
        }`}
      >
        <Icons.list size={20} color={colors.hex.purple600} />
        <View className="flex-1 ml-3">
          <Text className="text-base font-medium text-gray-900">
            {item.title}
          </Text>
          <Text className="text-sm text-gray-500">
            {item.location_name}
            {item.owner_name !== "You" && ` - by ${item.owner_name}`}
          </Text>
        </View>
        {selectedListId === item.id && (
          <Icons.check size={20} color={colors.hex.purple600} />
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
        backgroundStyle={{ backgroundColor: colors.hex.white }}
      >
        <BottomSheetView className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-semibold">Attach a List</Text>
            {selectedListId && (
              <Pressable onPress={handleClear}>
                <Text className="text-purple-600 font-medium">Clear</Text>
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
