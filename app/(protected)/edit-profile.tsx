import React, { useState } from "react";
import {
  View,
  Pressable,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors, Input, Button, Body, TabBar, Text } from "@/design-system";
import {
  LocationSearchInput,
  LocationSearchValue,
} from "@/components/LocationSearchInput";
import { useProfileStore } from "@/stores/profileStore";
import { useUpdateProfile } from "@/hooks/useProfile";
import { parsePostGISPoint } from "@/utils/postgis";

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
  avatarUrl: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  x: z.string().trim().optional(),
  letterboxd: z.string().trim().optional(),
  beli: z.string().trim().optional(),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

type Tab = "account" | "socials";

export default function EditProfileScreen() {
  const router = useRouter();
  const { profileState } = useProfileStore();
  const updateProfile = useUpdateProfile();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("account");

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: profileState?.full_name || "",
      birthday: profileState?.birthday
        ? new Date(profileState.birthday)
        : undefined,
      hometown: (() => {
        if (!profileState?.hometown) return null;
        const coords = profileState.hometown_location
          ? parsePostGISPoint(profileState.hometown_location)
          : null;
        if (coords) {
          return { name: profileState.hometown, ...coords };
        }
        return null;
      })(),
      website: profileState?.website || "",
      avatarUrl: profileState?.avatar_url || "",
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
          hometown_location: `POINT(${hometown.longitude} ${hometown.latitude})`,
          website: data.website?.trim() || "",
          avatar_url: data.avatarUrl?.trim() || "",
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
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  };

  const handleDateChange = (
    onChange: (date: Date) => void,
    _event: unknown,
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

  const formatDate = (date: Date | null) => {
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
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Edit Profile" }} />
      <View className="flex-1 bg-cream">
        {/* Tabs */}
        <TabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as Tab)}
        />

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
                      <View className="w-full">
                        <Body className="text-sm font-semibold text-purple-900 mb-2">
                          Birthday
                        </Body>
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(true)}
                        >
                          <View
                            className={`py-4 px-4 rounded-xl border-2 bg-white ${
                              errors.birthday
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            <Text
                              className={`text-base ${
                                value ? "text-purple-900" : "text-gray-400"
                              }`}
                            >
                              {value
                                ? formatDate(value)
                                : "Select your birthday"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        {errors.birthday && (
                          <Text className="text-sm text-red-500 mt-1">
                            {errors.birthday.message}
                          </Text>
                        )}
                      </View>

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
                              Save
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
                    />
                  )}
                />

                {/* Avatar URL */}
                <Controller
                  control={control}
                  name="avatarUrl"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Avatar URL"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="https://example.com/avatar.jpg"
                      autoCapitalize="none"
                      autoComplete="url"
                      textContentType="URL"
                      keyboardType="url"
                      error={errors.avatarUrl?.message}
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

            {/* Save Button */}
            <View className="mt-3">
              <Button
                variant="primary"
                onPress={handleSubmit(onSubmit)}
                disabled={!isValid || updateProfile.isPending}
              >
                Save
              </Button>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </>
  );
}
