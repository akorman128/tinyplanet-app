import React, { useCallback } from "react";
import { FlatList, RefreshControl, View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useGetFeed } from "@/hooks/useFeed";
import { PostCard } from "../design-system/PostCard";
import { TravelPlanCard } from "../design-system/TravelPlanCard";
import { EmptyState, LoadingState, ErrorState, colors } from "@/design-system";
import { PostWithAuthor } from "@/types/post";
import { useCommentCountStore } from "@/stores/commentCountStore";
import { queryKeys } from "@/lib/queryKeys";

const isTravelPlanPost = (post: PostWithAuthor): boolean => {
  return post.text.startsWith("🚀 Traveling to");
};

export function FeedView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data,
    isPending,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useGetFeed();

  const posts = data?.pages.flat() ?? [];
  const consume = useCommentCountStore((s) => s.consume);

  // Sync comment counts when returning from comments screen
  useFocusEffect(
    useCallback(() => {
      // Update cached posts with fresh comment counts
      queryClient.setQueryData(queryKeys.posts.feed(), (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: PostWithAuthor[]) =>
            page.map((post) => {
              const newCount = consume(post.id);
              if (newCount !== undefined) {
                return { ...post, comment_count: newCount };
              }
              return post;
            })
          ),
        };
      });
    }, [consume, queryClient])
  );

  const handleLikePost = useCallback(
    (postId: string, updates: Partial<PostWithAuthor>) => {
      queryClient.setQueryData(queryKeys.posts.feed(), (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: PostWithAuthor[]) =>
            page.map((p) => (p.id === postId ? { ...p, ...updates } : p))
          ),
        };
      });
    },
    [queryClient]
  );

  const handleSavePost = useCallback(
    (postId: string, updates: Partial<PostWithAuthor>) => {
      queryClient.setQueryData(queryKeys.posts.feed(), (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: PostWithAuthor[]) =>
            page.map((p) => (p.id === postId ? { ...p, ...updates } : p))
          ),
        };
      });
    },
    [queryClient]
  );

  const handlePostDelete = useCallback(
    (postId: string) => {
      queryClient.setQueryData(queryKeys.posts.feed(), (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: PostWithAuthor[]) =>
            page.filter((p) => p.id !== postId)
          ),
        };
      });
    },
    [queryClient]
  );

  const handleOpenComments = useCallback(
    (postId: string, commentCount: number) => {
      router.push({
        pathname: "/comments",
        params: { postId, commentCount: String(commentCount) },
      });
    },
    [router]
  );

  const handleRefresh = async () => {
    await refetch();
  };

  if (isPending) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (posts.length === 0) {
    return <EmptyState message="Your tiny planet is empty." />;
  }

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={colors.hex.purple600} />
      </View>
    );
  };

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) =>
        isTravelPlanPost(item) ? (
          <TravelPlanCard
            post={item}
            onLike={handleLikePost}
            onSave={handleSavePost}
            onDelete={handlePostDelete}
            onOpenComments={handleOpenComments}
          />
        ) : (
          <PostCard
            post={item}
            onLike={handleLikePost}
            onSave={handleSavePost}
            onDelete={handlePostDelete}
            onOpenComments={handleOpenComments}
          />
        )
      }
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={handleRefresh}
          tintColor={colors.hex.purple600}
        />
      }
      onEndReached={() => {
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      contentContainerClassName="pb-20"
    />
  );
}
