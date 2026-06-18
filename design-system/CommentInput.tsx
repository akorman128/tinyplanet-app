import React, { ReactNode } from "react";
import { View, Pressable, ViewStyle } from "react-native";
import { Input } from "./Input";
import { Icons } from "./Icons";
import { colors } from "./colors";

export interface CommentInputProps {
  /** Input value */
  value: string;
  /** Called when input value changes */
  onChangeText: (text: string) => void;
  /** Called when send button is pressed */
  onSubmit: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the submit is in progress */
  isSubmitting?: boolean;
  /** Error message to display */
  error?: string;
  /** Maximum character length */
  maxLength?: number;
  /** Whether the submit button should be disabled */
  submitDisabled?: boolean;
  /** Optional left action button content */
  leftAction?: ReactNode;
  /** Input className override */
  inputClassName?: string;
  /** Container style override */
  style?: ViewStyle;
  /** Optional right action button content */
  rightAction?: ReactNode;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Add comment...",
  isSubmitting = false,
  error,
  maxLength = 500,
  submitDisabled = false,
  leftAction,
  rightAction,
  inputClassName = "max-h-[100px]",
  style,
}) => {
  const isDisabled = isSubmitting || submitDisabled;

  return (
    <View className="flex-row items-end gap-2" style={style}>
      {leftAction}

      <View className="flex-1">
        <Input
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline
          maxLength={maxLength}
          error={error}
          className={inputClassName}
        />
      </View>

      {rightAction}

      <Pressable
        onPress={onSubmit}
        disabled={isDisabled}
        className={`p-3 rounded-lg  ${
          isDisabled ? "bg-gray-300" : "bg-blue-500"
        }`}
      >
        <Icons.send
          size={20}
          color={isDisabled ? colors.hex.gray500 : colors.hex.white}
        />
      </Pressable>
    </View>
  );
};
