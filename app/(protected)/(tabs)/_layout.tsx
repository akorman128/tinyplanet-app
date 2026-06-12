import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors } from "@/design-system/colors";

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={colors.black}
      minimizeBehavior="onScrollDown"
      labelVisibilityMode="unlabeled"
    >
      <NativeTabs.Trigger name="map">
        <NativeTabs.Trigger.Icon sf="globe" md="public" />
        <NativeTabs.Trigger.Label hidden>Map</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="feed">
        <NativeTabs.Trigger.Icon
          sf={{ default: "doc.richtext", selected: "doc.richtext.fill" }}
          md="dynamic_feed"
        />
        <NativeTabs.Trigger.Label hidden>Feed</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Icon
          sf={{ default: "message", selected: "message.fill" }}
          md="chat"
        />
        <NativeTabs.Trigger.Label hidden>Messages</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="create" role="search">
        <NativeTabs.Trigger.Icon
          sf={{ default: "plus.circle", selected: "plus.circle.fill" }}
          md="add_circle"
        />
        <NativeTabs.Trigger.Label hidden>Create</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
