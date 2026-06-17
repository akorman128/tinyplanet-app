import { View } from "react-native";

interface ProgressDotsProps {
  count: number;
  activeIndex: number;
}

export function ProgressDots({ count, activeIndex }: ProgressDotsProps) {
  return (
    <View className="flex-row items-center justify-center gap-[7px]">
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        const done = i < activeIndex;
        return (
          <View
            key={i}
            className={`h-[7px] rounded-full ${
              active
                ? "w-[26px] bg-purple-600"
                : done
                  ? "w-[7px] bg-purple-600/55"
                  : "w-[7px] bg-purple-200/20"
            }`}
          />
        );
      })}
    </View>
  );
}
