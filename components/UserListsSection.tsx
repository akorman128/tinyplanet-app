import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, FlatList, RefreshControl, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useLists } from "@/hooks/useLists";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { ListCard } from "@/design-system/ListCard";
import { ListWithPlaces, ListCategory } from "@/types/list";
import { colors, EmptyState, LoadingState, ErrorState, Select, SelectOption, Text } from "@/design-system";

const LISTS_PER_PAGE = 10;

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
  const router = useRouter();
  const { getLists } = useLists();
  const currentUserProfile = useRequireProfile();
  const isOwnProfile = userId === currentUserProfile.id;

  const [lists, setLists] = useState<ListWithPlaces[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
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
  const filteredLists = useMemo(() => {
    return lists.filter((list) => {
      const matchesCategory =
        selectedCategory === "all" || list.category === selectedCategory;
      const matchesLocation =
        selectedLocation === "all" || list.location_name === selectedLocation;
      return matchesCategory && matchesLocation;
    });
  }, [lists, selectedCategory, selectedLocation]);

  // Build location options dynamically
  const locationOptions: SelectOption<string>[] = useMemo(() => {
    const options: SelectOption<string>[] = [{ value: "all", label: "All Locations" }];
    uniqueLocations.forEach((location) => {
      options.push({ value: location, label: location });
    });
    return options;
  }, [uniqueLocations]);

  const fetchLists = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh && loading) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const currentOffset = isRefresh ? 0 : offset;
        const { data, total } = await getLists(userId, {
          limit: LISTS_PER_PAGE,
          offset: currentOffset,
        });

        setLists((prev) => (isRefresh ? data : [...prev, ...data]));
        setOffset(isRefresh ? data.length : currentOffset + data.length);
        setHasMore(data.length === LISTS_PER_PAGE);
      } catch (err) {
        console.error("Error fetching lists:", err);
        setError("Failed to load lists");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, offset, loading]
  );

  useEffect(() => {
    setLists([]);
    setOffset(0);
    setHasMore(true);
    setLoading(true);
    fetchLists(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleRefresh = () => fetchLists(true);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchLists();
    }
  };

  const handleListPress = (listId: string) => {
    router.push(`/list/${listId}`);
  };

  const handleCreateList = () => {
    router.push("/create-list");
  };

  if (loading && lists.length === 0) {
    return <LoadingState />;
  }

  if (error && lists.length === 0) {
    return <ErrorState message={error} />;
  }

  const renderFilterBar = () => {
    if (lists.length === 0) return null;

    return (
      <View className="px-6 pb-4 gap-3">
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
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.hex.purple600}
          />
        }
      >
        {isOwnProfile && (
          <View className="px-6 pt-4">
            <Pressable
              onPress={handleCreateList}
              className="bg-purple-600 px-4 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Create List</Text>
            </Pressable>
          </View>
        )}
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
    <View className="flex-1">
      {isOwnProfile && (
        <View className="px-6 pt-4 pb-2">
          <Pressable
            onPress={handleCreateList}
            className="bg-purple-600 px-4 py-3 rounded-lg items-center"
          >
            <Text className="text-white font-semibold">Create List</Text>
          </Pressable>
        </View>
      )}

      {renderFilterBar()}

      {filteredLists.length === 0 ? (
        <EmptyState message="No lists match your filters." />
      ) : (
        <FlatList
          data={filteredLists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            gap: 16,
          }}
          renderItem={({ item }) => (
            <ListCard
              list={item}
              onPress={() => handleListPress(item.id)}
              fullWidth
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.hex.purple600}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}
