import React from "react";
import { Pressable } from "react-native";
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
          headerRight: isOwnProfile
            ? () => (
                <Pressable onPress={() => router.push("/add-contact")}>
                  <Icons.plus size={24} color={colors.black} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <GestureHandlerRootView className="flex-1 bg-white">
        <ContactsSection userId={displayUserId} />
      </GestureHandlerRootView>
    </>
  );
}
