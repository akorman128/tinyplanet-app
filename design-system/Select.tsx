import React, { useState, useRef } from "react";
import { View, Pressable, Modal, FlatList } from "react-native";
import { Text } from "./Text";
import { Icons } from "./Icons";
import { colors } from "./colors";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string> {
  label?: string;
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
}

export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  error,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const triggerRef = useRef<View>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPosition({
        top: y + height + 4,
        left: x,
        width: width,
      });
      setIsOpen(true);
    });
  };

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <View>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      )}

      <View ref={triggerRef} collapsable={false}>
        <Pressable
          className={`flex-row items-center justify-between px-4 py-3 bg-white border rounded-lg ${
            error
              ? "border-red-500"
              : isOpen
                ? "border-purple-600"
                : "border-gray-300"
          }`}
          onPress={handleOpen}
        >
          <Text
            className={`text-base ${
              selectedOption ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {selectedOption?.label || placeholder}
          </Text>
          <Icons.chevronDown
            size={20}
            color={colors.hex.gray500}
            style={{
              transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
            }}
          />
        </Pressable>
      </View>

      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable className="flex-1" onPress={() => setIsOpen(false)}>
          <View
            style={{
              position: "absolute",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              backgroundColor: "white",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.hex.gray300,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
              maxHeight: 250,
            }}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    className={`px-4 py-3 ${
                      isSelected ? "bg-purple-50" : "bg-white"
                    }`}
                    onPress={() => handleSelect(item.value)}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`text-base ${
                          isSelected
                            ? "text-purple-600 font-medium"
                            : "text-gray-900"
                        }`}
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Icons.check size={18} color={colors.hex.purple600} />
                      )}
                    </View>
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => (
                <View className="h-px bg-gray-100" />
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
