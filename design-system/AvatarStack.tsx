import React from "react";
import { View, Image } from "react-native";
import { Text } from "./Text";
import { getInitials } from "@/utils";
import { colors } from "./colors";

export type AvatarStackSize = "small" | "medium" | "large";

const SIZE_PX: Record<AvatarStackSize, number> = {
  small: 26,
  medium: 32,
  large: 40,
};

export interface AvatarStackPerson {
  id?: string;
  full_name: string;
  avatar_url?: string | null;
}

export interface AvatarStackProps {
  people: AvatarStackPerson[];
  /** Max avatars to render before collapsing into a +N chip. */
  max?: number;
  /** Named size variant, or an explicit diameter in px. */
  size?: AvatarStackSize | number;
  /** Ground color the 2px border blends into. */
  borderColor?: string;
  /** Total count (e.g. attendee_count) used to compute the +N overflow. Defaults to people.length. */
  total?: number;
}

export function AvatarStack({
  people,
  max = 3,
  size = "small",
  borderColor = colors.hex.white,
  total,
}: AvatarStackProps) {
  const diameter = typeof size === "number" ? size : SIZE_PX[size];
  const shown = people.slice(0, max);
  const overflow = Math.max(0, (total ?? people.length) - shown.length);
  const overlap = Math.round(diameter / 3);

  return (
    <View className="flex-row items-center">
      {shown.map((person, index) => (
        <View
          key={person.id ?? `${person.full_name}-${index}`}
          style={{
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            borderWidth: 2,
            borderColor,
            marginLeft: index === 0 ? 0 : -overlap,
            backgroundColor: colors.hex.gray900,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {person.avatar_url ? (
            <Image
              source={{ uri: person.avatar_url }}
              style={{ width: diameter, height: diameter }}
              fadeDuration={0}
            />
          ) : (
            <Text
              style={{
                fontSize: diameter * 0.4,
                fontWeight: "600",
                color: colors.hex.white,
              }}
            >
              {getInitials(person.full_name)}
            </Text>
          )}
        </View>
      ))}

      {overflow > 0 && (
        <View
          style={{
            height: diameter,
            minWidth: diameter,
            paddingHorizontal: 4,
            borderRadius: diameter / 2,
            borderWidth: 2,
            borderColor,
            marginLeft: -overlap,
            backgroundColor: colors.hex.gray300,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: diameter * 0.38,
              fontWeight: "600",
              color: colors.hex.gray600,
            }}
          >
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}
