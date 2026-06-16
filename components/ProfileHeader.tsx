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
import { AvatarUpload } from "@/components/AvatarUpload";
import { FriendStatusSection } from "@/components/FriendStatusSection";
import { Profile } from "@/types/profile";
import { getAgeFromBirthday } from "@/utils/formatBirthday";
import { useGetBlockStatus } from "@/hooks/useBlock";

interface ProfileHeaderProps {
  profile: Profile;
  topVibes: { emoji: string; count: number }[];
  totalVibeCount: number;
  isViewingOwnProfile: boolean;
  userId?: string;
  onVibePress: () => void;
  onMessagePress: () => void;
  onError: (error: string) => void;
}

export function ProfileHeader({
  profile,
  topVibes,
  totalVibeCount,
  isViewingOwnProfile,
  userId,
  onVibePress,
  onMessagePress,
  onError,
}: ProfileHeaderProps) {
  const age = getAgeFromBirthday(profile.birthday);
  const { data: blockData } = useGetBlockStatus(
    !isViewingOwnProfile ? userId : undefined
  );
  const isBlocked = blockData?.isBlocked ?? false;
  return (
    <>
      <View className="mb-4">
        {isViewingOwnProfile ? (
          <AvatarUpload
            fullName={profile.full_name}
            avatarUrl={profile.avatar_url}
          />
        ) : (
          <Avatar
            fullName={profile.full_name}
            avatarUrl={profile.avatar_url}
            size="large"
          />
        )}
      </View>

      <View className="flex-row items-center justify-center mb-2">
        <Heading className="text-black text-center">
          {profile.full_name}
        </Heading>
      </View>
      <View className="flex-row items-center justify-center mb-4">
        {profile.birthday && age !== null && (
          <Caption className="text-center">
            🎉 {age}
            {profile.invited_by_name ? " • " : ""}
          </Caption>
        )}

        {profile.invited_by_name && (
          <Caption className="text-center">
            🪩 Invited by {profile.invited_by_name}
          </Caption>
        )}
      </View>

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

        {!isViewingOwnProfile && userId && !isBlocked && (
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
