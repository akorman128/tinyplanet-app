import React, { useState } from "react";
import { View, TouchableOpacity, Switch } from "react-native";
import type { PlatformStatistics } from "@/types/friendship";
import { Caption } from "./Typography";
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
  hasUnreadMessages?: boolean;
  statistics?: PlatformStatistics;
  showLines: boolean;
  onToggleLines: (value: boolean) => void;
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
  hasUnreadMessages,
  statistics,
  showLines,
  onToggleLines,
}: NavigationProps) {
  const insets = useSafeAreaInsets();
  const [showStats, setShowStats] = useState(false);

  return (
    <>
      {/* Custom ButtonGroup (Centered Top) */}
      <View
        className="absolute left-0 right-0 items-center px-35 z-10"
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
              badge: hasUnreadMessages,
            },
          ]}
        />

        {/* Stats Dropdown Arrow */}
        <TouchableOpacity
          onPress={() => setShowStats(!showStats)}
          className="mt-1 p-1"
        >
          <Icons.chevronDown
            size={16}
            color={colors.hex.gray500}
            style={{ transform: [{ rotate: showStats ? "180deg" : "0deg" }] }}
          />
        </TouchableOpacity>

        {/* Stats Dropdown */}
        {showStats && statistics && (
          <View className="bg-white/90 rounded-xl px-4 py-2 mt-1 shadow-md">
            <View className="flex-row items-center justify-between px-2 py-1">
              <Caption className="mr-3">🧵</Caption>
              {/* <Icons.audience
                size={28}
                color={colors.hex.purple900}
              /> */}
              <Switch
                value={showLines}
                onValueChange={onToggleLines}
                trackColor={{
                  false: colors.hex.placeholder,
                  true: colors.hex.purple600,
                }}
                thumbColor={colors.hex.white}
                ios_backgroundColor={colors.hex.placeholder}
                style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
              />
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center">
                <Caption>🌎</Caption>
                <Caption className="ml-1 font-bold">
                  {statistics.total_users.toLocaleString()}
                </Caption>
              </View>
              <View className="flex-row items-center">
                <Caption>🤝</Caption>
                <Caption className="ml-1 font-bold">
                  {statistics.connections_count}
                </Caption>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Profile Button (Top Left) */}
      <TouchableOpacity
        className="absolute left-5 w-12 h-12 rounded-full justify-center items-center z-10 shadow-lg"
        style={{ top: insets.top + 20 }}
        onPress={onProfilePress}
      >
        <Avatar
          fullName={profileFullName}
          avatarUrl={profileAvatarUrl}
          size="medium"
        />
      </TouchableOpacity>

      {/* Search Button (Top Right) */}
      <TouchableOpacity
        className="absolute right-5 w-12 h-12 rounded-full bg-white opacity-70 justify-center items-center z-10 shadow-md"
        style={{ top: insets.top + 20 }}
        onPress={onSearchPress}
      >
        <Icons.search size={64} color="black" />
      </TouchableOpacity>
    </>
  );
}
