import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useFeed } from "@/hooks/useFeed";
import { PostCard } from "../design-system/PostCard";
import { TravelPlanCard } from "../design-system/TravelPlanCard";
import { EmptyState, LoadingState, ErrorState, colors } from "@/design-system";
import { PostWithAuthor } from "@/types/post";
import { useCommentCountStore } from "@/stores/commentCountStore";

const isTravelPlanPost = (post: PostWithAuthor): boolean => {
  return post.text.startsWith("🚀 Traveling to");
};

const PAGE_SIZE = 10;

export function FeedView() {
  const router = useRouter();
  const { getFeed } = useFeed();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const getFeedRef = useRef(getFeed);
  useEffect(() => {
    getFeedRef.current = getFeed;
  }, [getFeed]);

  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const consume = useCommentCountStore((s) => s.consume);

  // Sync comment counts when returning from comments screen
  useFocusEffect(
    useCallback(() => {
      setPosts((prev) =>
        prev.map((post) => {
          const newCount = consume(post.id);
          if (newCount !== undefined) {
            return { ...post, comment_count: newCount };
          }
          return post;
        })
      );
    }, [consume])
  );

  const loadFeed = useCallback(async () => {
    if (isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    hasLoadedRef.current = true;

    try {
      setError(null);
      const result = await getFeedRef.current({ limit: PAGE_SIZE, offset: 0 });
      setPosts(result.data);
      setOffset(PAGE_SIZE);
      setHasMore(result.data.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error loading feed:", err);
      setError("Failed to load feed");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || refreshing) return;

    setLoadingMore(true);
    try {
      const result = await getFeedRef.current({ limit: PAGE_SIZE, offset });
      setPosts((prev) => [...prev, ...result.data]);
      setOffset((prev) => prev + PAGE_SIZE);
      setHasMore(result.data.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error loading more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [offset, loadingMore, hasMore, refreshing]);

  const handleLikePost = useCallback(
    (postId: string, updates: Partial<PostWithAuthor>) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const handleSavePost = useCallback(
    (postId: string, updates: Partial<PostWithAuthor>) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const handlePostDelete = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const handleOpenComments = useCallback(
    (postId: string, commentCount: number) => {
      router.push({
        pathname: "/comments",
        params: { postId, commentCount: String(commentCount) },
      });
    },
    [router]
  );

  if (loading && !refreshing) {
    return <LoadingState />;
  }

  if (error && !refreshing) {
    return <ErrorState message={error} />;
  }

  if (posts.length === 0 && !loading) {
    return <EmptyState message="Your tiny planet is empty." />;
  }

  const renderFooter = () => {
    if (!loadingMore) return null;
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
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.hex.purple600}
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      contentContainerClassName="pb-20"
    />
  );
}
