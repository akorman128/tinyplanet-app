import React from "react";
import { View, Pressable } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScreenHeader, Icons, colors } from "@/design-system";
import { ContactsSection } from "@/components/ContactsSection";
import { useRequireProfile } from "@/hooks/useRequireProfile";

export default function UserContactsScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const currentUserProfile = useRequireProfile();

  const displayUserId = userId || currentUserProfile.id;
  const isOwnProfile = !userId || userId === currentUserProfile.id;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white pt-8">
        <ScreenHeader
          title="Contacts"
          showBackButton={true}
          rightComponent={
            isOwnProfile ? (
              <Pressable onPress={() => router.push("/add-contact")}>
                <Icons.plus size={24} color={colors.hex.purple600} />
              </Pressable>
            ) : undefined
          }
        />
        <ContactsSection userId={displayUserId} />
      </View>
    </>
  );
}
