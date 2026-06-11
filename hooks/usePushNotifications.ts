import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { router } from "expo-router";

import { useSupabase } from "@/hooks/useSupabase";
import { EAS_PROJECT_ID } from "@/lib/constants";
import { logger } from "@/utils/logger";

export function usePushNotifications() {
  const { session, supabase } = useSupabase();
  const responseListenerRef =
    useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    registerPushToken(userId);

    // Handle notification taps → navigate to chat
    responseListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const friendId =
          response.notification.request.content.data?.friendId as
            | string
            | undefined;
        if (friendId) {
          router.push(`/chat/${friendId}`);
        }
      });

    return () => {
      responseListenerRef.current?.remove();
    };
  }, [session?.user?.id]);

  async function registerPushToken(userId: string) {
    if (!Device.isDevice) return;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });

    const { error } = await supabase.from("push_tokens").upsert(
      { user_id: userId, token: tokenData.data },
      { onConflict: "user_id,token" }
    );

    if (error) {
      logger.error("Failed to save push token:", error.message);
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  }
}
