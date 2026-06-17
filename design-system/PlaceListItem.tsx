import { View, Pressable } from "react-native";
import { Text } from "./Text";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { ListPlace } from "@/types/list";
import { Badge } from "./Badge";
import { Icons } from "./Icons";
import { colors } from "./colors";

export interface PlaceListItemProps {
  place: ListPlace;
  index: number;
  onEdit?: (place: ListPlace) => void;
  onDelete?: (placeId: string) => void;
  swipeable?: boolean;
}

export function PlaceListItem({
  place,
  index,
  onEdit,
  onDelete,
  swipeable = false,
}: PlaceListItemProps) {
  const isAmbiguous = place.status === "ambiguous";
  const isUnresolved = place.status === "unresolved";

  const renderRightActions = () => (
    <View className="flex-row items-center">
      {onEdit && (
        <Pressable
          onPress={() => onEdit(place)}
          className="justify-center items-center bg-purple-600 w-16 mb-4"
          style={{ height: "100%" }}
        >
          <Icons.edit size={20} color={colors.black} />
        </Pressable>
      )}
      {onDelete && (
        <Pressable
          onPress={() => onDelete(place.id)}
          className="justify-center items-center bg-red-600 w-16 mb-4"
          style={{ height: "100%" }}
        >
          <Icons.trash size={20} color={colors.hex.white} />
        </Pressable>
      )}
    </View>
  );

  const content = (
    <View className="mb-4 pb-4 border-b border-gray-100 bg-cream">
      <View className="flex-row items-start justify-between mb-1">
        <Text className="text-base font-semibold text-gray-900 flex-1">
          {index + 1}. {place.resolved_name}
        </Text>
        {(isAmbiguous || isUnresolved) && (
          <Badge variant={isUnresolved ? "error" : "warning"} size="small">
            {isUnresolved ? "Unresolved" : "Ambiguous"}
          </Badge>
        )}
      </View>

      {place.original_text !== place.resolved_name && (
        <Text className="text-sm text-gray-600 mb-1">
          Original: {place.original_text}
        </Text>
      )}
    </View>
  );

  if (swipeable && (onEdit || onDelete)) {
    return (
      <ReanimatedSwipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        {content}
      </ReanimatedSwipeable>
    );
  }

  return content;
}
