import { View, ViewProps } from "react-native";
import { Text } from "./Text";

type BadgeVariant = "default" | "primary" | "secondary" | "warning" | "error";
type BadgeSize = "small" | "medium";

export interface BadgeProps extends ViewProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: string;
}

const variantStyles = {
  default: "bg-gray-100",
  primary: "bg-purple-600",
  secondary: "bg-purple-100",
  warning: "bg-orange-100",
  error: "bg-red-100",
};

const textStyles = {
  default: "text-gray-500",
  primary: "text-white",
  secondary: "text-purple-600",
  warning: "text-orange-700",
  error: "text-red-700",
};

const sizeStyles = {
  small: "py-0.5 px-2 rounded",
  medium: "py-2 px-4 rounded-lg",
};

const textSizeStyles = {
  small: "text-xs",
  medium: "text-sm",
};

export function Badge({
  variant = "default",
  size = "medium",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const badgeClass = `${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  return (
    <View className={badgeClass} {...props}>
      <Text className={`${textSizeStyles[size]} font-semibold ${textStyles[variant]}`}>
        {children}
      </Text>
    </View>
  );
}
