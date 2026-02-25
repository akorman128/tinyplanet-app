import React from "react";
import { View, Pressable } from "react-native";
import {
  Avatar,
  Badge,
  Caption,
  Heading,
  SocialMediaLinks,
  VibeDisplay,
} from "@/design-system";
import { FriendStatusSection } from "@/components/FriendStatusSection";
import { Profile } from "@/types/profile";

interface ProfileHeaderProps {
  profile: Profile;
  topVibes: { emoji: string; count: number }[];
  totalVibeCount: number;
  isViewingOwnProfile: boolean;
  userId?: string;
  mutualCount: number;
  onVibePress: () => void;
  onMutualsPress: () => void;
  onMessagePress: () => void;
  onError: (error: string) => void;
}

export function ProfileHeader({
  profile,
  topVibes,
  totalVibeCount,
  isViewingOwnProfile,
  userId,
  mutualCount,
  onVibePress,
  onMutualsPress,
  onMessagePress,
  onError,
}: ProfileHeaderProps) {
  return (
    <>
      <View className="mb-4">
        <Avatar
          fullName={profile.full_name}
          avatarUrl={profile.avatar_url}
          size="large"
        />
      </View>

      <View className="flex-row items-center justify-center mb-2">
        <Heading className="text-black text-center">
          {profile.full_name}
        </Heading>
      </View>

      {profile.invited_by_name && (
        <Caption className="text-center mb-1">
          🪩 Invited by {profile.invited_by_name}
        </Caption>
      )}

      <VibeDisplay
        topVibes={topVibes}
        totalVibeCount={totalVibeCount}
        onPress={onVibePress}
      />

      <SocialMediaLinks
        website={profile.website}
        instagram={profile.instagram}
        x={profile.x}
        letterboxd={profile.letterboxd}
        beli={profile.beli}
      />

      <View className="flex-row items-center justify-center gap-2 mb-6">
        {!isViewingOwnProfile && userId && (
          <FriendStatusSection
            userId={userId}
            onError={(errorMessage) => onError(errorMessage)}
          />
        )}

        {!isViewingOwnProfile && mutualCount > 0 && (
          <Pressable onPress={onMutualsPress}>
            <Badge variant="secondary" size="small">
              {mutualCount === 1 ? "1 mutual" : `${mutualCount} mutuals`}
            </Badge>
          </Pressable>
        )}
        {!isViewingOwnProfile && userId && (
          <Pressable onPress={onMessagePress}>
            <Badge variant="default" size="small">
              Message
            </Badge>
          </Pressable>
        )}
      </View>
    </>
  );
}
