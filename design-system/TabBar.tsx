import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "./Text";
import { colors } from "@/design-system/colors";
import { hapticSelection } from "@/utils";

export type Tab = {
  id: string;
  label: string;
};

type TabBarProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
};

export function TabBar({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: TabBarProps) {
  return (
    <View className={`flex-row bg-cream  rounded-sm shadow-lg ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            className={`flex-1 py-4 items-center justify-center ${isActive ? "border-b" : ""}`}
            onPress={() => {
              hapticSelection();
              onTabChange(tab.id);
            }}
            activeOpacity={0.7}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: isActive ? colors.black : colors.hex.gray300,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
