import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router, Href } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button, Input, Heading, Body } from "@/design-system";
import { logger } from "@/utils/logger";

// Zod schema for phone number validation
const phoneSchema = z.object({
  phone: z.string().min(10, "Phone number is required"),
});

type PhoneForm = z.infer<typeof phoneSchema>;

interface PhoneInputScreenProps {
  isLoaded: boolean;
  onSubmitPhone: (phone: string) => Promise<void>;
  heading: string;
  subheading?: string;
  buttonText?: string;
  footerText: string;
  footerLinkText: string;
  footerLinkPath: Href;
  verifyOtpPath: string;
}

export function PhoneInputScreen({
  isLoaded,
  onSubmitPhone,
  heading,
  subheading,
  buttonText = "Continue",
  footerText,
  footerLinkText,
  footerLinkPath,
  verifyOtpPath,
}: PhoneInputScreenProps) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
    mode: "all",
  });

  const onSubmit = async (data: PhoneForm) => {
    if (!isLoaded) return;

    try {
      const phone = `+1${data.phone.replace(/[^0-9]/g, "")}`;

      await onSubmitPhone(phone);

      router.push({
        pathname: verifyOtpPath,
        params: { phone },
      } as Href);
    } catch (err) {
      logger.error("Phone sign-in failed:", err);
      setError("phone", {
        type: "manual",
        message: "Failed to send verification code. Please try again.",
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerClassName="flex-grow items-center justify-center px-6"
      enableOnAndroid={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-md gap-6">
        <View className="gap-2">
          <Heading className="text-center">{heading}</Heading>
          {subheading && (
            <Body className="text-center text-gray-600">{subheading}</Body>
          )}
        </View>

        <View className="gap-4">
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
                error={errors.phone?.message}
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || !isLoaded}
          >
            {buttonText}
          </Button>
        </View>

        <View className="flex flex-row justify-center">
          <Body className="text-gray-600">{footerText} </Body>
          <Body
            className="text-purple-600 font-semibold"
            onPress={() => router.replace(footerLinkPath)}
          >
            {footerLinkText}
          </Body>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
