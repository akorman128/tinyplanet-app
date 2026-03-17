import React from "react";
import { View, Linking, Alert, Pressable, Platform } from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { useGetContact, useDeleteContact } from "@/hooks/useContacts";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import {
  LoadingState,
  ErrorState,
  GlassInfoCard,
  GlassInfoItem,
  Icons,
  colors,
  Text,
} from "@/design-system";

export default function ContactDetailScreen() {
  const router = useRouter();
  const { contactId } = useLocalSearchParams<{ contactId: string }>();
  const {
    data: contact,
    isPending: loading,
    error: queryError,
  } = useGetContact(contactId);
  const deleteContact = useDeleteContact();
  const currentUserProfile = useRequireProfile();

  const isOwnContact = contact?.user_id === currentUserProfile.id;
  const error = queryError?.message ?? null;

  const handleCall = () => {
    if (contact?.phone) {
      const phoneNumber = contact.phone.replace(/[^0-9]/g, "");
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleEmail = () => {
    if (contact?.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleDelete = () => {
    if (!contact) return;

    Alert.alert(
      "Delete Contact",
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContact.mutateAsync(contact.id);
              router.back();
            } catch (err) {
              Alert.alert("Error", "Failed to delete contact");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Contact" }} />
        <View className="flex-1 bg-cream">
          <LoadingState />
        </View>
      </>
    );
  }

  if (error || !contact) {
    return (
      <>
        <Stack.Screen options={{ title: "Contact" }} />
        <View className="flex-1 bg-cream">
          <ErrorState message={error || "Contact not found"} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Contact",
          headerRight:
            Platform.OS === "android" && isOwnContact
              ? () => (
                  <Pressable onPress={handleDelete}>
                    <Icons.trash size={24} color={colors.hex.error} />
                  </Pressable>
                )
              : undefined,
        }}
      />
      {Platform.OS === "ios" && isOwnContact && (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="trash"
            tintColor={colors.hex.error}
            onPress={handleDelete}
          />
        </Stack.Toolbar>
      )}
      <View className="flex-1 bg-cream">
        <View className="px-6 pt-6">
          {/* Name */}
          <Text className="text-3xl font-bold text-black mb-2">
            {contact.name}
          </Text>

          {/* Company */}
          {contact.company && (
            <Text className="text-lg text-gray-600 mb-6">
              {contact.company}
            </Text>
          )}

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-6">
            {contact.phone && (
              <Pressable
                onPress={handleCall}
                className="flex-1 bg-purple-600 py-3 rounded-lg items-center justify-center"
              >
                <Text className="text-white font-semibold">Call</Text>
              </Pressable>
            )}
            {contact.email && (
              <Pressable
                onPress={handleEmail}
                className="flex-1 bg-purple-100 py-3 rounded-lg items-center justify-center"
              >
                <Text className="text-purple-600 font-semibold">Email</Text>
              </Pressable>
            )}
          </View>

          {/* Contact Info Card */}
          <GlassInfoCard className="w-full mb-4">
            {contact.phone && (
              <GlassInfoItem label="Phone" value={contact.phone} />
            )}
            {contact.email && (
              <GlassInfoItem label="Email" value={contact.email} />
            )}
            {contact.company && (
              <GlassInfoItem label="Company" value={contact.company} />
            )}
            {contact.location_name && (
              <GlassInfoItem label="Location" value={contact.location_name} />
            )}
          </GlassInfoCard>

          {/* Note */}
          {contact.note && (
            <View className="bg-gray-50 rounded-xl p-4">
              <Text className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Note
              </Text>
              <Text className="text-base text-gray-700">{contact.note}</Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
}
