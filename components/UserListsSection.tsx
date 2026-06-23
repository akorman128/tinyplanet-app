import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  Pressable,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useGetLists, useSubscribeToListCreation } from "@/hooks/useLists";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { ListCard } from "@/design-system/ListCard";
import { ListCategory } from "@/types/list";
import { queryKeys } from "@/lib/queryKeys";
import {
  colors,
  EmptyState,
  LoadingState,
  ErrorState,
  Select,
  SelectOption,
  Text,
} from "@/design-system";

type CategoryFilter = ListCategory | "all";

const CATEGORY_OPTIONS: SelectOption<CategoryFilter>[] = [
  { value: "all", label: "All Categories" },
  { value: "nightlife", label: "Nightlife" },
  { value: "eat_drink", label: "Eat & Drink" },
  { value: "activities", label: "Activities" },
  { value: "explore", label: "Explore" },
  { value: "shop", label: "Shop" },
  { value: "work", label: "Work" },
];

interface UserListsSectionProps {
  userId: string;
}

export function UserListsSection({ userId }: UserListsSectionProps) {
  const queryClient = useQueryClient();
  const {
    data: listsResult,
    isLoading: loading,
    error: queryError,
    isRefetching,
  } = useGetLists(userId);
  const subscribeToListCreation = useSubscribeToListCreation();
  const currentUserProfile = useRequireProfile();
  const isOwnProfile = userId === currentUserProfile.id;

  const lists = listsResult?.data ?? [];
  const error = queryError ? "Failed to load lists" : null;

  // Filter state
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("all");
  const [selectedLocation, setSelectedLocation] = useState<string | "all">(
    "all"
  );

  // Get unique locations from lists
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    lists.forEach((list) => {
      if (list.location_name) {
        locations.add(list.location_name);
      }
    });
    return Array.from(locations).sort();
  }, [lists]);

  // Filter lists based on selected filters
  const filteredLists = lists.filter((list) => {
    const matchesCategory =
      selectedCategory === "all" || list.category === selectedCategory;
    const matchesLocation =
      selectedLocation === "all" || list.location_name === selectedLocation;
    return matchesCategory && matchesLocation;
  });

  // Build location options dynamically
  const locationOptions: SelectOption<string>[] = [
    { value: "all", label: "All Locations" },
  ];
  uniqueLocations.forEach((location) => {
    locationOptions.push({ value: location, label: location });
  });

  // Subscribe to realtime list creation events so new lists appear automatically
  useEffect(() => {
    if (!isOwnProfile) return;
    return subscribeToListCreation(() => {});
  }, [isOwnProfile, subscribeToListCreation]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.lists.byUser(userId) });
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const renderFilterBar = () => {
    if (lists.length === 0) return null;

    return (
      <View className="pb-4 gap-3">
        {/* Category Filter */}
        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          value={selectedCategory}
          onChange={setSelectedCategory}
        />

        {/* Location Filter */}
        {uniqueLocations.length > 1 && (
          <Select
            label="Location"
            options={locationOptions}
            value={selectedLocation}
            onChange={setSelectedLocation}
          />
        )}
      </View>
    );
  };

  if (lists.length === 0) {
    return (
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.hex.blue500}
          />
        }
      >
        <EmptyState
          message={
            isOwnProfile
              ? "No lists yet. Create your first list to share your favorite places."
              : "This user hasn't created any lists yet."
          }
        />
      </ScrollView>
    );
  }

  return (
    <FlatList
      className="flex-1"
      data={filteredLists}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 16,
      }}
      ListHeaderComponent={<>{renderFilterBar()}</>}
      ListEmptyComponent={<EmptyState message="No lists match your filters." />}
      renderItem={({ item }) => (
        <Link href={`/list/${item.id}`} asChild>
          <Pressable>
            <Link.AppleZoom>
              <View collapsable={false}>
                <ListCard list={item} fullWidth />
              </View>
            </Link.AppleZoom>
          </Pressable>
        </Link>
      )}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          tintColor={colors.hex.blue500}
        />
      }
    />
  );
}
