import React, { useState } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useGetContacts, useDeleteContact } from "@/hooks/useContacts";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { ContactCard } from "@/design-system/ContactCard";
import { colors, EmptyState, LoadingState, ErrorState } from "@/design-system";

interface ContactsSectionProps {
  userId: string;
}

export function ContactsSection({ userId }: ContactsSectionProps) {
  const router = useRouter();
  const { data: contactsData, isPending: loading, error: queryError, refetch } = useGetContacts(userId);
  const deleteContact = useDeleteContact();
  const currentUserProfile = useRequireProfile();
  const isOwnProfile = userId === currentUserProfile.id;

  const contacts = contactsData?.data ?? [];
  const error = queryError?.message ?? null;

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDeleteContact = (contactId: string, contactName: string) => {
    Alert.alert(
      "Delete Contact",
      `Are you sure you want to delete ${contactName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContact.mutateAsync(contactId);
            } catch (err) {
              Alert.alert("Error", "Failed to delete contact");
            }
          },
        },
      ]
    );
  };

  if (loading && contacts.length === 0) {
    return <LoadingState />;
  }

  if (error && contacts.length === 0) {
    return <ErrorState message={error} />;
  }

  if (contacts.length === 0) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.hex.purple600}
          />
        }
      >
        <EmptyState
          message={
            isOwnProfile
              ? "Add doctors, plumbers, an auto shop, realtors, someone somebody might need."
              : "This user hasn't added any contacts yet."
          }
        />
      </ScrollView>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 24,
          gap: 12,
        }}
        renderItem={({ item }) => (
          <ContactCard
            name={item.name}
            phone={item.phone}
            email={item.email}
            company={item.company}
            onPress={() => router.push(`/contact/${item.id}`)}
            onDelete={
              isOwnProfile
                ? () => handleDeleteContact(item.id, item.name)
                : undefined
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.hex.purple600}
          />
        }
      />
    </View>
  );
}
