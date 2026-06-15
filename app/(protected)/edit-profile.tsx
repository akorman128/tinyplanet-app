import React, { useState } from "react";
import {
  View,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { colors, Input, Button, TabBar, Icons } from "@/design-system";
import {
  LocationSearchInput,
  LocationSearchValue,
} from "@/components/LocationSearchInput";
import { useProfileStore } from "@/stores/profileStore";
import { useUpdateProfile } from "@/hooks/useProfile";
import { Profile } from "@/types/profile";
import { createPostGISPoint, parsePostGISPoint } from "@/utils/postgis";
import { logger } from "@/utils/logger";

// Zod schema for profile edit validation
const editProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .trim(),
  birthday: z.date({
    error: "Birthday is required",
  }),
  hometown: z
    .object({
      name: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
    .nullable()
    .refine((val) => val !== null, { message: "Hometown is required" }),
  website: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  x: z.string().trim().optional(),
  letterboxd: z.string().trim().optional(),
  beli: z.string().trim().optional(),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

type Tab = "account" | "socials";

function getInitialHometown(
  profile: Profile | null
): LocationSearchValue | null {
  if (!profile?.hometown) return null;
  const coords = profile.hometown_location
    ? parsePostGISPoint(profile.hometown_location)
    : null;
  return coords ? { name: profile.hometown, ...coords } : null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { profileState } = useProfileStore();
  const updateProfile = useUpdateProfile();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("account");

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: profileState?.full_name || "",
      birthday: profileState?.birthday
        ? new Date(profileState.birthday)
        : undefined,
      hometown: getInitialHometown(profileState),
      website: profileState?.website || "",
      instagram: profileState?.instagram || "",
      x: profileState?.x || "",
      letterboxd: profileState?.letterboxd || "",
      beli: profileState?.beli || "",
    },
    mode: "all",
  });

  const onSubmit = async (data: EditProfileForm) => {
    try {
      const hometown = data.hometown!; // refine guarantees non-null
      await updateProfile.mutateAsync({
        updateData: {
          full_name: data.fullName.trim(),
          birthday: data.birthday.toISOString(),
          hometown: hometown.name,
          hometown_location: createPostGISPoint(
            hometown.latitude,
            hometown.longitude
          ),
          website: data.website?.trim() || "",
          instagram: data.instagram?.trim() || "",
          x: data.x?.trim() || "",
          letterboxd: data.letterboxd?.trim() || "",
          beli: data.beli?.trim() || "",
        },
      });

      // Show success message
      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      logger.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  };

  const handleDateChange = (
    onChange: (date: Date) => void,
    _event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
      setValue("birthday", selectedDate, { shouldValidate: true });
    }
  };

  const formatDate = (date?: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const tabs = [
    { id: "account", label: "Account" },
    { id: "socials", label: "Socials" },
  ] as const;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Profile",
          headerRight: () => {
            const canSave =
              isDirty &&
              Object.keys(errors).length === 0 &&
              !updateProfile.isPending;
            return (
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={!canSave}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {updateProfile.isPending ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.hex.purple600}
                  />
                ) : (
                  <Icons.check
                    size={24}
                    color={canSave ? colors.hex.purple600 : colors.hex.gray300}
                  />
                )}
              </Pressable>
            );
          },
        }}
      />
      <View className="flex-1 bg-cream">
        {/* Tabs */}
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Form */}
        <KeyboardAwareScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-6 pb-12"
          enableOnAndroid={true}
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-5">
            {/* Account Tab */}
            {activeTab === "account" && (
              <>
                {/* Full Name */}
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Full Name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter your full name"
                      autoCapitalize="words"
                      autoComplete="name"
                      textContentType="name"
                      error={errors.fullName?.message}
                    />
                  )}
                />

                {/* Birthday */}
                <Controller
                  control={control}
                  name="birthday"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <Pressable onPress={() => setShowDatePicker(true)}>
                        <Input
                          label="Birthday"
                          value={value ? formatDate(value) : ""}
                          placeholder="Select your birthday"
                          editable={false}
                          pointerEvents="none"
                          error={errors.birthday?.message}
                        />
                      </Pressable>

                      {showDatePicker && (
                        <View className="bg-white rounded-xl p-4 gap-4">
                          <DateTimePicker
                            value={value || new Date()}
                            mode="date"
                            display={
                              Platform.OS === "ios" ? "spinner" : "default"
                            }
                            onChange={(event, date) =>
                              handleDateChange(onChange, event, date)
                            }
                            maximumDate={new Date()}
                            textColor="#000000"
                          />
                          {Platform.OS === "ios" && (
                            <Button
                              variant="secondary"
                              onPress={() => setShowDatePicker(false)}
                            >
                              Done
                            </Button>
                          )}
                        </View>
                      )}
                    </>
                  )}
                />

                {/* Hometown */}
                <Controller
                  control={control}
                  name="hometown"
                  render={({ field: { onChange, value } }) => (
                    <LocationSearchInput
                      label="Hometown"
                      placeholder="Where are you from?"
                      value={value}
                      onChange={onChange}
                      error={errors.hometown?.message}
                      inputClassName="shadow-sm"
                    />
                  )}
                />
              </>
            )}

            {/* Socials Tab */}
            {activeTab === "socials" && (
              <>
                {/* Website */}
                <Controller
                  control={control}
                  name="website"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Website"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="https://example.com"
                      autoCapitalize="none"
                      autoComplete="url"
                      textContentType="URL"
                      keyboardType="url"
                      error={errors.website?.message}
                    />
                  )}
                />

                {/* Instagram */}
                <Controller
                  control={control}
                  name="instagram"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Instagram"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="username"
                      autoCapitalize="none"
                      error={errors.instagram?.message}
                    />
                  )}
                />

                {/* X */}
                <Controller
                  control={control}
                  name="x"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="X "
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="username"
                      autoCapitalize="none"
                      error={errors.x?.message}
                    />
                  )}
                />

                {/* Letterboxd */}
                <Controller
                  control={control}
                  name="letterboxd"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Letterboxd"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="username"
                      autoCapitalize="none"
                      error={errors.letterboxd?.message}
                    />
                  )}
                />

                {/* Beli */}
                <Controller
                  control={control}
                  name="beli"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Beli"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="username"
                      autoCapitalize="none"
                      error={errors.beli?.message}
                    />
                  )}
                />
              </>
            )}
          </View>
        </KeyboardAwareScrollView>
      </View>
    </>
  );
}
