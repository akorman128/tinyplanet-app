import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import { Text } from "./Text";

type ButtonVariant = "primary" | "secondary" | "coral";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: string;
}

const variantStyles = {
  primary: "bg-black active:bg-gray-800",
  secondary: "bg-gray-300 active:bg-gray-400",
  coral: "bg-coral active:bg-coral-pressed",
};

const disabledVariantStyles = {
  primary: "bg-gray-300",
  secondary: "bg-gray-100 border-2 border-gray-300",
  coral: "bg-gray-300",
};

const textStyles = {
  primary: "text-white",
  secondary: "text-black",
  coral: "text-white",
};

const disabledTextStyles = {
  primary: "text-gray-500",
  secondary: "text-gray-400",
  coral: "text-gray-500",
};

const sizeStyles = {
  sm: "py-2 px-4 rounded-lg",
  md: "py-3 px-6 rounded-xl",
  lg: "py-4 px-8 rounded-xl",
};

const textSizeStyles = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  variant = "primary",
  size = "lg",
  className = "",
  children,
  disabled = false,
  ...props
}: ButtonProps) {
  const baseStyles = sizeStyles[size];
  const buttonVariantStyle = disabled
    ? disabledVariantStyles[variant]
    : variantStyles[variant];
  const buttonClass = `${baseStyles} ${buttonVariantStyle} ${className}`;
  const textVariantStyle = disabled
    ? disabledTextStyles[variant]
    : textStyles[variant];
  const textSize = textSizeStyles[size];

  return (
    <TouchableOpacity className={buttonClass} disabled={disabled} {...props}>
      <Text
        className={`text-center ${textSize} font-semibold ${textVariantStyle}`}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}
