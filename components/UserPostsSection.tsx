import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { PostCard } from "@/design-system/PostCard";
import { TravelPlanCard } from "@/design-system/TravelPlanCard";
import { useGetUserPosts } from "@/hooks/useFeed";
import { useGetSavedPosts } from "@/hooks/useSavedPosts";
import { useRequireProfile } from "@/hooks/useRequireProfile";
import { PostWithAuthor } from "@/types/post";
import {
  colors,
  TabBar,
  Tab,
  SectionTitle,
  Caption,
  Text,
} from "@/design-system";
import { queryKeys } from "@/lib/queryKeys";

const isTravelPlanPost = (post: PostWithAuthor): boolean => {
  return post.text.startsWith("🚀 Traveling to");
};

type PostFilter = "posts" | "saved";

const POST_TABS: Tab<PostFilter>[] = [
  { id: "posts", label: "Posts" },
  { id: "saved", label: "Saved" },
];

interface UserPostsSectionProps {
  userId: string;
  initialFilter?: PostFilter;
  onOpenComments?: (postId: string, commentCount: number) => void;
  scrollEnabled?: boolean;
  nestedScrollEnabled?: boolean;
}

export function UserPostsSection({
  userId,
  initialFilter = "posts",
  onOpenComments,
  scrollEnabled = true,
  nestedScrollEnabled = false,
}: UserPostsSectionProps) {
  const queryClient = useQueryClient();
  const currentUserProfile = useRequireProfile();
  const isOwnProfile = userId === currentUserProfile.id;
  const [activeFilter, setActiveFilter] = useState<PostFilter>(initialFilter);

  const userPostsQuery = useGetUserPosts(userId);
  const savedPostsQuery = useGetSavedPosts();

  const isPostsTab = activeFilter === "posts";
  const activeQuery = isPostsTab ? userPostsQuery : savedPostsQuery;
  const posts = activeQuery.data?.pages.flat() ?? [];
  const loading = activeQuery.isPending;
  const refreshing =
    activeQuery.isRefetching && !activeQuery.isFetchingNextPage;
  const error = activeQuery.error?.message ?? null;

  const handleRefresh = async () => {
    await activeQuery.refetch();
  };

  const handleLoadMore = () => {
    if (activeQuery.hasNextPage) {
      activeQuery.fetchNextPage();
    }
  };

  const handleLike = useCallback(
    (postId: string, updates: Partial<PostWithAuthor>) => {
      const key = isPostsTab
        ? queryKeys.posts.userPosts(userId)
        : queryKeys.posts.saved();
      queryClient.setQueryData(
        key,
        (oldData: InfiniteData<PostWithAuthor[]> | undefined) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((p) => (p.id === postId ? { ...p, ...updates } : p))
            ),
          };
        }
      );
    },
    [isPostsTab, userId, queryClient]
  );

  const handleSave = useCallback(
    (postId: string, updates: Partial<PostWithAuthor>) => {
      const key = isPostsTab
        ? queryKeys.posts.userPosts(userId)
        : queryKeys.posts.saved();
      if (!isPostsTab && updates.saved_by_user === false) {
        // If unsaved in "Saved" filter, remove from list
        queryClient.setQueryData(
          key,
          (oldData: InfiniteData<PostWithAuthor[]> | undefined) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) =>
                page.filter((p) => p.id !== postId)
              ),
            };
          }
        );
      } else {
        queryClient.setQueryData(
          key,
          (oldData: InfiniteData<PostWithAuthor[]> | undefined) => {
            if (!oldData?.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) =>
                page.map((p) => (p.id === postId ? { ...p, ...updates } : p))
              ),
            };
          }
        );
      }
    },
    [isPostsTab, userId, queryClient]
  );

  const handleDelete = useCallback(
    (postId: string) => {
      const key = isPostsTab
        ? queryKeys.posts.userPosts(userId)
        : queryKeys.posts.saved();
      queryClient.setQueryData(
        key,
        (oldData: InfiniteData<PostWithAuthor[]> | undefined) => {
          if (!oldData?.pages) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.filter((p) => p.id !== postId)
            ),
          };
        }
      );
    },
    [isPostsTab, userId, queryClient]
  );

  const handleOpenCommentsInternal = (postId: string, commentCount: number) => {
    onOpenComments?.(postId, commentCount);
  };

  if (loading) {
    return (
      <View className="flex-1">
        {isOwnProfile && (
          <TabBar
            tabs={POST_TABS}
            activeTab={activeFilter}
            onTabChange={setActiveFilter}
          />
        )}
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-gray-500">
            Loading {isPostsTab ? "posts" : "saved posts"}...
          </Text>
        </View>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View className="flex-1">
        {isOwnProfile && (
          <TabBar
            tabs={POST_TABS}
            activeTab={activeFilter}
            onTabChange={setActiveFilter}
          />
        )}
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-red-500">{error}</Text>
        </View>
      </View>
    );
  }

  const emptyStateMessage = isPostsTab
    ? { title: "No posts yet", subtitle: "Posts will appear here" }
    : { title: "No saved posts", subtitle: "Posts you save will appear here" };

  if (posts.length === 0) {
    return (
      <View className="flex-1">
        {isOwnProfile && (
          <TabBar
            tabs={POST_TABS}
            activeTab={activeFilter}
            onTabChange={setActiveFilter}
          />
        )}
        <View className="flex-1 items-center justify-center p-6">
          <SectionTitle className="mb-2">
            {emptyStateMessage.title}
          </SectionTitle>
          <Caption className="text-center">
            {emptyStateMessage.subtitle}
          </Caption>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {isOwnProfile && (
        <TabBar
          tabs={POST_TABS}
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
        />
      )}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          isTravelPlanPost(item) ? (
            <TravelPlanCard
              post={item}
              onLike={handleLike}
              onSave={handleSave}
              onDelete={handleDelete}
              onOpenComments={handleOpenCommentsInternal}
            />
          ) : (
            <PostCard
              post={item}
              onLike={handleLike}
              onSave={handleSave}
              onDelete={handleDelete}
              onOpenComments={handleOpenCommentsInternal}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.hex.purple600}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          activeQuery.isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator size="small" color={colors.hex.purple600} />
            </View>
          ) : null
        }
        scrollEnabled={scrollEnabled}
        nestedScrollEnabled={nestedScrollEnabled}
      />
    </View>
  );
}
