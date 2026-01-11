import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ButtonGroup } from "./ButtonGroup";
import { Avatar } from "./Avatar";
import { Icons } from "./Icons";
import { colors } from "./colors";

export interface NavigationProps {
  activeTabIndex: number;
  onMapPress: () => void;
  onFeedPress: () => void;
  onMessagesPress: () => void;
  onProfilePress: () => void;
  onSearchPress: () => void;
  profileFullName?: string;
  profileAvatarUrl?: string;
}

export function Navigation({
  activeTabIndex,
  onMapPress,
  onFeedPress,
  onMessagesPress,
  onProfilePress,
  onSearchPress,
  profileFullName = "",
  profileAvatarUrl,
}: NavigationProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      {/* Custom ButtonGroup (Centered Top) */}
      <View
        className="absolute left-0 right-0 flex-row justify-center px-20 z-10"
        style={{ top: insets.top + 20 }}
        pointerEvents="box-none"
      >
        <ButtonGroup
          activeIndex={activeTabIndex}
          options={[
            {
              icon: Icons.globe,
              onPress: onMapPress,
            },
            {
              icon: Icons.posts,
              onPress: onFeedPress,
            },
            {
              icon: Icons.messageOutline,
              onPress: onMessagesPress,
            },
          ]}
        />
      </View>

      {/* Profile Button (Top Left) */}
      <TouchableOpacity
        className="absolute left-5 w-12 h-12 rounded-full justify-center items-center z-10"
        style={{
          top: insets.top + 20,
          backgroundColor: colors.hex.white,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        onPress={onProfilePress}
      >
        <Avatar
          fullName={profileFullName}
          avatarUrl={profileAvatarUrl}
          size="small"
        />
      </TouchableOpacity>

      {/* Search Button (Top Right) */}
      <TouchableOpacity
        className="absolute right-5 w-12 h-12 rounded-full bg-white opacity-70 justify-center items-center z-10"
        style={{
          top: insets.top + 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
        onPress={onSearchPress}
      >
        <Icons.search size={64} color="black" />
      </TouchableOpacity>
    </>
  );
}
