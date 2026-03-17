import React from "react";
import { Pressable, Platform } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Icons, colors } from "@/design-system";
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
      <Stack.Screen
        options={{
          title: "Contacts",
          headerRight: Platform.OS === "android" && isOwnProfile
            ? () => (
                <Pressable onPress={() => router.push("/add-contact")}>
                  <Icons.plus size={24} color={colors.black} />
                </Pressable>
              )
            : undefined,
        }}
      />
      {Platform.OS === "ios" && isOwnProfile && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="plus"
            onPress={() => router.push("/add-contact")}
          />
        </Stack.Toolbar>
      )}
      <GestureHandlerRootView className="flex-1 bg-cream">
        <ContactsSection userId={displayUserId} />
      </GestureHandlerRootView>
    </>
  );
}
