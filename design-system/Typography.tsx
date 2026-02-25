import { Text } from "./Text";
import { TextProps } from "react-native";

interface TypographyProps extends TextProps {
  className?: string;
}

export function SuperHeading({ className = "", ...props }: TypographyProps) {
  return (
    <Text className={`text-5xl font-medium text-black ${className}`} {...props} />
  );
}

export function Heading({ className = "", ...props }: TypographyProps) {
  return (
    <Text className={`text-2xl font-bold text-black ${className}`} {...props} />
  );
}

export function Subheading({ className = "", ...props }: TypographyProps) {
  return <Text className={`text-base text-gray-600 ${className}`} {...props} />;
}

export function SectionTitle({ className = "", ...props }: TypographyProps) {
  return (
    <Text
      className={`text-lg font-medium text-black ${className}`}
      {...props}
    />
  );
}

export function Body({ className = "", ...props }: TypographyProps) {
  return <Text className={`text-base text-black ${className}`} {...props} />;
}

export function Label({ className = "", ...props }: TypographyProps) {
  return (
    <Text
      className={`text-sm text-gray-700 ${className}`}
      {...props}
    />
  );
}

export function Caption({ className = "", ...props }: TypographyProps) {
  return <Text className={`text-sm text-gray-500 ${className}`} {...props} />;
}

export function Meta({ className = "", ...props }: TypographyProps) {
  return <Text className={`text-xs text-gray-500 ${className}`} {...props} />;
}
