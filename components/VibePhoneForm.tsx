import { View, Pressable } from "react-native";
import { Control, Controller } from "react-hook-form";
import { Icons, Input, colors } from "@/design-system";

interface VibeFormValues {
  emojis: string;
  phone: string;
}

interface VibePhoneFormProps {
  control: Control<VibeFormValues>;
  vibeError?: string;
  phoneError?: string;
  onSelectContact?: () => void;
  showContactPicker?: boolean;
  maxLength?: number;
}

export function VibePhoneForm({
  control,
  vibeError,
  phoneError,
  onSelectContact,
  showContactPicker = true,
  maxLength = 100,
}: VibePhoneFormProps) {
  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="emojis"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Vibe"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="😊🎉✨"
            keyboardType="default"
            error={vibeError}
            maxLength={maxLength}
          />
        )}
      />

      <View className="gap-2">
        <View className="flex-row gap-2 items-end">
          <View className="flex-1">
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone Number"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="(917) 123-4567"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  error={phoneError}
                />
              )}
            />
          </View>

          {showContactPicker && (
            <Pressable
              onPress={onSelectContact}
              accessibilityRole="button"
              accessibilityLabel="Select contact"
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-xl bg-primary active:bg-primary-dark"
            >
              <Icons.userList size={22} color={colors.hex.white} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
